from .llm import llm
from .prompts import RAG_PROMPT
from vectordb.store import get_vectorstore


def answer_with_rag(question: str, collection_name: str = "preparedness"):
    """Retrieve relevant guidance and synthesize an answer. Falls back gracefully if retrieval fails."""
    vector_context = ""
    try:
        vectorstore = get_vectorstore(collection_name)
        try:
            docs = vectorstore.similarity_search(question, k=6)
            vector_context = "\n\n".join([doc.page_content for doc in docs])
        except Exception as e:
            # Retrieval failure should not break the assistant
            vector_context = ""
    except Exception:
        vector_context = ""

    result = (RAG_PROMPT | llm).invoke({"context": vector_context, "question": question})
    return result.content

# TODO: this is a placeholder