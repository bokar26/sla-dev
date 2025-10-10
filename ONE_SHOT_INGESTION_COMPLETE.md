# One-shot Ingestion: Upload → Extract → Search Complete ✅

## 🎯 **What You Have Now**

### ✅ **Single Endpoint Orchestration**
- **`POST /v1/search/ingest`**: One-shot endpoint that handles file upload → vision extraction → search
- **Primary Model**: GPT-5 with Structured Outputs (JSON Schema, temperature 0.1)
- **Smart Fallbacks**: 
  - If confidence < 0.65: retry with GPT-5-mini for photos
  - If confidence still low: try Claude Sonnet 4.5 for PDFs/tables
- **Embeddings**: Uses `text-embedding-3-large` for vector search
- **Freshness**: Optional Grok-4 live search for recent supplier news

### ✅ **Confidence-Based Fallback System**
- **Self-Confidence**: Model reports its own confidence (0-1)
- **Computed Confidence**: Weighted mix of self-confidence, required fields, materials count, OCR text length
- **Threshold**: Confidence ≥ 0.65 uses primary result, otherwise tries fallbacks
- **Best Result**: Returns the highest confidence result across all attempts

### ✅ **Enhanced Frontend Integration**
- **Single API Call**: `ingestSearchWithFile()` handles everything in one request
- **Auto-fill Form**: Extracted data automatically populates search fields
- **Real-time Status**: Shows confidence, engine used, and freshness notes
- **Search Results**: Displays AI-powered supplier matches immediately

## 🚀 **Files Modified**

### Backend Files:
- `services/api/app/routes/ingest_search.py` - **NEW**: One-shot orchestration endpoint
- `services/api/app/main.py` - Mounted new ingest_search router

### Frontend Files:
- `apps/web/src/lib/api.ts` - Added `ingestSearchWithFile()` and `IngestResponse` type
- `apps/web/src/components/SlaSearchBar.jsx` - Updated to use new ingest endpoint
- `apps/web/src/pages/SlaSearchPage.jsx` - Added results handling
- `apps/web/src/pages/SLASearch.jsx` - Updated with new ingest workflow

## 🔧 **API Integration**

### One-Shot Endpoint:
```typescript
POST /v1/search/ingest
Content-Type: multipart/form-data

// File upload + options
file: File
payload: {
  include_freshness?: boolean;
  location?: string;
  product_type_hint?: string;
}
```

### Response Format:
```typescript
{
  extract: {
    product_type: string;
    brand?: string;
    materials: string[];
    keywords: string[];
    self_confidence: number;
    // ... other fields
  };
  confidence: number;        // 0-1 computed confidence
  engine_used: string;       // "gpt-5", "gpt-5-mini", "claude-sonnet-4.5"
  query_text: string;        // Generated search query
  search: {
    items: SupplierResult[];
    meta: { source: string };
  };
  freshness_notes?: string[]; // Grok-4 live search results
  usage: Record<string, any>;  // Token usage per model
}
```

## 🧠 **AI Model Strategy**

### Primary: GPT-5 Vision
- **Structured Outputs**: JSON Schema ensures consistent data extraction
- **Temperature**: 0.1 for deterministic results
- **Self-Confidence**: Model reports its own confidence score

### Fallback 1: GPT-5-mini
- **Use Case**: Simple images when GPT-5 confidence is low
- **Strategy**: Faster, cheaper alternative for basic extractions

### Fallback 2: Claude Sonnet 4.5
- **Use Case**: PDFs and table-like specifications
- **Strategy**: Better at parsing complex document layouts

### Freshness: Grok-4
- **Use Case**: Recent supplier/manufacturing news
- **Strategy**: Live search for up-to-date market information
- **Graceful Degradation**: Works without XAI_API_KEY

## 🎨 **User Experience**

### File Drop Workflow:
1. **Drop File**: User drags image/PDF onto drop zone
2. **Processing**: Shows "processing" status
3. **AI Extraction**: GPT-5 analyzes image with structured outputs
4. **Fallback Check**: If confidence low, tries alternative models
5. **Auto-fill**: Form populates with extracted data
6. **Search**: Vector search finds matching suppliers
7. **Results**: Shows AI-powered supplier matches
8. **Status**: Displays confidence, engine used, freshness notes

### Enhanced Status Display:
- **Confidence**: Shows percentage (e.g., "Confidence: 87%")
- **Engine Used**: Shows which model provided the result
- **Freshness**: Shows number of live search notes found
- **Error Handling**: Clear error messages for failed extractions

## 🔒 **Security & Performance**

- **Server-side Only**: All AI model calls happen on backend
- **No Secrets in Frontend**: API keys never exposed to client
- **Graceful Fallbacks**: System works even if some models unavailable
- **Efficient Processing**: Single request handles entire workflow
- **Token Tracking**: Usage monitoring for cost optimization

## 🧪 **Testing**

The implementation includes:
- **Confidence Thresholds**: Automatic fallback when confidence < 0.65
- **Model Selection**: Smart routing based on file type and confidence
- **Error Recovery**: Graceful handling of model failures
- **Result Validation**: Structured output validation
- **Usage Tracking**: Token usage monitoring per model

## 🎉 **Ready to Use!**

Users can now:
1. **Drop Any File**: Images or PDFs for instant analysis
2. **Get AI Results**: Automatic extraction with confidence scoring
3. **See Fallbacks**: Transparent model selection and confidence
4. **View Freshness**: Recent market information when available
5. **Auto-fill Forms**: Seamless form population from extracted data
6. **Find Suppliers**: Immediate AI-powered supplier matches

**Test it now:**
1. Navigate to SLA Search page
2. Drop an image or PDF onto the drop zone
3. Watch the AI extract data with confidence scoring
4. See the form auto-fill and supplier results appear! 🚀

The system intelligently chooses the best model for each file type and provides transparent feedback about confidence and processing.
