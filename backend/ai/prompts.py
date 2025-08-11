from langchain.prompts import ChatPromptTemplate

RAG_PROMPT = ChatPromptTemplate.from_template("""
You are an environmental AI assistant.
Use the provided context to answer the question.
If the context is insufficient, say so.

Context:
{context}

Question:
{question}
""")
