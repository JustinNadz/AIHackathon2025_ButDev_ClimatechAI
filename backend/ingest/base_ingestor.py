import pandas as pd
import geopandas as gpd
from vectordb.ingest import add_documents


class BaseIngestor:
    def __init__(self, collection_name: str):
        self.collection_name = collection_name

    def csv_to_texts(self, file_path: str, text_columns=None):
        df = pd.read_csv(file_path)
        if text_columns is None:
            text_columns = df.columns.tolist()
        texts = ["\n".join([f"{col}: {row[col]}" for col in text_columns])
                 for _, row in df.iterrows()]
        return texts

    def shp_to_texts(self, file_path: str, text_columns=None):
        gdf = gpd.read_file(file_path)
        if text_columns:
            texts = [" ".join(str(row[col]) for col in text_columns if col in gdf.columns)
                     for _, row in gdf.iterrows()]
        else:
            texts = [" ".join(str(row[col]) for col in gdf.columns if col != gdf.geometry.name)
                     for _, row in gdf.iterrows()]
        return texts

    def ingest_csv(self, file_path: str, text_columns=None):
        texts = self.csv_to_texts(file_path, text_columns)
        count = add_documents(texts, collection_name=self.collection_name)
        print(f"[{self.collection_name}] Ingested {count} chunks.")

    def ingest_shp(self, file_path: str, text_columns=None):
        texts = self.shp_to_texts(file_path, text_columns)
        from vectordb.ingest import add_documents
        count = add_documents(texts, collection_name=self.collection_name)
        print(f"[{self.collection_name}] Ingested {count} chunks.")
