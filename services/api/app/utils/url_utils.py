import re

def _ensure_scheme(u: str) -> str:
    u = u.strip()
    if not u:
        return ""
    if u.startswith("//"):
        return "https:" + u
    if not re.match(r"^https?://", u, re.I):
        return "https://" + u
    return u

def prefer_url(row: dict) -> str:
    # Priority: official website > domain > site/homepage > marketplace store
    candidates = [
        row.get("website"),
        row.get("homepage"),
        row.get("site"),
        row.get("url"),
        row.get("domain"),
        row.get("alibaba_url"),
        row.get("made_in_china_url"),
    ]
    for c in candidates:
        if isinstance(c, str) and c.strip():
            u = _ensure_scheme(c)
            # crude filter: ignore obvious non-urls
            if "." in u:
                return u
    return ""
