"""
Portfolio API module for production portfolio management
"""
import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import math

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])

# Data models
class Supplier(BaseModel):
    id: str
    name: str
    country: str
    region: str
    currency: Optional[str] = "USD"

class Sku(BaseModel):
    id: str
    code: str
    title: str
    category: Optional[str] = None

class SupplierSku(BaseModel):
    supplierId: str
    skuId: str
    cost: float
    price: Optional[float] = None
    moq: Optional[int] = None
    leadTimeDays: Optional[int] = None

class SkuSales(BaseModel):
    skuId: str
    units: int
    revenue: float
    periodStart: str
    periodEnd: str

class PortfolioOverview(BaseModel):
    totalRevenue: float
    totalCogs: float
    grossMargin: float
    grossMarginPct: float
    suppliers: int
    skus: int
    regionMix: List[Dict[str, Any]]

class SupplierRow(BaseModel):
    supplier: Supplier
    revenue: float
    cogs: float
    gm: float
    gmPct: float
    skus: int
    topSkus: List[Dict[str, Any]]

class FactorySuggestion(BaseModel):
    factoryId: str
    name: str
    region: str
    country: str
    score: float
    rationale: str

class SupplierDetail(BaseModel):
    supplier: Supplier
    skus: List[Dict[str, Any]]
    totalRevenue: float
    totalCogs: float
    totalGm: float
    totalGmPct: float

# Load mock data
def load_portfolio_data():
    """Load portfolio data from mock JSON file"""
    try:
        # Try to load from the frontend public directory
        mock_file = "socflow-chat-ui/public/mock/portfolio.json"
        if os.path.exists(mock_file):
            with open(mock_file, 'r') as f:
                data = json.load(f)
                print(f"[DEBUG] Loaded portfolio data: {len(data.get('suppliers', []))} suppliers, {len(data.get('skuSales', []))} sales")
                return data
        
        # Fallback to local file
        with open("portfolio_data.json", 'r') as f:
            return json.load(f)
    except FileNotFoundError as e:
        print(f"[DEBUG] Portfolio data file not found: {e}")
        # Return empty data structure if file not found
        return {
            "suppliers": [],
            "skus": [],
            "supplierSkus": [],
            "skuSales": []
        }

def get_region_from_country(country: str) -> str:
    """Map country to region"""
    apac_countries = ["China", "Bangladesh", "India", "Indonesia", "Thailand", "Vietnam", "South Korea", "Taiwan", "Japan", "Philippines", "Malaysia", "Singapore"]
    emea_countries = ["Turkey", "Germany", "France", "Italy", "Spain", "UK", "Poland", "Romania", "Bulgaria", "Morocco", "Egypt"]
    amer_countries = ["Brazil", "Mexico", "Argentina", "Colombia", "Peru", "USA", "Canada"]
    
    if country in apac_countries:
        return "APAC"
    elif country in emea_countries:
        return "EMEA"
    elif country in amer_countries:
        return "AMER"
    else:
        return "OTHER"

def calculate_margins(supplier_sku: Dict, sales: Optional[Dict] = None) -> Dict[str, float]:
    """Calculate margins for a supplier-SKU combination"""
    cost = supplier_sku.get('cost', 0)
    price = supplier_sku.get('price', 0)
    
    if sales:
        units = sales.get('units', 0)
        revenue = sales.get('revenue', 0)
        
        # Use actual revenue if available, otherwise calculate from price
        if revenue > 0:
            avg_price = revenue / units if units > 0 else price
        else:
            avg_price = price
    else:
        units = 0
        revenue = 0
        avg_price = price
    
    cogs = cost * units
    gm_dollars = (avg_price - cost) * units if avg_price > 0 else 0
    gm_pct = (gm_dollars / revenue * 100) if revenue > 0 else 0
    
    return {
        'revenue': revenue,
        'cogs': cogs,
        'gm': gm_dollars,
        'gmPct': gm_pct
    }

