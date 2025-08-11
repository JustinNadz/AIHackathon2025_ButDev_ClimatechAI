import pandas as pd
import geopandas as gpd
from langchain.schema import Document
from vectorstore.chroma_store import get_chroma_store


class BaseIngestor:
    def __init__(self, collection_name: str):
        self.collection_name = collection_name
        self.vector_store = get_chroma_store(collection_name)

    def csv_to_docs(self, file_path: str, text_columns=None, meta_columns=None):
        """
        Converts a CSV into a list of LangChain Documents.
        """
        df = pd.read_csv(file_path)

        if text_columns is None:
            text_columns = df.columns.tolist()

        docs = []
        for _, row in df.iterrows():
            text = "\n".join([f"{col}: {row[col]}" for col in text_columns])
            metadata = {col: row[col] for col in (meta_columns or [])}
            docs.append(Document(page_content=text, metadata=metadata))

        return docs

    def shp_to_docs(self, file_path: str, text_columns=None, meta_columns=None):
        """
        Convert SHP file into a list of document objects for Chroma.
        """
        gdf = gpd.read_file(file_path)

        docs = []
        for _, row in gdf.iterrows():
            text_parts = []
            if text_columns:
                for col in text_columns:
                    if col in row and row[col] is not None:
                        text_parts.append(str(row[col]))
            else:
                for col in gdf.columns:
                    if col != gdf.geometry.name:
                        text_parts.append(str(row[col]))

            text = " ".join(text_parts)

            metadata = {}
            if meta_columns:
                for col in meta_columns:
                    if col in row:
                        metadata[col] = row[col]
            else:
                metadata["geometry"] = row.geometry.wkt

            docs.append(Document(page_content=text, metadata=metadata))

        return docs

    def ingest_csv(self, file_path: str, text_columns=None, meta_columns=None):
        """
        Reads CSV, converts to documents, stores in Chroma.
        """
        docs = self.csv_to_docs(file_path, text_columns, meta_columns)
        self.vector_store.add_documents(docs)
        self.vector_store.persist()
        print(f"[{self.collection_name}] Ingested {len(docs)} documents.")

    def ingest_shp(self, file_path: str, text_columns=None, meta_columns=None):
        """
        Reads SHP, converts to documents, stores in Chroma
        """
        docs = self.shp_to_docs(file_path, text_columns, meta_columns)
        self.vector_store.add_documents(docs)
        self.vector_store.persist()
        print(f"[{self.collection_name}] Ingested {len(docs)} documents.")
