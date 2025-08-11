from flask import Flask, request, jsonify
from ai.rag import answer_with_rag
from db.queries import save_chat
from vectordb.ingest import add_documents
from db.base import Base, engine

# Create tables if not exists
Base.metadata.create_all(bind=engine)

app = Flask(__name__)


@app.route("/ask", methods=["POST"])
def ask():
    question = request.json.get("question", "").strip()
    if not question:
        return jsonify({"error": "No question provided"}), 400

    answer = answer_with_rag(question)
    save_chat(question, answer)
    return jsonify({"answer": answer})


@app.route("/ingest", methods=["POST"])
def ingest():
    texts = request.json.get("texts", [])
    if not texts:
        return jsonify({"error": "No texts provided"}), 400
    count = add_documents(texts)
    return jsonify({"message": f"Added {count} chunks"})


if __name__ == "__main__":
    app.run(debug=True)