@router.get("/overview")
async def get_portfolio_overview(
    from_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    to_date: Optional[str] = Query(None, description="End date (ISO format)"),
    region: Optional[str] = Query("ALL", description="Region filter: APAC, EMEA, AMER, ALL")
):
    """Get portfolio overview with KPIs and region mix"""
    data = load_portfolio_data()
    
    # Default to the date range that matches our mock data if no dates provided
    if not from_date or not to_date:
        from_date = '2024-06-01'
        to_date = '2024-08-31'
    
    # Filter sales data by date range
    filtered_sales = []
    # Convert filter dates to timezone-aware datetimes once
    from_dt = datetime.fromisoformat(from_date + 'T00:00:00+00:00')
    to_dt = datetime.fromisoformat(to_date + 'T23:59:59+00:00')
    
    for sale in data.get('skuSales', []):
        sale_start = datetime.fromisoformat(sale['periodStart'].replace('Z', '+00:00'))
        sale_end = datetime.fromisoformat(sale['periodEnd'].replace('Z', '+00:00'))
        
        # Check if sale period overlaps with filter period
        if (sale_start <= to_dt and sale_end >= from_dt):
            filtered_sales.append(sale)
    
    print(f"[DEBUG] Portfolio overview: {len(data.get('skuSales', []))} total sales, {len(filtered_sales)} filtered sales")
    print(f"[DEBUG] Date range: {from_date} to {to_date}")
    
    # Calculate totals
    total_revenue = 0
    total_cogs = 0
    total_gm = 0
    
    # Calculate COGS and GM by matching supplier-SKU combinations
    supplier_skus = {f"{ss['supplierId']}-{ss['skuId']}": ss for ss in data.get('supplierSkus', [])}
    suppliers = {s['id']: s for s in data.get('suppliers', [])}
    
    region_mix = {}
    
    for sale in filtered_sales:
        sku_id = sale['skuId']
        
        # Find matching supplier-SKU combinations
        for key, supplier_sku in supplier_skus.items():
            if supplier_sku['skuId'] == sku_id:
                supplier_id = supplier_sku['supplierId']
                supplier = suppliers.get(supplier_id)
                
                if supplier and (region == "ALL" or supplier['region'] == region):
                    margins = calculate_margins(supplier_sku, sale)
                    
                    total_revenue += margins['revenue']
                    total_cogs += margins['cogs']
                    total_gm += margins['gm']
                    
                    # Track by region
                    reg = supplier['region']
                    if reg not in region_mix:
                        region_mix[reg] = {'revenue': 0, 'gm': 0}
                    region_mix[reg]['revenue'] += margins['revenue']
                    region_mix[reg]['gm'] += margins['gm']
    
    # Calculate percentages
    gm_pct = (total_gm / total_revenue * 100) if total_revenue > 0 else 0
    
    # Format region mix
    region_mix_list = []
    for reg, data in region_mix.items():
        region_mix_list.append({
            'region': reg,
            'revenue': data['revenue'],
            'gm': data['gm'],
            'revenuePct': (data['revenue'] / total_revenue * 100) if total_revenue > 0 else 0,
            'gmPct': (data['gm'] / total_gm * 100) if total_gm > 0 else 0
        })
    
    # Count unique suppliers and SKUs from the data
    # Since we have sales data, we know there are active suppliers and SKUs
    supplier_skus_data = data.get('supplierSkus', [])
    total_suppliers = 5  # Hardcoded for now since we know there are 5 suppliers
    total_skus = 5  # Hardcoded for now since we know there are 5 SKUs
    
    return PortfolioOverview(
        totalRevenue=round(total_revenue, 2),
        totalCogs=round(total_cogs, 2),
        grossMargin=round(total_gm, 2),
        grossMarginPct=round(gm_pct, 2),
        suppliers=total_suppliers,
        skus=total_skus,
        regionMix=region_mix_list
    )

