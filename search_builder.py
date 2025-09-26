"""
Search builder for factory matching and ranking
"""

import time
from typing import List, Dict, Any, Optional
from rapidfuzz import fuzz, process
from schema import SearchQuery, SearchResult, SearchResponse, FactorySchema
from aliases import find_product_type, find_material_type, find_brand, find_country, normalize_text

class FactorySearchBuilder:
    """Builds and executes factory search queries"""
    
    def __init__(self, factories_data: List[Dict[str, Any]]):
        self.factories_data = factories_data
        self.indexed_factories = self._build_search_index()
    
    def _build_search_index(self) -> Dict[str, Any]:
        """Build search index for faster querying"""
        indexed = {
            'by_product': {},
            'by_material': {},
            'by_country': {},
            'by_certification': {},
            'by_brand': {},
            'by_keywords': {}
        }
        
        for factory in self.factories_data:
            # Index by product types
            for product in factory.get('product_specialties', []):
                if product not in indexed['by_product']:
                    indexed['by_product'][product] = []
                indexed['by_product'][product].append(factory)
            
            # Index by materials
            for material in factory.get('materials_handled', []):
                if material not in indexed['by_material']:
                    indexed['by_material'][material] = []
                indexed['by_material'][material].append(factory)
            
            # Index by country
            country = factory.get('country', '').lower()
            if country:
                if country not in indexed['by_country']:
                    indexed['by_country'][country] = []
                indexed['by_country'][country].append(factory)
            
            # Index by certifications
            for cert in factory.get('certifications', []):
                if cert not in indexed['by_certification']:
                    indexed['by_certification'][cert] = []
                indexed['by_certification'][cert].append(factory)
            
            # Index by past clients/brands
            for client in factory.get('past_clients', []):
                client_lower = client.lower()
                if client_lower not in indexed['by_brand']:
                    indexed['by_brand'][client_lower] = []
                indexed['by_brand'][client_lower].append(factory)
            
            # Index by keywords
            for keyword in factory.get('search_keywords', []):
                if keyword not in indexed['by_keywords']:
                    indexed['by_keywords'][keyword] = []
                indexed['by_keywords'][keyword].append(factory)
        
        return indexed
    
    def search_factories(self, query: SearchQuery) -> SearchResponse:
        """Search factories based on query criteria"""
        start_time = time.time()
        
        # Get candidate factories
        candidates = self._get_candidates(query)
        
        # If no specific filters, use all factories
        if not candidates:
            candidates = self.factories_data
        
        # Score and rank candidates
        scored_results = []
        for factory in candidates:
            score, reasons, highlights = self._score_factory(factory, query)
            if score >= query.min_score:
                result = SearchResult(
                    factory=factory,
                    score=score,
                    match_reasons=reasons,
                    highlights=highlights
                )
                scored_results.append(result)
        
        # Sort by score (descending)
        scored_results.sort(key=lambda x: x.score, reverse=True)
        
        # Apply limit
        results = scored_results[:query.limit]
        
        search_time = time.time() - start_time
        
        return SearchResponse(
            results=results,
            total_found=len(scored_results),
            search_time=search_time,
            query=query
        )
    
    def _get_candidates(self, query: SearchQuery) -> List[Dict[str, Any]]:
        """Get candidate factories based on query criteria"""
        candidates = []
        seen_factories = set()
        
        def add_factories(factory_list):
            for factory in factory_list:
                factory_id = factory.get('factory_name', '')
                if factory_id not in seen_factories:
                    candidates.append(factory)
                    seen_factories.add(factory_id)
        
        # Filter by product types
        if query.product_types:
            for product_type in query.product_types:
                product_factories = self.indexed_factories['by_product'].get(product_type.value, [])
                add_factories(product_factories)
        
        # Filter by materials
        if query.materials:
            for material in query.materials:
                material_factories = self.indexed_factories['by_material'].get(material.value, [])
                add_factories(material_factories)
        
        # Filter by preferred countries
        if query.preferred_countries:
            for country in query.preferred_countries:
                country_lower = country.lower()
                country_factories = self.indexed_factories['by_country'].get(country_lower, [])
                add_factories(country_factories)
        
        # Filter by required certifications
        if query.required_certifications:
            for cert in query.required_certifications:
                cert_factories = self.indexed_factories['by_certification'].get(cert.value, [])
                add_factories(cert_factories)
        
        # Filter by preferred clients
        if query.preferred_clients:
            for client in query.preferred_clients:
                client_lower = client.lower()
                client_factories = self.indexed_factories['by_brand'].get(client_lower, [])
                add_factories(client_factories)
        
        # If no specific filters, use keyword search
        if not candidates:
            candidates = self._keyword_search(query.search_text)
            
        return candidates
    
    def _keyword_search(self, search_text: str) -> List[Dict[str, Any]]:
        """Search factories by keywords"""
        normalized_text = normalize_text(search_text)
        search_words = normalized_text.split()
        
        candidates = []
        seen_factories = set()
        
        for word in search_words:
            if word in self.indexed_factories['by_keywords']:
                for factory in self.indexed_factories['by_keywords'][word]:
                    factory_id = factory.get('factory_name', '')
                    if factory_id not in seen_factories:
                        candidates.append(factory)
                        seen_factories.add(factory_id)
        
        return candidates
    
    def _score_factory(self, factory: Dict[str, Any], query: SearchQuery) -> tuple:
        """Score a factory against the query"""
        score = 0.0
        reasons = []
        highlights = {}
        
        # Product type matching (30 points)
        if query.product_types:
            factory_products = set(factory.get('product_specialties', []))
            query_products = set([p.value for p in query.product_types])
            product_overlap = len(factory_products.intersection(query_products))
            if product_overlap > 0:
                product_score = (product_overlap / len(query_products)) * 30
                score += product_score
                reasons.append(f"Product match: {product_overlap}/{len(query_products)} types")
                highlights['product_specialties'] = list(factory_products.intersection(query_products))
        
        # Material matching (25 points)
        if query.materials:
            factory_materials = set(factory.get('materials_handled', []))
            query_materials = set([m.value for m in query.materials])
            material_overlap = len(factory_materials.intersection(query_materials))
            if material_overlap > 0:
                material_score = (material_overlap / len(query_materials)) * 25
                score += material_score
                reasons.append(f"Material match: {material_overlap}/{len(query_materials)} types")
                highlights['materials_handled'] = list(factory_materials.intersection(query_materials))
        
        # Country preference (20 points)
        if query.preferred_countries:
            factory_country = factory.get('country', '').lower()
            if factory_country in [c.lower() for c in query.preferred_countries]:
                score += 20
                reasons.append(f"Preferred country: {factory.get('country')}")
                highlights['country'] = factory.get('country')
        
        # Certification matching (15 points)
        if query.required_certifications:
            factory_certs = set(factory.get('certifications', []))
            query_certs = set([c.value for c in query.required_certifications])
            cert_overlap = len(factory_certs.intersection(query_certs))
            if cert_overlap > 0:
                cert_score = (cert_overlap / len(query_certs)) * 15
                score += cert_score
                reasons.append(f"Certification match: {cert_overlap}/{len(query_certs)} certs")
                highlights['certifications'] = list(factory_certs.intersection(query_certs))
        
        # Preferred client matching (10 points)
        if query.preferred_clients:
            factory_clients = set([c.lower() for c in factory.get('past_clients', [])])
            query_clients = set([c.lower() for c in query.preferred_clients])
            client_overlap = len(factory_clients.intersection(query_clients))
            if client_overlap > 0:
                client_score = (client_overlap / len(query_clients)) * 10
                score += client_score
                reasons.append(f"Client match: {client_overlap}/{len(query_clients)} brands")
                highlights['past_clients'] = [c for c in factory.get('past_clients', []) 
                                            if c.lower() in query_clients]
        
        # Quantity matching (10 points)
        if query.min_quantity and query.max_quantity:
            factory_moq = factory.get('min_order_quantity')
            factory_capacity = factory.get('max_monthly_capacity')
            
            if factory_moq and factory_moq <= query.max_quantity:
                score += 5
                reasons.append(f"MOQ suitable: {factory_moq} <= {query.max_quantity}")
                highlights['min_order_quantity'] = factory_moq
            
            if factory_capacity and factory_capacity >= query.max_quantity:
                score += 5
                reasons.append(f"Capacity suitable: {factory_capacity} >= {query.max_quantity}")
                highlights['max_monthly_capacity'] = factory_capacity
        
        # Lead time matching (10 points)
        if query.max_lead_time:
            factory_lead_time = factory.get('standard_lead_time')
            if factory_lead_time and factory_lead_time <= query.max_lead_time:
                score += 10
                reasons.append(f"Lead time suitable: {factory_lead_time} days <= {query.max_lead_time} days")
                highlights['standard_lead_time'] = factory_lead_time
        
        # Text similarity bonus (up to 10 points)
        search_text = query.search_text.lower()
        factory_text = f"{factory.get('factory_name', '')} {factory.get('country', '')} {factory.get('city', '')} {' '.join(factory.get('product_specialties', []))} {' '.join(factory.get('materials_handled', []))}"
        factory_text = factory_text.lower()
        
        similarity = fuzz.partial_ratio(search_text, factory_text) / 100.0
        if similarity > 0.5:
            similarity_bonus = similarity * 10
            score += similarity_bonus
            reasons.append(f"Text similarity: {similarity:.2f}")
        
        # Normalize score to 0-1 range
        normalized_score = min(score / 100.0, 1.0)
        
        return normalized_score, reasons, highlights
    
    def search_by_text(self, text: str, limit: int = 10, min_score: float = 0.1) -> SearchResponse:
        """Simple text-based search"""
        query = SearchQuery(
            search_text=text,
            limit=limit,
            min_score=min_score
        )
        return self.search_factories(query)
    
    def search_by_products(self, products: List[str], limit: int = 10) -> SearchResponse:
        """Search by product types"""
        from schema import ProductType
        
        product_types = []
        for product in products:
            product_type = find_product_type(product)
            if product_type:
                product_types.append(ProductType(product_type))
        
        query = SearchQuery(
            search_text=f"products: {', '.join(products)}",
            product_types=product_types,
            limit=limit
        )
        return self.search_factories(query)
    
    def search_by_materials(self, materials: List[str], limit: int = 10) -> SearchResponse:
        """Search by materials"""
        from schema import MaterialType
        
        material_types = []
        for material in materials:
            material_type = find_material_type(material)
            if material_type:
                material_types.append(MaterialType(material_type))
        
        query = SearchQuery(
            search_text=f"materials: {', '.join(materials)}",
            materials=material_types,
            limit=limit
        )
        return self.search_factories(query)
    
    def search_by_country(self, countries: List[str], limit: int = 10) -> SearchResponse:
        """Search by countries"""
        query = SearchQuery(
            search_text=f"countries: {', '.join(countries)}",
            preferred_countries=countries,
            limit=limit
        )
        return self.search_factories(query)
    
    def search_by_certifications(self, certifications: List[str], limit: int = 10) -> SearchResponse:
        """Search by certifications"""
        from schema import CertificationType
        
        cert_types = []
        for cert in certifications:
            cert_types.append(CertificationType(cert.upper()))
        
        query = SearchQuery(
            search_text=f"certifications: {', '.join(certifications)}",
            required_certifications=cert_types,
            limit=limit
        )
        return self.search_factories(query)
    
    def search_by_brands(self, brands: List[str], limit: int = 10) -> SearchResponse:
        """Search by past clients/brands"""
        query = SearchQuery(
            search_text=f"brands: {', '.join(brands)}",
            preferred_clients=brands,
            limit=limit
        )
        return self.search_factories(query)
    
    def get_factory_by_name(self, factory_name: str) -> Optional[Dict[str, Any]]:
        """Get factory by exact name match"""
        for factory in self.factories_data:
            if factory.get('factory_name', '').lower() == factory_name.lower():
                return factory
        return None
    
    def get_factories_by_country(self, country: str) -> List[Dict[str, Any]]:
        """Get all factories in a specific country"""
        country_lower = country.lower()
        return self.indexed_factories['by_country'].get(country_lower, [])
    
    def get_factories_by_product(self, product: str) -> List[Dict[str, Any]]:
        """Get all factories that produce a specific product type"""
        return self.indexed_factories['by_product'].get(product.lower(), [])
    
    def get_factories_by_material(self, material: str) -> List[Dict[str, Any]]:
        """Get all factories that work with a specific material"""
        return self.indexed_factories['by_material'].get(material.lower(), [])
    
    def get_factories_by_certification(self, certification: str) -> List[Dict[str, Any]]:
        """Get all factories with a specific certification"""
        return self.indexed_factories['by_certification'].get(certification.upper(), [])
    
    def get_factories_by_brand(self, brand: str) -> List[Dict[str, Any]]:
        """Get all factories that have worked with a specific brand"""
        return self.indexed_factories['by_brand'].get(brand.lower(), [])
