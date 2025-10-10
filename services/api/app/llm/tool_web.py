from __future__ import annotations
import json
import asyncio
from typing import List, Dict, Any, Optional
from ..core.settings import settings
from ..web.search_providers import search_all_providers
from ..web.fetch import fetch_multiple_urls, extract_supplier_info
from openai import OpenAI

# Initialize OpenAI client
_openai_api_key = getattr(settings, 'OPENAI_API_KEY', None)
_client = OpenAI(api_key=_openai_api_key) if _openai_api_key else None

async def call_tools_loop(system_prompt: str, user_input: Dict[str, Any], max_steps: int = 8) -> str:
    """Use OpenAI tool calling to search the web and extract supplier information"""
    if not _client:
        return "[]"
    
    # Define tools for web search and content fetching
    tools = [
        {
            "type": "function",
            "function": {
                "name": "web_search",
                "description": "Search the web for suppliers, manufacturers, or factories",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query for finding suppliers"
                        },
                        "max_results": {
                            "type": "integer",
                            "description": "Maximum number of results to return",
                            "default": 10
                        }
                    },
                    "required": ["query"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "web_fetch",
                "description": "Fetch and analyze content from specific URLs",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "urls": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "List of URLs to fetch and analyze"
                        }
                    },
                    "required": ["urls"]
                }
            }
        }
    ]
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": json.dumps(user_input)}
    ]
    
    step = 0
    while step < max_steps:
        try:
            # Call OpenAI with tools
            response = _client.chat.completions.create(
                model=getattr(settings, 'OPENAI_MODEL', 'gpt-4o-mini'),
                messages=messages,
                tools=tools,
                tool_choice="auto",
                temperature=0.1
            )
            
            message = response.choices[0].message
            
            # Add assistant message to conversation
            messages.append(message)
            
            # Check if we need to call tools
            if message.tool_calls:
                for tool_call in message.tool_calls:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)
                    
                    if function_name == "web_search":
                        # Perform web search
                        query = function_args.get("query", "")
                        max_results = function_args.get("max_results", 10)
                        
                        search_results = await search_all_providers(query, max_results)
                        
                        # Add tool result to conversation
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "content": json.dumps({
                                "results": search_results,
                                "count": len(search_results)
                            })
                        })
                    
                    elif function_name == "web_fetch":
                        # Fetch and analyze URLs
                        urls = function_args.get("urls", [])
                        
                        url_contents = await fetch_multiple_urls(urls[:5])  # Limit to 5 URLs
                        
                        # Extract supplier info from each URL
                        supplier_info = []
                        for url, content in url_contents.items():
                            if content:
                                info = extract_supplier_info(content, url)
                                supplier_info.append(info)
                        
                        # Add tool result to conversation
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "content": json.dumps({
                                "urls_analyzed": len(url_contents),
                                "supplier_info": supplier_info
                            })
                        })
            else:
                # No more tool calls, return the final response
                return message.content or "[]"
            
            step += 1
            
        except Exception as e:
            print(f"Tool calling error at step {step}: {e}")
            break
    
    # If we've exhausted steps, try to extract a final response
    try:
        final_response = _client.chat.completions.create(
            model=getattr(settings, 'OPENAI_MODEL', 'gpt-4o-mini'),
            messages=messages + [{"role": "user", "content": "Based on all the search results, return a JSON array of suppliers with id, name, url, source, country, product_types, score (0-100), and reasoning."}],
            temperature=0.1
        )
        return final_response.choices[0].message.content or "[]"
    except Exception as e:
        print(f"Final response error: {e}")
        return "[]"