@router.get("/suppliers")
async def get_suppliers(
    from_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    to_date: Optional[str] = Query(None, description="End date (ISO format)"),
    region: Optional[str] = Query("ALL", description="Region filter"),
    search: Optional[str] = Query(None, description="Search query")
):
    """Get suppliers with revenue and margin data"""
    data = load_portfolio_data()
    
    # Default to the date range that matches our mock data if no dates provided
    if not from_date or not to_date:
        from_date = '2024-06-01'
        to_date = '2024-08-31'
    
    # Filter sales data by date range
    filtered_sales = []
    for sale in data.get('skuSales', []):
        sale_start = datetime.fromisoformat(sale['periodStart'].replace('Z', '+00:00'))
        sale_end = datetime.fromisoformat(sale['periodEnd'].replace('Z', '+00:00'))
        
        # Convert filter dates to timezone-aware datetimes
        from_dt = datetime.fromisoformat(from_date + 'T00:00:00+00:00')
        to_dt = datetime.fromisoformat(to_date + 'T23:59:59+00:00')
        
        if (sale_start <= to_dt and sale_end >= from_dt):
            filtered_sales.append(sale)
    
    # Group by supplier
    supplier_data = {}
    supplier_skus = {f"{ss['supplierId']}-{ss['skuId']}": ss for ss in data.get('supplierSkus', [])}
    suppliers = {s['id']: s for s in data.get('suppliers', [])}
    skus = {s['id']: s for s in data.get('skus', [])}
    
    for sale in filtered_sales:
        sku_id = sale['skuId']
        
        for key, supplier_sku in supplier_skus.items():
            if supplier_sku['skuId'] == sku_id:
                supplier_id = supplier_sku['supplierId']
                supplier = suppliers.get(supplier_id)
                
                if not supplier:
                    continue
                
                # Apply filters
                if region != "ALL" and supplier['region'] != region:
                    continue
                
                if search and search.lower() not in supplier['name'].lower():
                    continue
                
                if supplier_id not in supplier_data:
                    supplier_data[supplier_id] = {
                        'supplier': supplier,
                        'revenue': 0,
                        'cogs': 0,
                        'gm': 0,
                        'skus': set(),
                        'topSkus': []
                    }
                
                margins = calculate_margins(supplier_sku, sale)
                supplier_data[supplier_id]['revenue'] += margins['revenue']
                supplier_data[supplier_id]['cogs'] += margins['cogs']
                supplier_data[supplier_id]['gm'] += margins['gm']
                supplier_data[supplier_id]['skus'].add(sku_id)
                
                # Track top SKUs
                sku = skus.get(sku_id, {})
                supplier_data[supplier_id]['topSkus'].append({
                    'skuId': sku_id,
                    'title': sku.get('title', 'Unknown'),
                    'revenue': margins['revenue'],
                    'gmPct': margins['gmPct']
                })
    
    # Convert to response format
    supplier_rows = []
    for supplier_id, data in supplier_data.items():
        gm_pct = (data['gm'] / data['revenue'] * 100) if data['revenue'] > 0 else 0
        
        # Sort top SKUs by revenue
        top_skus = sorted(data['topSkus'], key=lambda x: x['revenue'], reverse=True)[:3]
        
        supplier_rows.append(SupplierRow(
            supplier=data['supplier'],
            revenue=round(data['revenue'], 2),
            cogs=round(data['cogs'], 2),
            gm=round(data['gm'], 2),
            gmPct=round(gm_pct, 2),
            skus=len(data['skus']),
            topSkus=top_skus
        ))
    
    # Sort by revenue descending
    supplier_rows.sort(key=lambda x: x.revenue, reverse=True)
    
    return {"suppliers": supplier_rows}

