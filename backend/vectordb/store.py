import os
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from config import OPENROUTER_API_KEY, CHROMA_DB_DIR

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-large",
    openai_api_key=OPENROUTER_API_KEY,
    openai_api_base="https://openrouter.ai/api/v1"
)


def get_vectorstore(name):
    chroma = Chroma(
        collection_name=name,
        persist_directory=CHROMA_DB_DIR,
        embedding_function=embeddings,
    )

    return chroma
