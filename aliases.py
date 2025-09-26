"""
Aliases for product types and materials to improve search matching
"""

# Product type aliases - maps common terms to standardized product types
PRODUCT_ALIASES = {
    "denim": [
        "jeans", "denim jeans", "denim jacket", "denim shirt", "denim pants", 
        "denim shorts", "denim skirt", "denim overalls", "denim vest",
        "selvedge", "raw denim", "washed denim", "stretch denim"
    ],
    "knitwear": [
        "sweater", "sweaters", "sweatshirt", "sweatshirts", "hoodie", "hoodies",
        "t-shirt", "tshirt", "t-shirts", "tshirts", "polo", "polos", "polo shirt",
        "cardigan", "cardigans", "jumper", "jumpers", "pullover", "pullovers",
        "tank top", "tank tops", "vest", "vests", "turtleneck", "turtlenecks"
    ],
    "woven": [
        "shirt", "shirts", "blouse", "blouses", "dress", "dresses", "pants", 
        "trousers", "slacks", "jacket", "jackets", "coat", "coats", "suit", "suits",
        "skirt", "skirts", "shorts", "overalls", "jumpsuit", "jumpsuits",
        "formal wear", "business wear", "casual wear"
    ],
    "activewear": [
        "sportswear", "athletic wear", "gym wear", "fitness wear", "workout clothes",
        "training wear", "performance wear", "athleisure", "sports apparel",
        "exercise clothes", "fitness apparel", "gym clothes"
    ],
    "lingerie": [
        "underwear", "intimate wear", "under garments", "undergarments",
        "bra", "bras", "panties", "panty", "briefs", "boxers", "boxer shorts",
        "sleepwear", "nightwear", "pajamas", "pyjamas", "nightgown", "nightgowns"
    ],
    "accessories": [
        "hat", "hats", "cap", "caps", "scarf", "scarves", "bag", "bags", "belt", "belts",
        "gloves", "glove", "socks", "sock", "stockings", "stocking", "tie", "ties",
        "handbag", "handbags", "backpack", "backpacks", "wallet", "wallets"
    ],
    "swimwear": [
        "swimsuit", "swimsuits", "bikini", "bikinis", "trunks", "swimming trunks",
        "board shorts", "board short", "swimming costume", "swimming costumes",
        "beachwear", "beach wear", "swimming wear"
    ],
    "footwear": [
        "shoes", "shoe", "boots", "boot", "sneakers", "sneaker", "sandals", "sandal",
        "flats", "flat", "heels", "heel", "loafers", "loafer", "oxfords", "oxford",
        "pumps", "pump", "mules", "mule", "espadrilles", "espadrille"
    ]
}

# Material aliases - maps common terms to standardized material types
MATERIAL_ALIASES = {
    "cotton": [
        "cotton", "organic cotton", "pima cotton", "egyptian cotton", "supima cotton",
        "cotton blend", "cotton-polyester", "cotton-poly", "cotton-spandex"
    ],
    "polyester": [
        "polyester", "poly", "poly blend", "polyester blend", "poly-cotton",
        "poly-spandex", "polyester-spandex", "polyamide", "nylon"
    ],
    "denim": [
        "denim", "denim fabric", "denim cloth", "denim material", "denim cotton",
        "selvedge denim", "raw denim", "washed denim", "stretch denim"
    ],
    "leather": [
        "leather", "genuine leather", "full grain leather", "top grain leather",
        "suede", "suede leather", "nappa leather", "patent leather", "faux leather",
        "vegan leather", "pu leather", "pvc leather"
    ],
    "wool": [
        "wool", "merino wool", "cashmere", "cashmere wool", "alpaca", "alpaca wool",
        "angora", "angora wool", "mohair", "mohair wool", "lambswool", "lamb wool"
    ],
    "silk": [
        "silk", "silk fabric", "silk material", "mulberry silk", "wild silk",
        "tussah silk", "dupioni silk", "charmeuse silk", "habotai silk"
    ],
    "synthetic": [
        "synthetic", "synthetic fiber", "synthetic fabric", "acrylic", "acrylic fiber",
        "spandex", "elastane", "lycra", "polyurethane", "pu", "pvc", "vinyl"
    ],
    "blend": [
        "blend", "blended", "mixed", "combination", "cotton blend", "polyester blend",
        "wool blend", "silk blend", "synthetic blend", "natural blend"
    ]
}

