from socflow_bot import socflow_response

print("SocFlow.AI Chatbot (type 'exit' to quit)\n")

while True:
    user_input = input("You: ")
    if user_input.lower() == "exit":
        break
    print("SocFlow.AI:", socflow_response(user_input))


