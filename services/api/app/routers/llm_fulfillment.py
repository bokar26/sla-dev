from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any
import os
from openai import OpenAI

router = APIRouter()

# ---------- Input ----------
Incoterm = Literal["EXW","FCA","FAS","FOB","CFR","CIF","CPT","CIP","DAP","DPU","DDP"]
Mode = Literal["sea","air","rail","truck","express","multimodal"]

class FulfillmentRequest(BaseModel):
    # core
    origin_country: str
    destination_country: str
    incoterm: Incoterm
    ready_date: Optional[str] = None  # ISO date
    quantity: Optional[int] = None
    weight_kg: Optional[float] = None
    cbm: Optional[float] = None
    units_per_carton: Optional[int] = None
    num_cartons: Optional[int] = None
    product_type: Optional[str] = None
    product_description: Optional[str] = None
    hs_code: Optional[str] = None
    customization: Optional[Literal["yes","no","any"]] = "any"
    target_mode: Optional[Mode] = None
    budget_usd: Optional[float] = None
    priority: Optional[Literal["speed","cost","balanced","low_co2"]] = "balanced"
    # incoterm-dependent fields (optional; router will pass through)
    origin_city: Optional[str] = None
    origin_port: Optional[str] = None
    dest_city: Optional[str] = None
    dest_port: Optional[str] = None
    exporter_ready: Optional[bool] = None
    importer_ready: Optional[bool] = None
    # freeform
    notes: Optional[str] = None

# ---------- Output ----------
class PlanStep(BaseModel):
    title: str
    details: str

class RouteOption(BaseModel):
    option_id: str
    mode: Mode
    incoterm: Incoterm
    eta_days: int
    cost_low_usd: float
    cost_high_usd: float
    ports: List[str] = []
    carriers: List[str] = []
    steps: List[PlanStep] = []
    documents: List[str] = []
    risks: List[str] = []
    carbon_note: Optional[str] = None
    rationale: str
    source_notes: Optional[str] = None

class FulfillmentResponse(BaseModel):
    chosen_option_id: Optional[str] = None
    options: List[RouteOption]
    reasoning: str

# ---------- Prompt builder ----------
INCOTERM_HINTS: Dict[str,str] = {
    "EXW": "Buyer handles pickup at seller's facility; needs export clearance arranged.",
    "FCA": "Seller delivers to carrier nominated by buyer; export cleared by seller.",
    "FAS": "Seller places goods alongside vessel at named port of shipment.",
    "FOB": "Seller loads goods on vessel at named port; risk transfers onboard.",
    "CFR": "Seller pays cost+freight to named port; risk transfers onboard.",
    "CIF": "Like CFR + seller provides insurance to named destination port.",
    "CPT": "Seller pays carriage to named destination; risk on first carrier handover.",
    "CIP": "Like CPT + insurance to named place.",
    "DAP": "Seller delivers ready for unloading at destination place; buyer handles import.",
    "DPU": "Seller delivers unloaded at destination place; buyer handles import.",
    "DDP": "Seller bears all costs/risk incl. import clearance and duties to destination.",
}

DOCS_MINIMUM = (
  "- Commercial Invoice\n"
  "- Packing List\n"
  "- Bill of Lading / Air Waybill (as applicable)\n"
  "- Certificate of Origin (if needed)\n"
  "- HS Code(s) & product description\n"
  "- Any licenses/restrictions if applicable"
)

