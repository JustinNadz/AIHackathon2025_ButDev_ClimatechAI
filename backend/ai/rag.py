from .llm import llm
from .prompts import RAG_PROMPT
from vectordb.store import get_vectorstore


def answer_with_rag(question: str, collection_name: str = "preparedness"):
    vectorstore = get_vectorstore(collection_name)
    docs = vectorstore.similarity_search(question, k=6)
    vector_context = "\n\n".join([doc.page_content for doc in docs])

    result = (RAG_PROMPT | llm).invoke({"context": vector_context, "question": question})
    return result.content

# TODO: this is a placeholder