# Brand aliases - maps brand names to their variations
BRAND_ALIASES = {
    "nike": ["nike", "nike inc", "nike corporation"],
    "adidas": ["adidas", "adidas ag", "adidas group"],
    "h&m": ["h&m", "h&m group", "hennes & mauritz", "hennes and mauritz"],
    "zara": ["zara", "zara fashion", "inditex"],
    "gap": ["gap", "gap inc", "gap corporation"],
    "levi's": ["levi's", "levis", "levi strauss", "levi strauss & co"],
    "uniqlo": ["uniqlo", "fast retailing", "uniqlo co"],
    "target": ["target", "target corporation", "target stores"],
    "walmart": ["walmart", "walmart inc", "walmart stores"],
    "mango": ["mango", "mango fashion", "mango group"],
    "tommy hilfiger": ["tommy hilfiger", "tommy hilfiger corporation", "pvhl"],
    "ralph lauren": ["ralph lauren", "ralph lauren corporation", "polo ralph lauren"],
    "calvin klein": ["calvin klein", "calvin klein inc", "pvhl"],
    "victoria's secret": ["victoria's secret", "victoria secret", "l brands"],
    "american eagle": ["american eagle", "american eagle outfitters", "aeo"],
    "abercrombie": ["abercrombie", "abercrombie & fitch", "abercrombie and fitch"],
    "hollister": ["hollister", "hollister co", "abercrombie & fitch"],
    "express": ["express", "express inc", "express fashion"],
    "urban outfitters": ["urban outfitters", "urban outfitters inc", "anthropologie"],
    "anthropologie": ["anthropologie", "anthropologie group", "urban outfitters"],
    "free people": ["free people", "free people movement", "urban outfitters"],
    "j.crew": ["j.crew", "jcrew", "j.crew group"],
    "banana republic": ["banana republic", "banana republic co", "gap inc"],
    "old navy": ["old navy", "old navy co", "gap inc"],
    "lululemon": ["lululemon", "lululemon athletica", "lululemon inc"],
    "under armour": ["under armour", "under armor", "under armour inc"],
    "patagonia": ["patagonia", "patagonia inc", "patagonia works"],
    "north face": ["north face", "the north face", "vf corporation"],
    "columbia": ["columbia", "columbia sportswear", "columbia sportswear company"],
    "decathlon": ["decathlon", "decathlon sport", "decathlon group"],
    "speedo": ["speedo", "speedo international", "pentland group"],
    "new era": ["new era", "new era cap", "new era cap company"],
    "new balance": ["new balance", "new balance athletic", "new balance inc"],
    "converse": ["converse", "converse inc", "nike inc"],
    "vans": ["vans", "vans inc", "vf corporation"],
    "timberland": ["timberland", "timberland co", "vf corporation"],
    "dr. martens": ["dr. martens", "dr martens", "airwair international"],
    "clarks": ["clarks", "clarks shoes", "clarks international"],
    "steve madden": ["steve madden", "steve madden ltd", "steve madden inc"],
    "nine west": ["nine west", "nine west group", "authentic brands group"],
    "michael kors": ["michael kors", "michael kors holdings", "capri holdings"],
    "kate spade": ["kate spade", "kate spade & company", "tapestry inc"],
    "coach": ["coach", "coach inc", "tapestry inc"],
    "tory burch": ["tory burch", "tory burch llc", "tory burch company"],
    "kate spade": ["kate spade", "kate spade & company", "tapestry inc"],
    "longchamp": ["longchamp", "longchamp sa", "longchamp company"],
    "furla": ["furla", "furla spa", "furla group"],
    "guess": ["guess", "guess inc", "guess corporation"],
    "dkny": ["dkny", "donna karan new york", "g-iii apparel group"],
    "calvin klein": ["calvin klein", "calvin klein inc", "pvhl"],
    "tommy hilfiger": ["tommy hilfiger", "tommy hilfiger corporation", "pvhl"],
    "ralph lauren": ["ralph lauren", "ralph lauren corporation", "polo ralph lauren"],
    "brooks brothers": ["brooks brothers", "brooks brothers inc", "authentic brands group"],
    "j.crew": ["j.crew", "jcrew", "j.crew group"],
    "banana republic": ["banana republic", "banana republic co", "gap inc"],
    "old navy": ["old navy", "old navy co", "gap inc"],
    "gap": ["gap", "gap inc", "gap corporation"],
    "h&m": ["h&m", "h&m group", "hennes & mauritz", "hennes and mauritz"],
    "zara": ["zara", "zara fashion", "inditex"],
    "mango": ["mango", "mango fashion", "mango group"],
    "uniqlo": ["uniqlo", "fast retailing", "uniqlo co"],
    "target": ["target", "target corporation", "target stores"],
    "walmart": ["walmart", "walmart inc", "walmart stores"],
    "costco": ["costco", "costco wholesale", "costco wholesale corporation"],
    "kohl's": ["kohl's", "kohls", "kohl's corporation"],
    "jcpenney": ["jcpenney", "j.c. penney", "j.c. penney company"],
    "macy's": ["macy's", "macys", "macy's inc"],
    "nordstrom": ["nordstrom", "nordstrom inc", "nordstrom company"],
    "bloomingdale's": ["bloomingdale's", "bloomingdales", "macy's inc"],
    "saks fifth avenue": ["saks fifth avenue", "saks", "hudson's bay company"],
    "neiman marcus": ["neiman marcus", "neiman marcus group", "neiman marcus company"],
    "bergdorf goodman": ["bergdorf goodman", "bergdorf", "neiman marcus group"],
    "barneys new york": ["barneys new york", "barneys", "authentic brands group"],
    "saks off 5th": ["saks off 5th", "saks off fifth", "hudson's bay company"],
    "nordstrom rack": ["nordstrom rack", "nordstrom rack inc", "nordstrom inc"],
    "tj maxx": ["tj maxx", "tjmaxx", "tjx companies"],
    "marshalls": ["marshalls", "marshalls inc", "tjx companies"],
    "homegoods": ["homegoods", "homegoods inc", "tjx companies"],
    "ross": ["ross", "ross stores", "ross stores inc"],
    "burlington": ["burlington", "burlington stores", "burlington coat factory"],
    "dollar general": ["dollar general", "dollar general corporation"],
    "family dollar": ["family dollar", "family dollar stores", "dollar tree inc"],
    "dollar tree": ["dollar tree", "dollar tree inc"],
    "five below": ["five below", "five below inc"],
    "big lots": ["big lots", "big lots inc"],
    "ollie's bargain outlet": ["ollie's bargain outlet", "ollie's", "ollie's bargain outlet inc"],
    "gabriel brothers": ["gabriel brothers", "gabriel brothers inc"],
    "dd's discounts": ["dd's discounts", "dd's", "ross stores inc"],
    "sierra": ["sierra", "sierra trading post", "tjx companies"],
    "homesense": ["homesense", "homesense inc", "tjx companies"],
    "winners": ["winners", "winners inc", "tjx companies"],
    "home sense": ["home sense", "homesense", "tjx companies"],
    "tk maxx": ["tk maxx", "tkmaxx", "tjx companies"],
    "homegoods": ["homegoods", "homegoods inc", "tjx companies"],
    "marshalls": ["marshalls", "marshalls inc", "tjx companies"],
    "tj maxx": ["tj maxx", "tjmaxx", "tjx companies"],
    "sierra": ["sierra", "sierra trading post", "tjx companies"],
    "homesense": ["homesense", "homesense inc", "tjx companies"],
    "winners": ["winners", "winners inc", "tjx companies"],
    "home sense": ["home sense", "homesense", "tjx companies"],
    "tk maxx": ["tk maxx", "tkmaxx", "tjx companies"]
}

