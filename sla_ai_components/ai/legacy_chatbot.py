from __future__ import annotations

# TODO: Move the existing chatbot core here.
# Provide shims so the UI can still call the same entrypoints.
# Example placeholder:

def handle_chat_message(user_id: str, message: str) -> dict:
    """
    Legacy chatbot handler (temporary).
    TODO: Replace with new SCOS agent wired via sla.ai spec.
    """
    return {"text": "Legacy chatbot placeholder. New SCOS agent coming online."}
