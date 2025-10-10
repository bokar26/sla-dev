from fastapi import APIRouter
from ..core.settings import settings
from ..internal_index import internal_health, get_internal_corpus
import os, json, pathlib, random

router = APIRouter(prefix="/v1/integration", tags=["integration"])

@router.get("/status")
def integration_status():
    ih = internal_health()
    return {
        "internal_count": ih.get("count", 0),
        "providers": {
            "tavily": bool(getattr(settings, 'TAVILY_API_KEY', None)),
            "serper": bool(getattr(settings, 'SERPER_API_KEY', None)),
            "bing": bool(getattr(settings, 'BING_SEARCH_KEY', None)),
        },
        "env": {
            "SUPPLIERS_DATA": os.getenv("SUPPLIERS_DATA") or "",
        }
    }

@router.post("/seed-dev")
def seed_dev():
    """
    Seeds a small internal dataset for development and points SUPPLIERS_DATA to it.
    Safe to run repeatedly; idempotent.
    """
    root = pathlib.Path(__file__).resolve().parents[3]  # services/api
    data_dir = root / "data" / "dev_suppliers"
    data_dir.mkdir(parents=True, exist_ok=True)
    fp = data_dir / "suppliers.json"

    # Mini corpus covering t-shirts/jeans/outerwear in China/Vietnam with customization.
    sample = []
    brands = ["Jiangsu Garments Co.", "Shenzhen Apparel Ltd.", "Ningbo Textiles", "Hanoi Garment JV",
              "Saigon Wearhouse", "Guangzhou Knit Co.", "Dongguan OEM Works", "Haiphong Denim",
              "Zhejiang Outerwear", "Hunan Fabrics"]
    cats = [["T-Shirts","Casualwear"], ["Jeans","Denim"], ["Outerwear","Jackets"]]
    countries = ["China", "Vietnam"]
    for i in range(60):
        name = random.choice(brands) + f" #{1000+i}"
        cat = random.choice(cats)
        ctry = random.choice(countries)
        rec = {
            "id": f"dev_{i}",
            "name": name,
            "country": ctry,
            "materials": ["Cotton","Polyester","Spandex"][0:random.randint(1,3)],
            "certs": ["ISO9001","BSCI","OEKO-TEX"][0:random.randint(1,3)],
            "moq": random.choice([100,300,500,1000]),
            "lead_days": random.choice([15,25,35]),
            "price_usd": random.choice([1.8,2.2,2.9,3.5,4.2]),
            "url": f"https://example.com/{i}",
            "supports_customization": True,
            "product_types": cat,
            "description": f"{ctry} OEM/ODM for {', '.join(cat)}; strong export capacity."
        }
        sample.append(rec)

    with fp.open("w", encoding="utf-8") as f:
        json.dump(sample, f, ensure_ascii=False, indent=2)

    # Tell the running process where to read suppliers from (you still need to set env for prod)
    os.environ["SUPPLIERS_DATA"] = str(data_dir)

    # Warm the cache
    _ = get_internal_corpus()

    return {"ok": True, "path": str(data_dir), "count": len(sample)}
