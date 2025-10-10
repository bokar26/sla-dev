# SLA API - OpenAI Core Wiring

This is the FastAPI backend with OpenAI integration for the SLA (Supply Chain Logistics AI) application.

## Features

- ✅ **Multi-model support** (GPT-5, Claude Sonnet 4.5, Grok-4) with unified interface
- ✅ **OpenAI client** (Responses + Embeddings) wired with envs
- ✅ **GPT-5 default model** with runtime verification endpoint
- ✅ **Vision → JSON** endpoint using Structured Outputs (deterministic fields)
- ✅ **Supplier search** endpoint ready to swap in vector DB & filters
- ✅ **Tool-calling skeleton** to plug in your Alibaba/proxy later
- ✅ **Upload** route so the FE can send images now; swap to S3 later

## Setup

1. **Install dependencies:**
   ```bash
   cd services/api
   pip install -e .
   ```

2. **Set environment variables:**
   ```bash
   cp env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

3. **Run locally:**
   ```bash
   uvicorn app.main:app --reload
   ```

## API Endpoints

### Health Check
```bash
curl -s http://localhost:8000/v1/health
```

### Multi-Model Engines
```bash
curl -s http://localhost:8000/v1/llm/engines
# Expected: {"engines": ["gpt5", "claude", "grok"]}
```

### Multi-Model Verification
```bash
# GPT-5
curl -s "http://localhost:8000/v1/llm/verify?engine=gpt5" | jq
# Expected: {"engine":"gpt5", "effective_model":"gpt-5", "ok":true, "request_id":"<UUID>", "usage":{...}}

# Claude Sonnet 4.5
curl -s "http://localhost:8000/v1/llm/verify?engine=claude" | jq
# Expected: {"engine":"claude", "effective_model":"claude-sonnet-4.5", "ok":true, "request_id":"<UUID>", "usage":{...}}

# Grok-4
curl -s "http://localhost:8000/v1/llm/verify?engine=grok" | jq
# Expected: {"engine":"grok", "effective_model":"grok-4", "ok":true, "request_id":"<UUID>", "usage":{...}}
```

### Multi-Model Chat
```bash
curl -s -X POST http://localhost:8000/v1/llm/chat \
  -H "Content-Type: application/json" \
  -d '{
    "engine":"gpt5",
    "messages":[{"role":"user","content":"In 1 sentence, what does SLA do?"}]
  }' | jq
```

### Legacy OpenAI Verification
```bash
curl -s http://localhost:8000/v1/openai/verify | jq
# Expected: {"effective_model":"gpt-5", "ok":true, "request_id":"<UUID>", "api_base":"https://api.openai.com/v1", "usage":{...}}
```

### Vision Extraction
```bash
curl -s -X POST http://localhost:8000/v1/vision/extract \
  -H "Content-Type: application/json" \
  -d '{"file_url":"https://upload.wikimedia.org/wikipedia/commons/3/3a/Sock_-_example.jpg"}'
```

### Supplier Search
```bash
curl -s -X POST http://localhost:8000/v1/suppliers/search \
  -H "Content-Type: application/json" \
  -d '{"q":"merino socks", "country":"Portugal"}'
```

### Image Upload
```bash
curl -X POST http://localhost:8000/v1/uploads/image \
  -F "file=@image.jpg"
```

## Smoke Tests

Run the smoke tests to verify everything is working:

```bash
./smoke_tests.sh
```

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `OPENAI_MODEL`: Model to use (default: gpt-5)
- `EMBEDDING_MODEL`: Embedding model (default: text-embedding-3-large)
- `ANTHROPIC_API_KEY`: Your Anthropic API key (optional)
- `CLAUDE_MODEL`: Claude model (default: claude-sonnet-4.5)
- `XAI_API_KEY`: Your xAI API key (optional)
- `GROK_MODEL`: Grok model (default: grok-4)
- `LLM_PROVIDER`: Provider preference (default: openai)
- `ENV`: Environment (default: dev)

## Next Steps

- Add pgvector model + example SQL to store embeddings and query
- Add SSE streaming endpoint for "planning steps"
- Add tiny eval harness to compare algo versions
- Connect supplier search to actual vector database
- Implement S3/Supabase file storage for uploads
