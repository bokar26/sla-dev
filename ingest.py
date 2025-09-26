"""
Data ingestion for factory dataset
"""

import pandas as pd
import json
import os
from typing import List, Dict, Any, Optional
from pathlib import Path
from normalizers import normalize_dataset, FactoryDataNormalizer
from search_builder import FactorySearchBuilder
from schema import FactorySchema

class FactoryDataIngest:
    """Handles ingestion and processing of factory data"""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.normalizer = FactoryDataNormalizer()
        self.factories_data = []
        self.search_builder = None
    
    def load_csv_data(self, filename: str) -> pd.DataFrame:
        """Load factory data from CSV file with proper handling of messy data"""
        file_path = self.data_dir / filename
        
        if not file_path.exists():
            raise FileNotFoundError(f"Data file not found: {file_path}")
        
        try:
            # Read the raw CSV with minimal processing
            df = pd.read_csv(file_path, encoding='latin-1', header=None, low_memory=False)
            
            # The first row contains the actual column names
            column_names = [
                'Factory Name', 'Country', 'City', 'Product Specialties', 
                'Materials Handled', 'Minimum Order Quantity (MOQ)', 
                'Price Per Unit', 'Payment Terms', 'Standard Lead Time', 
                'Peak Season Lead Time', 'Max Monthly Capacity', 
                'Sample Lead Time', 'Certifications', 'Quality Control Processes', 
                'Past Clients', 'Nearest Port', 'Labor Practices', 'Labor Cost', 
                'Number of Workers', 'Year Established', 'Factory Size', 
                'Languages Spoken', 'Customization Capabilities', 
                'Contact Name', 'Contact Email', 'Contact Phone', 'Notes'
            ]
            
            # Set the column names
            df.columns = column_names
            
            # Remove the first few rows that contain header information
            df = df.iloc[2:].reset_index(drop=True)
            
            print(f"Successfully loaded data with {len(df)} records")
            return df
        
        except Exception as e:
            print(f"Error loading CSV file: {e}")
            raise
    
    def load_excel_data(self, filename: str) -> pd.DataFrame:
        """Load factory data from Excel file"""
        file_path = self.data_dir / filename
        
        if not file_path.exists():
            raise FileNotFoundError(f"Data file not found: {file_path}")
        
        try:
            df = pd.read_excel(file_path)
            print(f"Successfully loaded Excel data from {filename}")
            return df
        
        except Exception as e:
            print(f"Error loading Excel file: {e}")
            raise
    
    def clean_raw_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean raw data before normalization"""
        print("Cleaning raw data...")
        
        # Remove completely empty rows
        df = df.dropna(how='all')
        print(f"After removing empty rows: {len(df)} records")
        
        # Remove rows where factory name is missing or contains header text
        df = df[df['Factory Name'].notna()]
        df = df[~df['Factory Name'].str.contains('Factory Name', na=False)]
        df = df[~df['Factory Name'].str.contains('Full name', na=False)]
        print(f"After removing header rows: {len(df)} records")
        
        # Clean column names
        df.columns = df.columns.str.strip()
        
        # Remove duplicate factory names
        df = df.drop_duplicates(subset=['Factory Name'])
        print(f"After removing duplicates: {len(df)} records")
        
        # Fill missing values with empty strings
        df = df.fillna('')
        
        # Clean up factory names
        df['Factory Name'] = df['Factory Name'].str.strip()
        df = df[df['Factory Name'] != '']
        print(f"After cleaning factory names: {len(df)} records")
        
        return df
    
    def normalize_data(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Normalize the dataset"""
        print("Normalizing factory data...")
        normalized_data = normalize_dataset(df)
        
        print(f"Normalized {len(normalized_data)} factories")
        return normalized_data
    
    def validate_factory_data(self, factory: Dict[str, Any]) -> bool:
        """Validate a single factory record"""
        required_fields = ['factory_name', 'country']
        
        for field in required_fields:
            if not factory.get(field):
                return False
        
        # Validate product specialties
        if not factory.get('product_specialties'):
            return False
        
        # Validate at least one material
        if not factory.get('materials_handled'):
            return False
        
        return True
    
    def filter_valid_factories(self, factories: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter out invalid factory records"""
        valid_factories = []
        invalid_count = 0
        
        for factory in factories:
            if self.validate_factory_data(factory):
                valid_factories.append(factory)
            else:
                invalid_count += 1
        
        print(f"Filtered out {invalid_count} invalid factories")
        print(f"Kept {len(valid_factories)} valid factories")
        
        return valid_factories
    
    def build_search_index(self, factories: List[Dict[str, Any]]) -> FactorySearchBuilder:
        """Build search index from normalized data"""
        print("Building search index...")
        self.search_builder = FactorySearchBuilder(factories)
        print("Search index built successfully")
        return self.search_builder
    
    def save_normalized_data(self, factories: List[Dict[str, Any]], filename: str = "normalized_factories.json"):
        """Save normalized data to JSON file"""
        output_path = self.data_dir / filename
        
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(factories, f, indent=2, ensure_ascii=False)
            print(f"Saved normalized data to {output_path}")
        except Exception as e:
            print(f"Error saving normalized data: {e}")
    
    def load_normalized_data(self, filename: str = "normalized_factories.json") -> List[Dict[str, Any]]:
        """Load normalized data from JSON file"""
        file_path = self.data_dir / filename
        
        if not file_path.exists():
            raise FileNotFoundError(f"Normalized data file not found: {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                factories = json.load(f)
            print(f"Loaded {len(factories)} normalized factories")
            return factories
        except Exception as e:
            print(f"Error loading normalized data: {e}")
            raise
    
    def ingest_from_csv(self, filename: str, save_normalized: bool = True) -> FactorySearchBuilder:
        """Complete ingestion process from CSV file"""
        print(f"Starting ingestion from {filename}...")
        
        # Load raw data
        df = self.load_csv_data(filename)
        print(f"Loaded {len(df)} raw records")
        
        # Clean raw data
        cleaned_df = self.clean_raw_data(df)
        
        # Normalize data
        normalized_factories = self.normalize_data(cleaned_df)
        
        # Filter valid factories
        valid_factories = self.filter_valid_factories(normalized_factories)
        
        # Save normalized data if requested
        if save_normalized:
            self.save_normalized_data(valid_factories)
        
        # Build search index
        search_builder = self.build_search_index(valid_factories)
        
        # Store data
        self.factories_data = valid_factories
        
        print("Ingestion completed successfully!")
        return search_builder
    
    def ingest_from_excel(self, filename: str, save_normalized: bool = True) -> FactorySearchBuilder:
        """Complete ingestion process from Excel file"""
        print(f"Starting ingestion from {filename}...")
        
        # Load raw data
        df = self.load_excel_data(filename)
        print(f"Loaded {len(df)} raw records")
        
        # Clean raw data
        cleaned_df = self.clean_raw_data(df)
        
        # Normalize data
        normalized_factories = self.normalize_data(cleaned_df)
        
        # Filter valid factories
        valid_factories = self.filter_valid_factories(normalized_factories)
        
        # Save normalized data if requested
        if save_normalized:
            self.save_normalized_data(valid_factories)
        
        # Build search index
        search_builder = self.build_search_index(valid_factories)
        
        # Store data
        self.factories_data = valid_factories
        
        print("Ingestion completed successfully!")
        return search_builder
    
    def ingest_from_normalized(self, filename: str = "normalized_factories.json") -> FactorySearchBuilder:
        """Load from pre-normalized data"""
        print(f"Loading from normalized data: {filename}")
        
        # Load normalized data
        factories = self.load_normalized_data(filename)
        
        # Build search index
        search_builder = self.build_search_index(factories)
        
        # Store data
        self.factories_data = factories
        
        print("Loading from normalized data completed!")
        return search_builder
    
    def get_data_summary(self) -> Dict[str, Any]:
        """Get summary statistics of the ingested data"""
        if not self.factories_data:
            return {"error": "No data loaded"}
        
        summary = {
            "total_factories": len(self.factories_data),
            "countries": {},
            "product_types": {},
            "materials": {},
            "certifications": {},
            "brands": {},
            "capacity_ranges": {
                "small": 0,  # < 10k units/month
                "medium": 0,  # 10k-100k units/month
                "large": 0,   # > 100k units/month
                "unknown": 0
            }
        }
        
        for factory in self.factories_data:
            # Count countries
            country = factory.get('country', 'Unknown')
            summary['countries'][country] = summary['countries'].get(country, 0) + 1
            
            # Count product types
            for product in factory.get('product_specialties', []):
                summary['product_types'][product] = summary['product_types'].get(product, 0) + 1
            
            # Count materials
            for material in factory.get('materials_handled', []):
                summary['materials'][material] = summary['materials'].get(material, 0) + 1
            
            # Count certifications
            for cert in factory.get('certifications', []):
                summary['certifications'][cert] = summary['certifications'].get(cert, 0) + 1
            
            # Count brands
            for brand in factory.get('past_clients', []):
                summary['brands'][brand] = summary['brands'].get(brand, 0) + 1
            
            # Categorize capacity
            capacity = factory.get('max_monthly_capacity')
            if capacity:
                if capacity < 10000:
                    summary['capacity_ranges']['small'] += 1
                elif capacity < 100000:
                    summary['capacity_ranges']['medium'] += 1
                else:
                    summary['capacity_ranges']['large'] += 1
            else:
                summary['capacity_ranges']['unknown'] += 1
        
        return summary
    
    def search_factories(self, query: str, limit: int = 10) -> Dict[str, Any]:
        """Search factories using the search builder"""
        if not self.search_builder:
            return {"error": "Search index not built. Please run ingestion first."}
        
        try:
            response = self.search_builder.search_by_text(query, limit=limit)
            return {
                "results": [
                    {
                        "factory": result.factory,
                        "score": result.score,
                        "match_reasons": result.match_reasons,
                        "highlights": result.highlights
                    } for result in response.results
                ],
                "total_found": response.total_found,
                "search_time": response.search_time
            }
        except Exception as e:
            return {"error": f"Search failed: {str(e)}"}

def main():
    """Main function for testing ingestion"""
    ingest = FactoryDataIngest()
    
    # Try to load from normalized data first
    try:
        search_builder = ingest.ingest_from_normalized()
    except FileNotFoundError:
        # If not found, try to ingest from CSV
        try:
            search_builder = ingest.ingest_from_csv("main_factory_data_only.csv")
        except FileNotFoundError:
            print("No data files found. Please ensure data files are in the data/ directory.")
            return
    
    # Print summary
    summary = ingest.get_data_summary()
    print("\nData Summary:")
    print(f"Total factories: {summary['total_factories']}")
    print(f"Countries: {len(summary['countries'])}")
    print(f"Product types: {len(summary['product_types'])}")
    print(f"Materials: {len(summary['materials'])}")
    print(f"Certifications: {len(summary['certifications'])}")
    print(f"Brands: {len(summary['brands'])}")
    
    # Test search
    print("\nTesting search...")
    results = ingest.search_factories("cotton t-shirts", limit=5)
    if "error" not in results:
        print(f"Found {results['total_found']} factories for 'cotton t-shirts'")
        for i, result in enumerate(results['results'][:3]):
            factory = result['factory']
            print(f"{i+1}. {factory['factory_name']} ({factory['country']}) - Score: {result['score']:.2f}")

if __name__ == "__main__":
    main()