# Country aliases - maps country names to their variations
COUNTRY_ALIASES = {
    "china": ["china", "mainland china", "prc", "people's republic of china"],
    "india": ["india", "republic of india"],
    "bangladesh": ["bangladesh", "bd", "bangla"],
    "vietnam": ["vietnam", "vn", "viet nam"],
    "turkey": ["turkey", "tr", "türkiye", "turkiye"],
    "sri lanka": ["sri lanka", "lanka", "lk", "ceylon"],
    "indonesia": ["indonesia", "id", "indonesian"],
    "cambodia": ["cambodia", "kh", "kampuchea"],
    "thailand": ["thailand", "th", "siam"],
    "malaysia": ["malaysia", "my", "malaysian"],
    "philippines": ["philippines", "ph", "filipino"],
    "pakistan": ["pakistan", "pk", "pakistani"],
    "myanmar": ["myanmar", "mm", "burma", "burmese"],
    "laos": ["laos", "la", "lao"],
    "nepal": ["nepal", "np", "nepali"],
    "mongolia": ["mongolia", "mn", "mongolian"],
    "kazakhstan": ["kazakhstan", "kz", "kazakh"],
    "uzbekistan": ["uzbekistan", "uz", "uzbek"],
    "kyrgyzstan": ["kyrgyzstan", "kg", "kyrgyz"],
    "tajikistan": ["tajikistan", "tj", "tajik"],
    "turkmenistan": ["turkmenistan", "tm", "turkmen"],
    "afghanistan": ["afghanistan", "af", "afghan"],
    "iran": ["iran", "ir", "persian"],
    "iraq": ["iraq", "iq", "iraqi"],
    "syria": ["syria", "sy", "syrian"],
    "lebanon": ["lebanon", "lb", "lebanese"],
    "jordan": ["jordan", "jo", "jordanian"],
    "israel": ["israel", "il", "israeli"],
    "palestine": ["palestine", "ps", "palestinian"],
    "egypt": ["egypt", "eg", "egyptian"],
    "libya": ["libya", "ly", "libyan"],
    "tunisia": ["tunisia", "tn", "tunisian"],
    "algeria": ["algeria", "dz", "algerian"],
    "morocco": ["morocco", "ma", "moroccan"],
    "sudan": ["sudan", "sd", "sudanese"],
    "south sudan": ["south sudan", "ss", "south sudanese"],
    "ethiopia": ["ethiopia", "et", "ethiopian"],
    "eritrea": ["eritrea", "er", "eritrean"],
    "djibouti": ["djibouti", "dj", "djiboutian"],
    "somalia": ["somalia", "so", "somali"],
    "kenya": ["kenya", "ke", "kenyan"],
    "tanzania": ["tanzania", "tz", "tanzanian"],
    "uganda": ["uganda", "ug", "ugandan"],
    "rwanda": ["rwanda", "rw", "rwandan"],
    "burundi": ["burundi", "bi", "burundian"],
    "madagascar": ["madagascar", "mg", "malagasy"],
    "mauritius": ["mauritius", "mu", "mauritian"],
    "seychelles": ["seychelles", "sc", "seychellois"],
    "comoros": ["comoros", "km", "comorian"],
    "mayotte": ["mayotte", "yt", "mahoran"],
    "reunion": ["reunion", "re", "reunionese"],
    "south africa": ["south africa", "za", "south african"],
    "namibia": ["namibia", "na", "namibian"],
    "botswana": ["botswana", "bw", "botswanan"],
    "zimbabwe": ["zimbabwe", "zw", "zimbabwean"],
    "zambia": ["zambia", "zm", "zambian"],
    "malawi": ["malawi", "mw", "malawian"],
    "mozambique": ["mozambique", "mz", "mozambican"],
    "eswatini": ["eswatini", "sz", "swazi"],
    "lesotho": ["lesotho", "ls", "basotho"],
    "angola": ["angola", "ao", "angolan"],
    "congo": ["congo", "cg", "congolese"],
    "democratic republic of the congo": ["democratic republic of the congo", "cd", "drc", "congolese"],
    "gabon": ["gabon", "ga", "gabonese"],
    "equatorial guinea": ["equatorial guinea", "gq", "equatorial guinean"],
    "cameroon": ["cameroon", "cm", "cameroonian"],
    "central african republic": ["central african republic", "cf", "central african"],
    "chad": ["chad", "td", "chadian"],
    "niger": ["niger", "ne", "nigerien"],
    "nigeria": ["nigeria", "ng", "nigerian"],
    "benin": ["benin", "bj", "beninese"],
    "togo": ["togo", "tg", "togolese"],
    "ghana": ["ghana", "gh", "ghanaian"],
    "ivory coast": ["ivory coast", "ci", "ivorian", "côte d'ivoire"],
    "liberia": ["liberia", "lr", "liberian"],
    "sierra leone": ["sierra leone", "sl", "sierra leonean"],
    "guinea": ["guinea", "gn", "guinean"],
    "guinea-bissau": ["guinea-bissau", "gw", "guinea-bissauan"],
    "senegal": ["senegal", "sn", "senegalese"],
    "gambia": ["gambia", "gm", "gambian"],
    "cape verde": ["cape verde", "cv", "cape verdean"],
    "mauritania": ["mauritania", "mr", "mauritanian"],
    "mali": ["mali", "ml", "malian"],
    "burkina faso": ["burkina faso", "bf", "burkinabe"],
    "western sahara": ["western sahara", "eh", "sahrawi"],
    "algeria": ["algeria", "dz", "algerian"],
    "morocco": ["morocco", "ma", "moroccan"],
    "tunisia": ["tunisia", "tn", "tunisian"],
    "libya": ["libya", "ly", "libyan"],
    "egypt": ["egypt", "eg", "egyptian"],
    "sudan": ["sudan", "sd", "sudanese"],
    "south sudan": ["south sudan", "ss", "south sudanese"],
    "ethiopia": ["ethiopia", "et", "ethiopian"],
    "eritrea": ["eritrea", "er", "eritrean"],
    "djibouti": ["djibouti", "dj", "djiboutian"],
    "somalia": ["somalia", "so", "somali"],
    "kenya": ["kenya", "ke", "kenyan"],
    "tanzania": ["tanzania", "tz", "tanzanian"],
    "uganda": ["uganda", "ug", "ugandan"],
    "rwanda": ["rwanda", "rw", "rwandan"],
    "burundi": ["burundi", "bi", "burundian"],
    "madagascar": ["madagascar", "mg", "malagasy"],
    "mauritius": ["mauritius", "mu", "mauritian"],
    "seychelles": ["seychelles", "sc", "seychellois"],
    "comoros": ["comoros", "km", "comorian"],
    "mayotte": ["mayotte", "yt", "mahoran"],
    "reunion": ["reunion", "re", "reunionese"],
    "south africa": ["south africa", "za", "south african"],
    "namibia": ["namibia", "na", "namibian"],
    "botswana": ["botswana", "bw", "botswanan"],
    "zimbabwe": ["zimbabwe", "zw", "zimbabwean"],
    "zambia": ["zambia", "zm", "zambian"],
    "malawi": ["malawi", "mw", "malawian"],
    "mozambique": ["mozambique", "mz", "mozambican"],
    "eswatini": ["eswatini", "sz", "swazi"],
    "lesotho": ["lesotho", "ls", "basotho"],
    "angola": ["angola", "ao", "angolan"],
    "congo": ["congo", "cg", "congolese"],
    "democratic republic of the congo": ["democratic republic of the congo", "cd", "drc", "congolese"],
    "gabon": ["gabon", "ga", "gabonese"],
    "equatorial guinea": ["equatorial guinea", "gq", "equatorial guinean"],
    "cameroon": ["cameroon", "cm", "cameroonian"],
    "central african republic": ["central african republic", "cf", "central african"],
    "chad": ["chad", "td", "chadian"],
    "niger": ["niger", "ne", "nigerien"],
    "nigeria": ["nigeria", "ng", "nigerian"],
    "benin": ["benin", "bj", "beninese"],
    "togo": ["togo", "tg", "togolese"],
    "ghana": ["ghana", "gh", "ghanaian"],
    "ivory coast": ["ivory coast", "ci", "ivorian", "côte d'ivoire"],
    "liberia": ["liberia", "lr", "liberian"],
    "sierra leone": ["sierra leone", "sl", "sierra leonean"],
    "guinea": ["guinea", "gn", "guinean"],
    "guinea-bissau": ["guinea-bissau", "gw", "guinea-bissauan"],
    "senegal": ["senegal", "sn", "senegalese"],
    "gambia": ["gambia", "gm", "gambian"],
    "cape verde": ["cape verde", "cv", "cape verdean"],
    "mauritania": ["mauritania", "mr", "mauritanian"],
    "mali": ["mali", "ml", "malian"],
    "burkina faso": ["burkina faso", "bf", "burkinabe"],
    "western sahara": ["western sahara", "eh", "sahrawi"]
}

