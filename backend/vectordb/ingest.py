from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
from .store import get_vectorstore


def add_documents(texts):
    vs = get_vectorstore()
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)

    docs = [Document(page_content=t) for t in texts]
    chunks = splitter.split_documents(docs)

    vs.add_documents(chunks)
    vs.persist()

    return len(chunks)
