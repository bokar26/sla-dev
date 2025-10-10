INCOTERMS = {
    # Seller/Buyer responsibility is a simple hint for UI; not a legal definition.
    "EXW": {
        "label": "Ex Works",
        "required_fields": ["origin_city", "origin_country", "pickup_ready_date"],
        "buyer_responsibilities": ["Export clearance", "Main carriage", "Insurance", "Import clearance", "Delivery to destination"],
        "seller_responsibilities": ["Goods ready at premises"],
        "notes": "Buyer handles all logistics from seller's door."
    },
    "FCA": {
        "label": "Free Carrier",
        "required_fields": ["origin_city", "origin_country", "handoff_location"],
        "buyer_responsibilities": ["Main carriage", "Insurance", "Import clearance", "Delivery"],
        "seller_responsibilities": ["Export clearance", "Handoff to carrier at named place"]
    },
    "FAS": {"label":"Free Alongside Ship","required_fields":["origin_port","cutoff_date"]},
    "FOB": {"label":"Free On Board","required_fields":["origin_port","vessel_cutoff_date"]},
    "CFR": {"label":"Cost & Freight","required_fields":["origin_port","destination_port"]},
    "CIF": {"label":"Cost, Insurance & Freight","required_fields":["origin_port","destination_port","insured_value_usd"]},
    "CPT": {"label":"Carriage Paid To","required_fields":["handoff_location","destination_city","destination_country"]},
    "CIP": {"label":"Carriage & Insurance Paid","required_fields":["handoff_location","destination_city","destination_country","insured_value_usd"]},
    "DAP": {"label":"Delivered At Place","required_fields":["destination_city","destination_country","delivery_address"]},
    "DPU": {"label":"Delivered at Place Unloaded","required_fields":["destination_city","destination_country","unload_site"]},
    "DDP": {
        "label":"Delivered Duty Paid",
        "required_fields":["origin_city","origin_country","destination_city","destination_country","delivery_address"],
        "notes":"Seller handles all logistics & duties to destination."
    }
}
