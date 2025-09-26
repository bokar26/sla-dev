#!/usr/bin/env python3
"""
Simple Factory Sourcing API using the new search pipeline
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import os
from datetime import datetime
from ingest import FactoryDataIngest
import ollama

app = FastAPI(title="SLA - Factory Sourcing API", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000", 
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global search system
search_ingest = None

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    response: str
    intent: str
    search_results: Optional[List] = None

def load_search_system():
    """Load the factory search system"""
    global search_ingest
    
    try:
        print("[INFO] Loading factory search system...")
        ingest = FactoryDataIngest()
        
        # Try to load from normalized data first
        try:
            ingest.ingest_from_normalized()
            print(f"[INFO] Loaded {len(ingest.factories_data)} factories from normalized data")
        except FileNotFoundError:
            # If normalized data doesn't exist, try Excel file
            ingest.ingest_from_excel("main_factory_data_only.xlsx")
            print(f"[INFO] Loaded {len(ingest.factories_data)} factories from Excel")
        
        # Set the global variable only after successful loading
        search_ingest = ingest
        print("[INFO] Search system successfully initialized")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to load search system: {e}")
        import traceback
        traceback.print_exc()
        return False

def detect_factory_intent(text: str) -> str:
    """Detect if user is asking about factory sourcing"""
    factory_keywords = [
        'factory', 'manufacturer', 'supplier', 'produce', 'manufacturing',
        'cotton', 'denim', 'fabric', 'apparel', 'clothing', 'garment',
        'make', 'source', 'find', 'need', 'looking for'
    ]
    
    text_lower = text.lower()
    if any(keyword in text_lower for keyword in factory_keywords):
        return "factory_sourcing"
    elif any(greeting in text_lower for greeting in ['hello', 'hi', 'hey', 'greetings']):
        return "greeting"
    else:
        return "other"

def search_factories(query: str, limit: int = 3) -> dict:
    """Search for factories using the new search system"""
    if not search_ingest:
        print("[ERROR] Search system not initialized!")
        return {"error": "Search system not initialized"}
    
    try:
        print(f"[DEBUG] Searching for: {query}")
        results = search_ingest.search_factories(query, limit=limit)
        print(f"[DEBUG] Search results: {results}")
        return results
    except Exception as e:
        print(f"[ERROR] Search failed: {e}")
        import traceback
        traceback.print_exc()
        return {"error": f"Search failed: {str(e)}"}

def format_factory_results(results: dict) -> str:
    """Format factory search results for display"""
    if "error" in results:
        return f"I apologize, but I encountered an issue searching our factory database: {results['error']}"
    
    if results["total_found"] == 0:
        return "I couldn't find any factories matching your criteria. Could you provide more details about what you're looking for? For example:\n- What type of product (t-shirts, jeans, etc.)\n- What materials (cotton, polyester, etc.)\n- Preferred location\n- Quantity needed"
    
    response = f"I found {results['total_found']} factories that match your requirements:\n\n"
    
    for i, result in enumerate(results["results"], 1):
        factory = result["factory"]
        score = result["score"]
        
        response += f"**{i}. {factory['factory_name']}**\n"
        response += f"📍 Location: {factory['city']}, {factory['country']}\n"
        
        if factory.get('product_specialties'):
            response += f"🏭 Specializes in: {', '.join(factory['product_specialties'])}\n"
        
        if factory.get('materials_handled'):
            response += f"🧵 Materials: {', '.join(factory['materials_handled'])}\n"
        
        if factory.get('past_clients'):
            clients = factory['past_clients'][:3]  # Show first 3 clients
            response += f"👥 Past clients: {', '.join(clients)}\n"
        
        if factory.get('certifications'):
            response += f"🏆 Certifications: {', '.join(factory['certifications'])}\n"
        
        response += f"⭐ Match score: {score:.1%}\n\n"
    
    if results["total_found"] > len(results["results"]):
        response += f"And {results['total_found'] - len(results['results'])} more factories available.\n\n"
    
    response += "Would you like more details about any of these factories, or would you like to refine your search?"
    
    return response

def call_ollama_factory_sourcing(prompt: str) -> str:
    """Call Ollama for factory sourcing advice"""
    system_prompt = """You are SLA (Simple Logistics Assistant), a specialized factory sourcing expert. Your role is to help users find the right manufacturing partners.

Guidelines:
- Focus ONLY on factory sourcing and manufacturing advice
- Be concise but helpful
- Ask clarifying questions to better understand needs
- Provide specific recommendations when possible
- If you don't have specific factory data, provide general sourcing advice
- Avoid discussing other logistics topics (shipping, ports, etc.)

Always be conversational and helpful."""

    try:
        response = ollama.chat(
            model='llama3.2:3b',
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': prompt}
            ]
        )
        return response['message']['content']
    except Exception as e:
        return f"I apologize, but I'm having trouble accessing my knowledge base right now. However, I can still help you find factories in our database. Please tell me what you're looking to manufacture!"

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "SLA - Factory Sourcing Assistant API is running!"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Main chat endpoint"""
    user_input = request.message.strip()
    
    if not user_input:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    print(f"[DEBUG] Processing factory sourcing request: {user_input}")
    
    # Detect intent
    intent = detect_factory_intent(user_input)
    print(f"[DEBUG] Detected intent: {intent}")
    
    if intent == "greeting":
        response = "Hello! I'm SLA, your factory sourcing assistant. I can help you find manufacturing partners for your products. What would you like to manufacture?"
        return ChatResponse(response=response, intent=intent)
    
    elif intent == "factory_sourcing":
        # Search for factories
        search_results = search_factories(user_input)
        
        if "error" not in search_results and search_results["total_found"] > 0:
            # Format the results
            response = format_factory_results(search_results)
            return ChatResponse(
                response=response, 
                intent=intent, 
                search_results=search_results["results"]
            )
        else:
            # No specific results found, use Ollama for general advice
            response = call_ollama_factory_sourcing(user_input)
            return ChatResponse(response=response, intent=intent)
    
    else:
        # Non-factory related questions
        response = "I'm specifically designed to help with factory sourcing and manufacturing. Could you tell me what you'd like to manufacture? I can help you find the right factory partners!"
        return ChatResponse(response=response, intent="redirect")

# Initialize search system immediately
load_search_system()

@app.on_event("startup")
async def startup_event():
    """Ensure search system is initialized on startup"""
    if not search_ingest:
        print("[WARNING] Search system not initialized, attempting to load...")
        success = load_search_system()
        if not success:
            print("[WARNING] Factory search system failed to initialize - falling back to Ollama only")
    else:
        print(f"[INFO] Search system already initialized with {len(search_ingest.factories_data)} factories")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