def get_product_aliases():
    """Get all product aliases"""
    return PRODUCT_ALIASES

def get_material_aliases():
    """Get all material aliases"""
    return MATERIAL_ALIASES

def get_brand_aliases():
    """Get all brand aliases"""
    return BRAND_ALIASES

def get_country_aliases():
    """Get all country aliases"""
    return COUNTRY_ALIASES

def find_product_type(term):
    """Find the standardized product type for a given term"""
    term_lower = term.lower().strip()
    
    for product_type, aliases in PRODUCT_ALIASES.items():
        if term_lower == product_type or term_lower in aliases:
            return product_type
    
    return None

def find_material_type(term):
    """Find the standardized material type for a given term"""
    term_lower = term.lower().strip()
    
    for material_type, aliases in MATERIAL_ALIASES.items():
        if term_lower == material_type or term_lower in aliases:
            return material_type
    
    return None

def find_brand(term):
    """Find the standardized brand name for a given term"""
    term_lower = term.lower().strip()
    
    for brand, aliases in BRAND_ALIASES.items():
        if term_lower == brand.lower() or term_lower in [alias.lower() for alias in aliases]:
            return brand
    
    return None

def find_country(term):
    """Find the standardized country name for a given term"""
    term_lower = term.lower().strip()
    
    for country, aliases in COUNTRY_ALIASES.items():
        if term_lower == country.lower() or term_lower in [alias.lower() for alias in aliases]:
            return country
    
    return None

def normalize_text(text):
    """Normalize text by finding and replacing aliases with standardized terms"""
    if not text:
        return text
    
    normalized = text.lower()
    
    # Replace product aliases
    for product_type, aliases in PRODUCT_ALIASES.items():
        for alias in aliases:
            normalized = normalized.replace(alias.lower(), product_type)
    
    # Replace material aliases
    for material_type, aliases in MATERIAL_ALIASES.items():
        for alias in aliases:
            normalized = normalized.replace(alias.lower(), material_type)
    
    # Replace brand aliases
    for brand, aliases in BRAND_ALIASES.items():
        for alias in aliases:
            normalized = normalized.replace(alias.lower(), brand.lower())
    
    # Replace country aliases
    for country, aliases in COUNTRY_ALIASES.items():
        for alias in aliases:
            normalized = normalized.replace(alias.lower(), country.lower())
    
    return normalized
