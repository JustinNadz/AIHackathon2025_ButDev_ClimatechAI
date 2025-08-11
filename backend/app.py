from flask import Flask, request, jsonify
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from dotenv import load_dotenv
import os

load_dotenv()
app = Flask(__name__)

openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
if not openrouter_api_key:
    raise ValueError("Missing OPENROUTER_API_KEY in .env")

llm = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=openrouter_api_key,
    model="google/gemma-3-27b-it:free",
    temperature=0.7
)


prompt = ChatPromptTemplate.from_template(
    "You are a helpful assistant. Answer: {question}")


@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()
    question = data.get("question", "")
    if not question:
        return jsonify({"error": "No question provided"}), 400

    chain = prompt | llm
    result = chain.invoke({"question": question})

    return jsonify({"answer": result.content})


if __name__ == "__main__":
    app.run(debug=True)
