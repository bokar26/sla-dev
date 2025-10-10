import os, sys
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
model   = os.getenv("OPENAI_MODEL", "gpt-5-nano")  # will try fallback if unavailable

if not api_key:
    print("OPENAI_API_KEY missing in .env")
    sys.exit(1)

client = OpenAI(api_key=api_key)

def try_call(m):
    print(f"Trying model: {m}")
    r = client.responses.create(
        model=m,
        input=[{"role":"user","content":"write a haiku about ai"}],
    )
    # newer SDKs expose .output_text; fallback if not present
    print("Response:", getattr(r, "output_text", str(r)))

try:
    try_call(model)
except Exception as e:
    # Fallback if the chosen model isn't enabled on the account
    print(f"Primary model failed: {e}")
    fallback = "gpt-4o-mini"
    try:
        try_call(fallback)
    except Exception as e2:
        print(f"Fallback failed: {e2}")
        sys.exit(2)
