import os
from langchain_community.vectorstores import Chroma
from config import OPENROUTER_API_KEY, CHROMA_DB_DIR

# Prefer a local/HF embedding to avoid API schema mismatches with OpenRouter
_embeddings = None
try:
    from langchain_community.embeddings import HuggingFaceEmbeddings

    _embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
except Exception:
    try:
        # Fallback to OpenAI-compatible embeddings via OpenRouter
        from langchain_openai import OpenAIEmbeddings

        _embeddings = OpenAIEmbeddings(
            model="text-embedding-3-large",
            openai_api_key=OPENROUTER_API_KEY,
            openai_api_base="https://openrouter.ai/api/v1",
        )
    except Exception:
        _embeddings = None


def get_vectorstore(name: str = "preparedness"):
    """Return a Chroma vector store. Uses HF embeddings by default with OpenAI fallback.

    name: collection name (defaults to 'preparedness')
    """
    if _embeddings is None:
        raise RuntimeError("No embeddings backend available. Install sentence-transformers or configure OpenRouter.")

    chroma = Chroma(
        collection_name=name,
        persist_directory=CHROMA_DB_DIR,
        embedding_function=_embeddings,
    )
    return chroma