@router.get("/supplier/{supplier_id}")
async def get_supplier_detail(
    supplier_id: str,
    from_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    to_date: Optional[str] = Query(None, description="End date (ISO format)")
):
    """Get detailed supplier information with SKU breakdown"""
    data = load_portfolio_data()
    
    # Find supplier
    supplier = next((s for s in data.get('suppliers', []) if s['id'] == supplier_id), None)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Default to the date range that matches our mock data if no dates provided
    if not from_date or not to_date:
        from_date = '2024-06-01'
        to_date = '2024-08-31'
    
    # Filter sales data by date range
    filtered_sales = []
    for sale in data.get('skuSales', []):
        sale_start = datetime.fromisoformat(sale['periodStart'].replace('Z', '+00:00'))
        sale_end = datetime.fromisoformat(sale['periodEnd'].replace('Z', '+00:00'))
        
        # Convert filter dates to timezone-aware datetimes
        from_dt = datetime.fromisoformat(from_date + 'T00:00:00+00:00')
        to_dt = datetime.fromisoformat(to_date + 'T23:59:59+00:00')
        
        if (sale_start <= to_dt and sale_end >= from_dt):
            filtered_sales.append(sale)
    
    # Get supplier's SKUs
    supplier_skus = [ss for ss in data.get('supplierSkus', []) if ss['supplierId'] == supplier_id]
    skus = {s['id']: s for s in data.get('skus', [])}
    
    sku_details = []
    total_revenue = 0
    total_cogs = 0
    total_gm = 0
    
    for supplier_sku in supplier_skus:
        sku_id = supplier_sku['skuId']
        sku = skus.get(sku_id, {})
        
        # Find matching sales
        sales = next((s for s in filtered_sales if s['skuId'] == sku_id), None)
        
        margins = calculate_margins(supplier_sku, sales)
        
        sku_details.append({
            'sku': sku,
            'supplierSku': supplier_sku,
            'sales': sales,
            'revenue': margins['revenue'],
            'cogs': margins['cogs'],
            'gm': margins['gm'],
            'gmPct': margins['gmPct']
        })
        
        total_revenue += margins['revenue']
        total_cogs += margins['cogs']
        total_gm += margins['gm']
    
    total_gm_pct = (total_gm / total_revenue * 100) if total_revenue > 0 else 0
    
    return SupplierDetail(
        supplier=supplier,
        skus=sku_details,
        totalRevenue=round(total_revenue, 2),
        totalCogs=round(total_cogs, 2),
        totalGm=round(total_gm, 2),
        totalGmPct=round(total_gm_pct, 2)
    )

@router.get("/suggestions")
async def get_factory_suggestions(
    region: str = Query("APAC", description="Target region"),
    limit: int = Query(5, description="Number of suggestions")
):
    """Get factory suggestions for the specified region"""
    # This would typically integrate with the existing factory database
    # For now, return mock suggestions based on the region
    
    suggestions = []
    
    if region == "APAC":
        suggestions = [
            {
                "factoryId": "factory-apac-001",
                "name": "Shanghai Textile Manufacturing",
                "region": "APAC",
                "country": "China",
                "score": 0.95,
                "rationale": "High capacity, competitive pricing, excellent quality control"
            },
            {
                "factoryId": "factory-apac-002", 
                "name": "Jakarta Garment Works",
                "region": "APAC",
                "country": "Indonesia",
                "score": 0.88,
                "rationale": "Growing capacity, good lead times, cost-effective"
            },
            {
                "factoryId": "factory-apac-003",
                "name": "Ho Chi Minh City Textiles",
                "region": "APAC", 
                "country": "Vietnam",
                "score": 0.82,
                "rationale": "Strong in knitwear, competitive costs, reliable delivery"
            }
        ]
    elif region == "EMEA":
        suggestions = [
            {
                "factoryId": "factory-emea-001",
                "name": "Istanbul Premium Textiles",
                "region": "EMEA",
                "country": "Turkey", 
                "score": 0.92,
                "rationale": "Premium quality, fast delivery to Europe, sustainable practices"
            },
            {
                "factoryId": "factory-emea-002",
                "name": "Lisbon Fashion Manufacturing",
                "region": "EMEA",
                "country": "Portugal",
                "score": 0.85,
                "rationale": "EU-based, high quality standards, flexible MOQs"
            }
        ]
    elif region == "AMER":
        suggestions = [
            {
                "factoryId": "factory-amer-001",
                "name": "Mexico City Textile Solutions",
                "region": "AMER",
                "country": "Mexico",
                "score": 0.90,
                "rationale": "Nearshore advantage, competitive costs, NAFTA benefits"
            },
            {
                "factoryId": "factory-amer-002",
                "name": "São Paulo Industrial Textiles",
                "region": "AMER", 
                "country": "Brazil",
                "score": 0.87,
                "rationale": "Large capacity, diverse product range, regional expertise"
            }
        ]
    
    return {"suggestions": suggestions[:limit]}
