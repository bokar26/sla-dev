#!/usr/bin/env python3
"""
Generate 7,000+ supplier records for testing the SLA system
"""
import json
import random
import os
from pathlib import Path

# Expanded data for realistic supplier generation
COMPANIES = [
    "Jiangsu Garments Co.", "Shenzhen Apparel Ltd.", "Ningbo Textiles", "Hanoi Garment JV",
    "Saigon Wearhouse", "Guangzhou Knit Co.", "Dongguan OEM Works", "Haiphong Denim",
    "Zhejiang Outerwear", "Hunan Fabrics", "Shanghai Manufacturing", "Beijing Textile Corp",
    "Tianjin Garment Factory", "Qingdao Apparel Co.", "Wuhan Clothing Ltd.", "Chengdu Fashion",
    "Xiamen Textile Works", "Foshan Garment Co.", "Zhongshan Apparel", "Fuzhou Manufacturing",
    "Changsha Clothing", "Nanchang Textiles", "Hefei Garment Co.", "Jinan Apparel Ltd",
    "Taiyuan Manufacturing", "Shijiazhuang Textiles", "Baoding Garment Co.", "Tangshan Apparel",
    "Qinhuangdao Clothing", "Handan Textiles", "Xingtai Garment Co.", "Langfang Apparel",
    "Cangzhou Manufacturing", "Hengshui Textiles", "Zhangjiakou Garment", "Chengde Apparel",
    "Baotou Clothing", "Hohhot Textiles", "Chifeng Garment Co.", "Tongliao Apparel",
    "Hulunbuir Manufacturing", "Ulanqab Textiles", "Ordos Garment Co.", "Bayannur Apparel",
    "Wuhai Clothing", "Alxa Textiles", "Yinchuan Garment Co.", "Shizuishan Apparel",
    "Guyuan Manufacturing", "Zhongwei Textiles", "Wuzhong Garment Co.", "Yulin Apparel",
    "Ankang Clothing", "Shangluo Textiles", "Tongchuan Garment Co.", "Weinan Apparel",
    "Baoji Manufacturing", "Xianyang Textiles", "Xian Garment Co.", "Hanzhong Apparel",
    "Lanzhou Clothing", "Jiayuguan Textiles", "Jinchang Garment Co.", "Wuwei Apparel",
    "Zhangye Manufacturing", "Jiuquan Textiles", "Qingyang Garment Co.", "Pingliang Apparel",
    "Tianshui Clothing", "Longnan Textiles", "Dingxi Garment Co.", "Baiyin Apparel",
    "Jinchang Manufacturing", "Hotan Textiles", "Kashgar Garment Co.", "Aksu Apparel",
    "Kizilsu Clothing", "Karamay Textiles", "Shihezi Garment Co.", "Tacheng Apparel",
    "Altay Manufacturing", "Bortala Textiles", "Ili Garment Co.", "Changji Apparel",
    "Urumqi Clothing", "Turpan Textiles", "Hami Garment Co.", "Bayingolin Apparel",
    "Bortala Manufacturing", "Hotan Textiles", "Kashgar Garment Co.", "Aksu Apparel",
    "Kizilsu Clothing", "Karamay Textiles", "Shihezi Garment Co.", "Tacheng Apparel",
    "Altay Manufacturing", "Bortala Textiles", "Ili Garment Co.", "Changji Apparel"
]

COUNTRIES = [
    "China", "Vietnam", "India", "Bangladesh", "Pakistan", "Indonesia", "Thailand", 
    "Philippines", "Malaysia", "Turkey", "Mexico", "USA", "Canada", "Germany", 
    "Poland", "Portugal", "Spain", "Italy", "France", "UK", "Netherlands", 
    "Czechia", "Romania", "Hungary", "Brazil", "Peru", "Colombia", "Egypt", 
    "Morocco", "Tunisia", "South Africa", "Kenya"
]

