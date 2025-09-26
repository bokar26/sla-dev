# SLA AI Components

This package contains all the AI-powered components for the SLA (Supply Chain Logistics AI) system.

## Package Structure

```
sla_ai_components/
├── __init__.py                 # Main package initialization
├── api/                        # FastAPI router modules
│   ├── __init__.py
│   ├── ranking.py             # Factory ranking endpoints
│   ├── cost.py                # Cost analysis endpoints
│   ├── logistics.py           # Logistics calculation endpoints
│   ├── regulations.py         # Trade regulations endpoints
│   ├── upload.py              # Data upload endpoints
│   ├── preview.py             # Data preview endpoints
│   ├── commit.py              # Data commit endpoints
│   ├── rescan.py              # Data rescan endpoints
│   ├── ai_search.py           # AI-powered search endpoints
│   ├── ai_fulfillment.py      # AI fulfillment endpoints
│   └── suggestions.py         # AI suggestions endpoints
├── ingest/                     # Data ingestion modules
│   ├── __init__.py
│   ├── daemon.py              # Auto-ingestion daemon
│   ├── excel_loader.py        # Excel file processing
│   ├── preview.py             # Data preview generation
│   ├── commit.py              # Data commit operations
│   └── ...                    # Other ingestion utilities
├── suggestions/                # AI suggestions system
│   ├── __init__.py
│   ├── scheduler.py           # Suggestion scheduler
│   ├── generator.py           # Suggestion generation
│   ├── evaluator.py           # Suggestion evaluation
│   └── ...                    # Other suggestion utilities
├── ai/                         # Core AI modules
├── algorithms/                 # Algorithm implementations
├── costing/                    # Cost calculation modules
├── data/                       # Data access layer
├── embeddings/                 # Vector embeddings
├── logistics/                  # Logistics calculations
└── nlp/                        # Natural language processing
```

## Installation

The package is installed in editable mode:

```bash
pip install -e .
```

## Usage

All API modules export a `router` object that can be included in FastAPI applications:

```python
from sla_ai_components.api.ranking import router as ranking_router
from sla_ai_components.api.cost import router as cost_router

app.include_router(ranking_router, prefix="/api/rank")
app.include_router(cost_router, prefix="/api/cost")
```

## Development

- All modules have proper `__init__.py` files for Python package structure
- VS Code/Pyright configuration is included for proper import resolution
- Import verification script: `python scripts/check_imports.py`
