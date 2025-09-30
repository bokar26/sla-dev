# SLA API Service Map

## Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/admin/login` - Admin login

## Metrics & Analytics
- `GET /api/metrics/supply_center` - Supply center metrics (time/cost savings)
- `GET /api/stats` - Admin dashboard statistics
- `GET /api/suppliers/summary` - Suppliers summary data

## Search & AI
- `POST /api/ai/search` - AI-powered factory search
- `POST /api/rank` - Rank factory candidates
- `GET /api/factories/{factory_id}` - Get factory details

## Quotes & Cost Estimation
- `POST /api/quotes/create` - Create new quote
- `GET /api/saved-quotes` - Get saved quotes
- `POST /api/cost/estimate` - Cost estimation
- `POST /api/logistics/estimate` - Logistics cost estimation

## Fulfillment & Logistics
- `POST /api/logistics/plan` - Plan fulfillment route
- `POST /api/ai/fulfillment/options` - Get fulfillment options

## Vendors & Saved Items
- `POST /api/saved/factories` - Save factory to saved list
- `GET /api/saved/factories` - Get saved factories

## Data Management
- `POST /api/upload` - Upload data files
- `GET /api/preview` - Preview uploaded data
- `POST /api/commit` - Commit uploaded data
- `GET /api/report` - Get ingest report

## Admin
- `GET /api/admin/algo-outputs` - Algorithm outputs
- `POST /api/admin/algo-output` - Create algo output
- `GET /api/admin/stats` - Admin statistics

## Integrations
- `GET /api/integrations/alibaba/status` - Alibaba integration status
- `GET /api/integrations/alibaba/oauth-url` - Get OAuth URL
- `GET /api/integrations/alibaba/callback` - OAuth callback
- `POST /api/alibaba/search/suppliers` - Search Alibaba suppliers

## Health & Debug
- `GET /healthz` - Health check
- `GET /readyz` - Readiness check
- `GET /api/debug/routes` - List all routes

## Response Shapes

### Supply Center Metrics
```json
{
  "time_saved": {"value": 148, "unit": "hours"},
  "cost_saved": {"value": 389750, "unit": "USD"},
  "total_without_sla": {"value": 1204750, "unit": "USD"},
  "total_with_sla": {"value": 815000, "unit": "USD"}
}
```

### Factory Search Response
```json
{
  "factories": [
    {
      "id": "factory_123",
      "name": "Factory Name",
      "location": "City, Country",
      "capabilities": ["electronics", "assembly"],
      "rating": 4.5,
      "lead_time": 30
    }
  ],
  "total": 25
}
```

### Quote Response
```json
{
  "id": "quote_456",
  "factory_id": "factory_123",
  "estimated_cost": 15000,
  "lead_time": 30,
  "status": "draft",
  "created_at": "2024-01-01T00:00:00Z"
}
```
