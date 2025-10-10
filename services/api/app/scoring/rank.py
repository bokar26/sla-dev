from __future__ import annotations
from typing import Dict, Any, List
from .needs import Needs

W = {
    "category": 0.35,
    "capability": 0.25,
    "quality": 0.20,
    "moq_qty": 0.10,
    "country": 0.05,
    "custom": 0.05,
}

def _contains_any(hay, needles):
    h = " ".join(hay or []).lower()
    return any(n.lower() in h for n in (needles or []))

def score_supplier(s: Dict[str, Any], needs: Needs, prefer_country: str|None) -> float:
    # Normalize fields from internal row
    cat = s.get("product_types") or []
    mats = s.get("materials") or []
    procs = s.get("processes") or []
    moq = s.get("moq")
    cust = s.get("customization")
    qual = s.get("quality_signals") or {}
    certs = qual.get("certs") or []
    export = qual.get("export_markets") or []
    membership = qual.get("membership") or ""

    # If needs is empty, give a base score
    if not needs.productName and not needs.category and not needs.materials and not needs.processes:
        # Base score for any supplier when no specific needs
        base_score = 60.0
        # Add quality bonus
        if certs: base_score += 10
        if export: base_score += 10
        if membership: base_score += 5
        return min(100.0, base_score)

    # Category/product match - be more lenient
    cat_ok = 0.0
    if needs.category and _contains_any(cat, [needs.category]):
        cat_ok = 1.0
    elif needs.productName and _contains_any(cat, [needs.productName]):
        cat_ok = 1.0
    elif needs.productName and _contains_any(cat, [needs.productName.lower()]):
        cat_ok = 0.8
    else:
        # Give some score even if no exact match
        cat_ok = 0.3

    # Capability: materials/process overlap
    cap_ok = 0.0
    if needs.materials:
        cap_ok += 0.6 if _contains_any(mats, needs.materials) else 0.2
    if needs.processes:
        cap_ok += 0.4 if _contains_any(procs, needs.processes) else 0.1
    else:
        cap_ok = 0.5  # Default capability score

    # Quality signals
    q = 0.0
    if certs: q += 0.4
    if export: q += 0.4
    if membership: q += 0.2
    if not certs and not export and not membership:
        q = 0.3  # Default quality score

    # MOQ/quantity fit (simple heuristic)
    mq = 0.0
    if needs.quantity and moq:
        try:
            moqv = int(str(moq).split()[0])
            mq = 1.0 if moqv <= needs.quantity else 0.4
        except Exception:
            mq = 0.5
    elif needs.quantity and not moq:
        mq = 0.6
    else:
        mq = 0.5

    # Country preference/penalty
    c = 0.5
    scountry = (s.get("country") or "").lower()
    if prefer_country:
        c = 1.0 if scountry == prefer_country.lower() else 0.6
    else:
        c = 0.7  # Default country score

    # Customization ability
    cust_ok = 0.7 if needs.customization and (cust in (True, "yes", "oem", "odm", "oem/odm")) else (0.5 if needs.customization else 0.5)

    score = (
        W["category"]   * cat_ok +
        W["capability"] * cap_ok  +
        W["quality"]    * q       +
        W["moq_qty"]    * mq      +
        W["country"]    * c       +
        W["custom"]     * cust_ok
    ) * 100.0

    # bound
    return max(0.0, min(100.0, score))