def build_prompt(payload: FulfillmentRequest) -> str:
    # collapse inputs into a clean deterministic prompt
    incoterm_hint = INCOTERM_HINTS.get(payload.incoterm, "")
    lines = [
        "You are a logistics planner. Produce a structured shipping plan as JSON.",
        "Use the following priorities and constraints.",
        "",
        "INPUT:",
        f"- Origin: {payload.origin_country} ({payload.origin_city or ''}) {payload.origin_port or ''}",
        f"- Destination: {payload.destination_country} ({payload.dest_city or ''}) {payload.dest_port or ''}",
        f"- Incoterm: {payload.incoterm} ({incoterm_hint})",
        f"- Ready date: {payload.ready_date or 'unspecified'}",
        f"- Quantity: {payload.quantity or 'unspecified'} units; cartons: {payload.num_cartons or 'unspecified'}; units/carton: {payload.units_per_carton or 'unspecified'}",
        f"- Weight: {payload.weight_kg or 'unspecified'} kg; Volume: {payload.cbm or 'unspecified'} cbm",
        f"- Product type: {payload.product_type or 'unspecified'}",
        f"- Product description: {payload.product_description or 'unspecified'}",
        f"- HS code: {payload.hs_code or 'unspecified'}",
        f"- Customization: {payload.customization or 'any'}",
        f"- Preferred mode: {payload.target_mode or 'any'}",
        f"- Budget: {payload.budget_usd or 'unspecified'} USD",
        f"- Priority: {payload.priority or 'balanced'}",
        f"- Notes: {payload.notes or '—'}",
        "",
        "CONSIDERATIONS:",
        "- Select realistic routes (sea/air/rail/truck/express) based on incoterm and countries.",
        "- Include named ports/airports where possible. Include typical carriers/forwarders.",
        "- Provide ETA (days) and cost ranges (USD).",
        "- List required documents (minimum):",
        DOCS_MINIMUM,
        "- Point out risks (holidays, port congestion, customs complexity).",
        "- Respect the incoterm responsibilities when detailing steps.",
        "",
        "OUTPUT JSON SCHEMA:",
        """{
  "chosen_option_id": "string (one of option_id or null)",
  "options": [{
    "option_id": "string",
    "mode": "sea|air|rail|truck|express|multimodal",
    "incoterm": "EXW|FCA|FAS|FOB|CFR|CIF|CPT|CIP|DAP|DPU|DDP",
    "eta_days": 0,
    "cost_low_usd": 0,
    "cost_high_usd": 0,
    "ports": ["..."],
    "carriers": ["..."],
    "steps": [{"title":"...","details":"..."}],
    "documents": ["..."],
    "risks": ["..."],
    "carbon_note": "optional",
    "rationale": "brief why this option fits",
    "source_notes": "optional"
  }],
  "reasoning": "overall reasoning text"
}""",
        "",
        "Return only valid JSON; do not include markdown."
    ]
    return "\n".join(lines)

# ---------- Route ----------
@router.post("/v1/llm/fulfillment-plan", response_model=FulfillmentResponse)
def llm_fulfillment_plan(payload: FulfillmentRequest):
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY missing on server")

    prompt = build_prompt(payload)
    client = OpenAI()

    model = os.getenv("OPENAI_MODEL_SEARCH", "gpt-4o-mini")
    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        text = resp.choices[0].message.content
    except Exception as e:
        error_msg = str(e)
        if "quota" in error_msg.lower() or "429" in error_msg:
            # Fallback: return a basic plan structure
            return FulfillmentResponse(
                chosen_option_id="fallback_sea",
                options=[
                    RouteOption(
                        option_id="fallback_sea",
                        mode="sea",
                        incoterm=payload.incoterm,
                        eta_days=21,
                        cost_low_usd=800,
                        cost_high_usd=1200,
                        ports=[payload.origin_port or "Origin Port", payload.dest_port or "Destination Port"],
                        carriers=["Maersk", "COSCO", "Evergreen"],
                        steps=[
                            PlanStep(title="Export Documentation", details="Prepare commercial invoice, packing list, and export license"),
                            PlanStep(title="Port Loading", details=f"Load cargo at {payload.origin_port or 'origin port'}"),
                            PlanStep(title="Ocean Transit", details="Sea freight transit to destination"),
                            PlanStep(title="Port Discharge", details=f"Discharge cargo at {payload.dest_port or 'destination port'}"),
                            PlanStep(title="Import Clearance", details="Complete customs clearance and delivery")
                        ],
                        documents=["Commercial Invoice", "Packing List", "Bill of Lading", "Certificate of Origin"],
                        risks=["Port congestion", "Weather delays", "Customs clearance delays"],
                        rationale="Standard sea freight route with competitive pricing and reliable carriers",
                        source_notes="Fallback plan due to OpenAI quota exceeded"
                    )
                ],
                reasoning="Generated fallback plan due to API quota limitations. This represents a typical sea freight route with standard documentation requirements."
            )
        else:
            raise HTTPException(status_code=502, detail=f"OpenAI error: {e}")

    import json
    try:
        data = json.loads(text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM JSON parse error: {e}")

    return data
