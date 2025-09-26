import json
from rapidfuzz import fuzz
import ollama
import os
from datetime import datetime

# Load static responses
with open("responses.json", "r") as f:
    static_responses = json.load(f)

# Log folder
os.makedirs("logs", exist_ok=True)

def log_chat(user_input, response):
    with open("logs/chat_log.txt", "a") as f:
        f.write(f"\n[{datetime.now()}]\nYou: {user_input}\nBot: {response}\n")

# LLM call
import ollama

def call_ollama(message, history=None):
    if history is None:
        history = []

    # Format history as list of dicts
    messages = [{"role": "system", "content": "You are SocFlow.AI, a manufacturing expert."}]
    for user_msg, bot_msg in history:
        messages.append({"role": "user", "content": user_msg})
        messages.append({"role": "assistant", "content": bot_msg})

    # Add current user message
    messages.append({"role": "user", "content": message})

    # Call Ollama with context
    response = ollama.chat(
        model="llama3",
        messages=messages
    )

    return response["message"]["content"]


# Fuzzy match
def get_best_static_match(user_input, threshold=70):
    best_score = 0
    best_answer = None
    for item in static_responses:
        score = fuzz.ratio(user_input.lower(), item["question"].lower())
        if score > best_score:
            best_score = score
            best_answer = item["answer"]
    if best_score >= threshold:
        print(f"[DEBUG] Fuzzy match ({best_score}%)")
        return best_answer
    return None

# Main bot response
def socflow_response(user_input):
    user_input = user_input.strip()
    match = get_best_static_match(user_input)
    if match:
        log_chat(user_input, match)
        return match

    response = call_ollama(user_input)
    log_chat(user_input, response)
    return response



