import json
import os
import gradio as gr

FILE = "responses.json"

# Load data
def load_responses():
    if not os.path.exists(FILE):
        return []
    with open(FILE, "r") as f:
        return json.load(f)

# Save data
def save_response(question, answer):
    data = load_responses()
    data.append({
        "question": question.strip(), 
        "answer": answer.strip(),
        "source": "manual"
    })
    with open(FILE, "w") as f:
        json.dump(data, f, indent=2)
    return "✅ Added!", view_all()

# View current Q&A
def view_all():
    data = load_responses()
    display = "\n\n".join([
        f"**Q:** {item['question']}\n**A:** {item['answer']}\n**Source:** {item.get('source', 'manual')}"
        for item in data
    ])
    return display if display else "No entries yet."


# App UI
with gr.Blocks() as app:
    gr.Markdown("## 🧠 SocFlow.AI Q&A Editor")

    with gr.Row():
        q_input = gr.Textbox(label="Question", placeholder="Enter new question")
        a_input = gr.Textbox(label="Answer", placeholder="Enter answer", lines=3)

    save_btn = gr.Button("➕ Add Q&A Pair")
    status = gr.Textbox(label="Status", interactive=False)
    preview = gr.Markdown(view_all())

    save_btn.click(fn=save_response, inputs=[q_input, a_input], outputs=[status, preview])

app.launch(share=True)



