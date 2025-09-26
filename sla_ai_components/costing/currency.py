from __future__ import annotations
from decimal import Decimal

# TODO: wire to real FX; mock 1:1 for now
def convert_to_usd(amount: float, currency: str) -> Decimal:
    return Decimal(str(amount)).quantize(Decimal("0.0001"))
