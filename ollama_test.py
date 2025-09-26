import ollama

print("[DEBUG] Sending test message to Ollama...")

try:
    response = ollama.chat(
        model="llama3",  # or use 'llama3' if you're running that
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "What is CIF in shipping?"}
        ]
    )
    print("[DEBUG] Full response object:", response)
    print("[DEBUG] Model says:", response.get("message", {}).get("content", "[Missing content]"))

except Exception as e:
    print("[ERROR] Exception while calling Ollama:", str(e))