PRODUCT_CATEGORIES = [
    ["T-Shirts", "Casualwear"], ["Jeans", "Denim"], ["Outerwear", "Jackets"],
    ["Activewear", "Sportswear"], ["Knitwear", "Sweaters"], ["Underwear", "Lingerie"],
    ["Socks", "Hosiery"], ["Footwear", "Shoes"], ["Accessories", "Bags"],
    ["Home Textiles", "Bedding"], ["Towels", "Bath"], ["Upholstery", "Furniture"],
    ["Rugs", "Carpets"], ["Furniture", "Wood"], ["Kitchenware", "Cookware"],
    ["Tableware", "Dishes"], ["Toys", "Games"], ["Stationery", "Office"],
    ["Packaging", "Boxes"], ["Paper Products", "Tissue"], ["Plastics", "Containers"],
    ["Rubber", "Tires"], ["Metal Parts", "Hardware"], ["Fasteners", "Screws"],
    ["Casting & Forging", "Metal"], ["Machining", "CNC"], ["Electronics Assembly", "PCBs"],
    ["Audio Devices", "Speakers"], ["Wearables", "Smartwatch"], ["Cables & Chargers", "Electronics"],
    ["LED Lighting", "Bulbs"], ["Cosmetics Packaging", "Bottles"], ["Skincare Bottles", "Containers"],
    ["Hair Tools", "Styling"], ["Personal Care Devices", "Gadgets"], ["Auto Parts", "Components"],
    ["Bicycle Components", "Parts"]
]

MATERIALS = [
    "Cotton", "Polyester", "Spandex", "Wool", "Silk", "Linen", "Bamboo", "Hemp",
    "Leather", "Synthetic", "Metal", "Plastic", "Wood", "Glass", "Ceramic",
    "Rubber", "Paper", "Cardboard", "Fabric", "Thread", "Zipper", "Button"
]

CERTIFICATIONS = [
    "ISO9001", "BSCI", "OEKO-TEX", "GOTS", "OCS", "GRS", "RCS", "Cradle to Cradle",
    "Fair Trade", "SA8000", "WRAP", "SMETA", "Sedex", "FSC", "PEFC", "Rainforest Alliance"
]

def generate_supplier(id_num: int) -> dict:
    """Generate a single supplier record"""
    company = random.choice(COMPANIES)
    country = random.choice(COUNTRIES)
    category = random.choice(PRODUCT_CATEGORIES)
    
    # Generate realistic company name variations
    suffixes = ["Ltd.", "Co.", "Corp.", "Inc.", "Factory", "Works", "Manufacturing", "Group", "International"]
    suffix = random.choice(suffixes)
    name = f"{company} {suffix} #{1000 + id_num}"
    
    # Generate materials (1-4 materials)
    num_materials = random.randint(1, 4)
    materials = random.sample(MATERIALS, num_materials)
    
    # Generate certifications (0-3 certs)
    num_certs = random.randint(0, 3)
    certs = random.sample(CERTIFICATIONS, num_certs) if num_certs > 0 else []
    
    # Generate realistic MOQ
    moq_options = [50, 100, 200, 300, 500, 1000, 2000, 5000]
    moq = random.choice(moq_options)
    
    # Generate lead time
    lead_days = random.choice([7, 14, 21, 30, 45, 60, 90])
    
    # Generate price (USD per unit)
    price = round(random.uniform(1.5, 15.0), 2)
    
    # Generate URL
    domain = name.lower().replace(" ", "").replace(".", "").replace("#", "").replace(",", "")
    url = f"https://{domain}.com"
    
    # Generate description
    description = f"{country} OEM/ODM for {', '.join(category)}; strong export capacity. Specializes in {', '.join(materials[:2])}."
    
    return {
        "id": f"supplier_{id_num:04d}",
        "name": name,
        "country": country,
        "materials": materials,
        "certs": certs,
        "moq": moq,
        "lead_days": lead_days,
        "price_usd": price,
        "url": url,
        "supports_customization": random.choice([True, False]),
        "product_types": ", ".join(category),
        "description": description,
        "tags": ", ".join(materials + category),
        "source": "internal"
    }

def main():
    """Generate 7,000+ supplier records"""
    print("Generating 7,000+ supplier records...")
    
    suppliers = []
    for i in range(7000):
        supplier = generate_supplier(i)
        suppliers.append(supplier)
        
        if (i + 1) % 1000 == 0:
            print(f"Generated {i + 1} suppliers...")
    
    # Save to JSON file
    output_dir = Path("/Users/bokarhamma/SLA-DEV/services/data/7k_suppliers")
    output_dir.mkdir(exist_ok=True)
    
    output_file = output_dir / "suppliers_7k.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(suppliers, f, ensure_ascii=False, indent=2)
    
    print(f"Generated {len(suppliers)} suppliers and saved to {output_file}")
    print(f"File size: {output_file.stat().st_size / 1024 / 1024:.1f} MB")
    
    # Show sample
    print("\nSample suppliers:")
    for i in range(3):
        print(f"  {suppliers[i]['name']} - {suppliers[i]['country']} - {suppliers[i]['product_types']}")

if __name__ == "__main__":
    main()
