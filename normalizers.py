"""
Data normalizers for cleaning and standardizing factory data
"""

import re
import pandas as pd
from typing import Dict, List, Any, Optional
from schema import ProductType, MaterialType, CertificationType, FactorySchema
from aliases import find_product_type, find_material_type, find_brand, find_country, normalize_text

class FactoryDataNormalizer:
    """Normalizes and cleans factory data from various sources"""
    
    def __init__(self):
        self.product_patterns = {
            'denim': r'\b(denim|jeans|denim\s+jeans|denim\s+jacket|denim\s+shirt|denim\s+pants)\b',
            'knitwear': r'\b(knit|sweater|sweatshirt|hoodie|t-shirt|tshirt|polo|cardigan|jumper)\b',
            'woven': r'\b(woven|shirt|blouse|dress|pants|trousers|jacket|coat|suit|skirt)\b',
            'activewear': r'\b(activewear|sportswear|athletic|gym|fitness|workout|training)\b',
            'lingerie': r'\b(lingerie|underwear|bra|panties|briefs|boxers|sleepwear|nightwear)\b',
            'accessories': r'\b(accessories|hat|cap|scarf|bag|belt|gloves|socks|stockings|tie)\b',
            'swimwear': r'\b(swimwear|swimsuit|bikini|trunks|swimming|beachwear)\b',
            'footwear': r'\b(footwear|shoes|boots|sneakers|sandals|flats|heels|loafers)\b'
        }
        
        self.material_patterns = {
            'cotton': r'\b(cotton|organic\s+cotton|pima\s+cotton|egyptian\s+cotton)\b',
            'polyester': r'\b(polyester|poly|polyamide|nylon)\b',
            'denim': r'\b(denim|denim\s+fabric|denim\s+cloth)\b',
            'leather': r'\b(leather|genuine\s+leather|suede|nappa\s+leather)\b',
            'wool': r'\b(wool|merino\s+wool|cashmere|alpaca|angora|mohair)\b',
            'silk': r'\b(silk|mulberry\s+silk|wild\s+silk|tussah\s+silk)\b',
            'synthetic': r'\b(synthetic|acrylic|spandex|elastane|lycra|polyurethane)\b',
            'blend': r'\b(blend|blended|mixed|combination)\b'
        }
        
        self.certification_patterns = {
            'GOTS': r'\b(GOTS|Global\s+Organic\s+Textile\s+Standard)\b',
            'OEKO-TEX': r'\b(OEKO-TEX|Oeko-Tex|oeko-tex)\b',
            'ISO 9001': r'\b(ISO\s+9001|ISO9001)\b',
            'WRAP': r'\b(WRAP|Worldwide\s+Responsible\s+Accredited\s+Production)\b',
            'BSCI': r'\b(BSCI|Business\s+Social\s+Compliance\s+Initiative)\b',
            'SEDEX': r'\b(SEDEX|Sedex)\b',
            'BLUESIGN': r'\b(BLUESIGN|Bluesign|blue\s+sign)\b',
            'C2C': r'\b(C2C|Cradle\s+to\s+Cradle)\b'
        }
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text data"""
        if not text or pd.isna(text):
            return ""
        
        # Convert to string and strip whitespace
        text = str(text).strip()
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters that might cause issues
        text = re.sub(r'[^\w\s\-.,&()]', '', text)
        
        return text
    
    def extract_product_types(self, text: str) -> List[str]:
        """Extract product types from text"""
        if not text:
            return []
        
        text_lower = text.lower()
        found_products = []
        
        for product_type, pattern in self.product_patterns.items():
            if re.search(pattern, text_lower):
                found_products.append(product_type)
        
        # Also check aliases
        for product_type in ProductType:
            if find_product_type(product_type.value) and product_type.value in text_lower:
                if product_type.value not in found_products:
                    found_products.append(product_type.value)
        
        return list(set(found_products))
    
    def extract_materials(self, text: str) -> List[str]:
        """Extract materials from text"""
        if not text:
            return []
        
        text_lower = text.lower()
        found_materials = []
        
        for material_type, pattern in self.material_patterns.items():
            if re.search(pattern, text_lower):
                found_materials.append(material_type)
        
        # Also check aliases
        for material_type in MaterialType:
            if find_material_type(material_type.value) and material_type.value in text_lower:
                if material_type.value not in found_materials:
                    found_materials.append(material_type.value)
        
        return list(set(found_materials))
    
    def extract_certifications(self, text: str) -> List[str]:
        """Extract certifications from text"""
        if not text:
            return []
        
        text_upper = text.upper()
        found_certifications = []
        
        for cert_type, pattern in self.certification_patterns.items():
            if re.search(pattern, text_upper, re.IGNORECASE):
                found_certifications.append(cert_type)
        
        return list(set(found_certifications))
    
    def extract_past_clients(self, text: str) -> List[str]:
        """Extract past clients/brands from text"""
        if not text:
            return []
        
        # Common brand patterns
        brand_patterns = [
            r'\b(H&M|H&M Group|Hennes & Mauritz)\b',
            r'\b(Zara|Zara Fashion|Inditex)\b',
            r'\b(Gap|Gap Inc|Gap Corporation)\b',
            r'\b(Nike|Nike Inc|Nike Corporation)\b',
            r'\b(Adidas|Adidas AG|Adidas Group)\b',
            r'\b(Levi\'s|Levis|Levi Strauss)\b',
            r'\b(Uniqlo|Fast Retailing|Uniqlo Co)\b',
            r'\b(Target|Target Corporation|Target Stores)\b',
            r'\b(Walmart|Walmart Inc|Walmart Stores)\b',
            r'\b(Mango|Mango Fashion|Mango Group)\b',
            r'\b(Tommy Hilfiger|Tommy Hilfiger Corporation)\b',
            r'\b(Ralph Lauren|Ralph Lauren Corporation)\b',
            r'\b(Calvin Klein|Calvin Klein Inc)\b',
            r'\b(Victoria\'s Secret|Victoria Secret|L Brands)\b',
            r'\b(American Eagle|American Eagle Outfitters|AEO)\b',
            r'\b(Abercrombie|Abercrombie & Fitch|Abercrombie and Fitch)\b',
            r'\b(Express|Express Inc|Express Fashion)\b',
            r'\b(Urban Outfitters|Urban Outfitters Inc)\b',
            r'\b(Anthropologie|Anthropologie Group)\b',
            r'\b(J\.Crew|Jcrew|J\.Crew Group)\b',
            r'\b(Banana Republic|Banana Republic Co)\b',
            r'\b(Old Navy|Old Navy Co)\b',
            r'\b(Lululemon|Lululemon Athletica|Lululemon Inc)\b',
            r'\b(Under Armour|Under Armor|Under Armour Inc)\b',
            r'\b(Patagonia|Patagonia Inc|Patagonia Works)\b',
            r'\b(North Face|The North Face|VF Corporation)\b',
            r'\b(Columbia|Columbia Sportswear|Columbia Sportswear Company)\b',
            r'\b(Decathlon|Decathlon Sport|Decathlon Group)\b',
            r'\b(Speedo|Speedo International|Pentland Group)\b',
            r'\b(New Era|New Era Cap|New Era Cap Company)\b',
            r'\b(New Balance|New Balance Athletic|New Balance Inc)\b',
            r'\b(Converse|Converse Inc)\b',
            r'\b(Vans|Vans Inc)\b',
            r'\b(Timberland|Timberland Co)\b',
            r'\b(Dr\. Martens|Dr Martens|Airwair International)\b',
            r'\b(Clarks|Clarks Shoes|Clarks International)\b',
            r'\b(Steve Madden|Steve Madden Ltd|Steve Madden Inc)\b',
            r'\b(Nine West|Nine West Group|Authentic Brands Group)\b',
            r'\b(Michael Kors|Michael Kors Holdings|Capri Holdings)\b',
            r'\b(Kate Spade|Kate Spade & Company|Tapestry Inc)\b',
            r'\b(Coach|Coach Inc)\b',
            r'\b(Tory Burch|Tory Burch LLC|Tory Burch Company)\b',
            r'\b(Longchamp|Longchamp SA|Longchamp Company)\b',
            r'\b(Furla|Furla Spa|Furla Group)\b',
            r'\b(Guess|Guess Inc|Guess Corporation)\b',
            r'\b(DKNY|Donna Karan New York|G-III Apparel Group)\b',
            r'\b(Brooks Brothers|Brooks Brothers Inc)\b',
            r'\b(Costco|Costco Wholesale|Costco Wholesale Corporation)\b',
            r'\b(Kohl\'s|Kohls|Kohl\'s Corporation)\b',
            r'\b(JC Penney|J\.C\. Penney|J\.C\. Penney Company)\b',
            r'\b(Macy\'s|Macys|Macy\'s Inc)\b',
            r'\b(Nordstrom|Nordstrom Inc|Nordstrom Company)\b',
            r'\b(Bloomingdale\'s|Bloomingdales|Macy\'s Inc)\b',
            r'\b(Saks Fifth Avenue|Saks|Hudson\'s Bay Company)\b',
            r'\b(Neiman Marcus|Neiman Marcus Group|Neiman Marcus Company)\b',
            r'\b(Bergdorf Goodman|Bergdorf|Neiman Marcus Group)\b',
            r'\b(Barneys New York|Barneys|Authentic Brands Group)\b',
            r'\b(Saks Off 5th|Saks Off Fifth|Hudson\'s Bay Company)\b',
            r'\b(Nordstrom Rack|Nordstrom Rack Inc|Nordstrom Inc)\b',
            r'\b(TJ Maxx|TJMaxx|TJX Companies)\b',
            r'\b(Marshalls|Marshalls Inc|TJX Companies)\b',
            r'\b(HomeGoods|HomeGoods Inc|TJX Companies)\b',
            r'\b(Ross|Ross Stores|Ross Stores Inc)\b',
            r'\b(Burlington|Burlington Stores|Burlington Coat Factory)\b',
            r'\b(Dollar General|Dollar General Corporation)\b',
            r'\b(Family Dollar|Family Dollar Stores|Dollar Tree Inc)\b',
            r'\b(Dollar Tree|Dollar Tree Inc)\b',
            r'\b(Five Below|Five Below Inc)\b',
            r'\b(Big Lots|Big Lots Inc)\b',
            r'\b(Ollie\'s Bargain Outlet|Ollie\'s|Ollie\'s Bargain Outlet Inc)\b',
            r'\b(Gabriel Brothers|Gabriel Brothers Inc)\b',
            r'\b(DD\'s Discounts|DD\'s|Ross Stores Inc)\b',
            r'\b(Sierra|Sierra Trading Post|TJX Companies)\b',
            r'\b(HomeSense|HomeSense Inc|TJX Companies)\b',
            r'\b(Winners|Winners Inc|TJX Companies)\b',
            r'\b(Home Sense|HomeSense|TJX Companies)\b',
            r'\b(TK Maxx|TKMaxx|TJX Companies)\b'
        ]
        
        found_brands = []
        for pattern in brand_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            found_brands.extend(matches)
        
        return list(set([brand.strip() for brand in found_brands if brand.strip()]))
    
    def parse_quantity(self, text: str) -> Optional[int]:
        """Parse quantity information from text"""
        if not text or pd.isna(text):
            return None
        
        text = str(text).lower()
        
        # Extract numbers followed by common quantity units
        patterns = [
            r'(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:pcs|pieces|units|items)',
            r'(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:k|thousand)',
            r'(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:m|million)',
            r'(\d+(?:,\d+)*(?:\.\d+)?)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                number = match.group(1).replace(',', '')
                try:
                    return int(float(number))
                except ValueError:
                    continue
        
        return None
    
    def parse_price_range(self, text: str) -> Optional[tuple]:
        """Parse price range from text"""
        if not text or pd.isna(text):
            return None
        
        text = str(text).lower()
        
        # Extract price ranges like "$1.20 - $5.00" or "$1.20-$5.00"
        price_pattern = r'\$?(\d+(?:\.\d+)?)\s*[-–—]\s*\$?(\d+(?:\.\d+)?)'
        match = re.search(price_pattern, text)
        
        if match:
            try:
                min_price = float(match.group(1))
                max_price = float(match.group(2))
                return (min_price, max_price)
            except ValueError:
                pass
        
        # Extract single price
        single_price_pattern = r'\$?(\d+(?:\.\d+)?)'
        match = re.search(single_price_pattern, text)
        
        if match:
            try:
                price = float(match.group(1))
                return (price, price)
            except ValueError:
                pass
        
        return None
    
    def parse_lead_time(self, text: str) -> Optional[int]:
        """Parse lead time in days from text"""
        if not text or pd.isna(text):
            return None
        
        text = str(text).lower()
        
        # Extract days
        day_patterns = [
            r'(\d+)\s*days?',
            r'(\d+)\s*-\s*(\d+)\s*days?',
            r'(\d+)\s*to\s*(\d+)\s*days?'
        ]
        
        for pattern in day_patterns:
            match = re.search(pattern, text)
            if match:
                if len(match.groups()) == 1:
                    return int(match.group(1))
                elif len(match.groups()) == 2:
                    # Return average of range
                    min_days = int(match.group(1))
                    max_days = int(match.group(2))
                    return (min_days + max_days) // 2
        
        # Extract weeks and convert to days
        week_patterns = [
            r'(\d+)\s*weeks?',
            r'(\d+)\s*-\s*(\d+)\s*weeks?',
            r'(\d+)\s*to\s*(\d+)\s*weeks?'
        ]
        
        for pattern in week_patterns:
            match = re.search(pattern, text)
            if match:
                if len(match.groups()) == 1:
                    return int(match.group(1)) * 7
                elif len(match.groups()) == 2:
                    # Return average of range
                    min_weeks = int(match.group(1))
                    max_weeks = int(match.group(2))
                    avg_weeks = (min_weeks + max_weeks) // 2
                    return avg_weeks * 7
        
        return None
    
    def normalize_factory_data(self, row: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize a single factory data row"""
        normalized = {}
        
        # Basic information
        normalized['factory_name'] = self.clean_text(row.get('Factory Name', ''))
        normalized['country'] = self.clean_text(row.get('Country', ''))
        normalized['city'] = self.clean_text(row.get('City', ''))
        
        # Product specialties
        product_text = self.clean_text(row.get('Product Specialties', ''))
        normalized['product_specialties'] = self.extract_product_types(product_text)
        
        # Materials handled
        materials_text = self.clean_text(row.get('Materials Handled', ''))
        normalized['materials_handled'] = self.extract_materials(materials_text)
        
        # Capacity and pricing
        moq_text = self.clean_text(row.get('Minimum Order Quantity (MOQ)', ''))
        normalized['min_order_quantity'] = self.parse_quantity(moq_text)
        
        price_text = self.clean_text(row.get('Price Per Unit', ''))
        normalized['price_per_unit'] = self.parse_price_range(price_text)
        
        capacity_text = self.clean_text(row.get('Max Monthly Capacity', ''))
        normalized['max_monthly_capacity'] = self.parse_quantity(capacity_text)
        
        # Lead times
        standard_lead_text = self.clean_text(row.get('Standard Lead Time', ''))
        normalized['standard_lead_time'] = self.parse_lead_time(standard_lead_text)
        
        peak_lead_text = self.clean_text(row.get('Peak Season Lead Time', ''))
        normalized['peak_season_lead_time'] = self.parse_lead_time(peak_lead_text)
        
        sample_lead_text = self.clean_text(row.get('Sample Lead Time', ''))
        normalized['sample_lead_time'] = self.parse_lead_time(sample_lead_text)
        
        # Certifications
        cert_text = self.clean_text(row.get('Certifications', ''))
        normalized['certifications'] = self.extract_certifications(cert_text)
        
        # Quality control
        qc_text = self.clean_text(row.get('Quality Control Processes', ''))
        normalized['quality_control_processes'] = qc_text
        
        # Past clients
        clients_text = self.clean_text(row.get('Past Clients', ''))
        normalized['past_clients'] = self.extract_past_clients(clients_text)
        
        # Location and logistics
        normalized['nearest_port'] = self.clean_text(row.get('Nearest Port', ''))
        
        # Labor and operations
        normalized['labor_practices'] = self.clean_text(row.get('Labor Practices', ''))
        normalized['labor_cost'] = self.clean_text(row.get('Labor Cost', ''))
        normalized['number_of_workers'] = self.parse_quantity(row.get('Number of Workers', ''))
        
        year_text = self.clean_text(row.get('Year Established', ''))
        try:
            normalized['year_established'] = int(year_text) if year_text and year_text.isdigit() else None
        except ValueError:
            normalized['year_established'] = None
        
        normalized['factory_size'] = self.clean_text(row.get('Factory Size', ''))
        
        # Communication and customization
        languages_text = self.clean_text(row.get('Languages Spoken', ''))
        normalized['languages_spoken'] = [lang.strip() for lang in languages_text.split(',') if lang.strip()]
        
        normalized['customization_capabilities'] = self.clean_text(row.get('Customization Capabilities', ''))
        
        # Contact information
        normalized['contact_name'] = self.clean_text(row.get('Contact Name', ''))
        normalized['contact_email'] = self.clean_text(row.get('Contact Email', ''))
        normalized['contact_phone'] = self.clean_text(row.get('Contact Phone', ''))
        
        # Additional information
        normalized['notes'] = self.clean_text(row.get('Notes', ''))
        
        # Generate search keywords
        keywords = []
        
        # Add basic info
        if normalized['factory_name']:
            keywords.extend(normalized['factory_name'].lower().split())
        if normalized['country']:
            keywords.append(normalized['country'].lower())
        if normalized['city']:
            keywords.extend(normalized['city'].lower().split())
            
        # Add product and material keywords
        keywords.extend([p.lower() for p in normalized['product_specialties']])
        keywords.extend([m.lower() for m in normalized['materials_handled']])
        keywords.extend([c.lower() for c in normalized['past_clients']])
        
        # Add certification keywords
        keywords.extend([cert.lower() for cert in normalized['certifications']])
        
        # Clean and deduplicate keywords
        clean_keywords = []
        for keyword in keywords:
            if keyword and len(keyword) > 1:  # Skip empty and single character keywords
                clean_keywords.append(keyword.strip())
        
        normalized['search_keywords'] = list(set(clean_keywords))
        
        return normalized

def normalize_dataset(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Normalize entire dataset"""
    normalizer = FactoryDataNormalizer()
    normalized_data = []
    
    for _, row in df.iterrows():
        try:
            normalized_row = normalizer.normalize_factory_data(row.to_dict())
            normalized_data.append(normalized_row)
        except Exception as e:
            print(f"Error normalizing row: {e}")
            continue
    
    return normalized_data
