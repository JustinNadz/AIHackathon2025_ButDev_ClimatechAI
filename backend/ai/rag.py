from .llm import llm
from .prompts import RAG_PROMPT
from vectordb.store import get_vectorstore
from db.queries import query_structured_data


def answer_with_rag(question):
    vectorstore = get_vectorstore()
    docs = vectorstore.similarity_search(question, k=5)
    vector_context = "\n\n".join([doc.page_content for doc in docs])

    structured_context = query_structured_data(question)
    full_context = vector_context + "\n\n" + structured_context

    result = (RAG_PROMPT | llm).invoke(
        {"context": full_context, "question": question})
    return result.content
