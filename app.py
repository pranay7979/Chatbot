from flask import Flask, request, jsonify, render_template_string
import requests

app = Flask(__name__)

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL = "llama3"

SYSTEM_PROMPT = """
You are an AI assistant developed my me pranay.
Help employees with company documentation,
support tickets, and administrative workflows.
You are powered by Llama 3.
"""

HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>TechCorp AI Assistant</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 750px;
            margin: 40px auto;
            background: #f4f4f4;
        }
        #chat {
            background: white;
            padding: 20px;
            min-height: 300px;
            border-radius: 8px;
        }
        input { width: 75%; padding: 12px; }
        button { padding: 12px; }
        .user { color: blue; }
        .ai { color: green; white-space: pre-wrap; }
    </style>
</head>
<body>
    <h2>TechCorp Internal AI Assistant</h2>
    <div id="chat"></div>
    <br>
    <input id="message" placeholder="Ask me something...">
    <button onclick="sendMessage()">Send</button>

    <script>
        async function sendMessage() {
            const input = document.getElementById("message");
            const chat = document.getElementById("chat");
            const message = input.value;

            if (!message.trim()) return;

            chat.innerHTML +=
                '<p class="user"><b>You:</b> ' +
                message + '</p>';

            input.value = "";

            try {
                const response = await fetch("/chat", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({message: message})
                });

                const data = await response.json();

                chat.innerHTML +=
                    '<p class="ai"><b>AI:</b> ' +
                    (data.response || data.error || "No response received.") +
                    '</p>';
            } catch (error) {
                chat.innerHTML +=
                    '<p class="ai"><b>AI:</b> Request failed: ' +
                    error.message + '</p>';
            }
        }
    </script>
</body>
</html>
"""


@app.route("/", methods=["GET"])
def home():
    return render_template_string(HTML)


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    message = data.get("message", "")

    if not isinstance(message, str) or not message.strip():
        return jsonify({"error": "Please enter a message."}), 400

    prompt = SYSTEM_PROMPT + "\nUser: " + message + "\nAssistant:"

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )
        response.raise_for_status()
        result = response.json()

        return jsonify({
            "response": result.get("response", "")
        })

    except requests.RequestException as error:
        return jsonify({"error": str(error)}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
