"""
ingest.py - Script para procesar documentos y crear embeddings (Chroma / FAISS)

Carga archivos de referencia sobre burnout (MD, TXT, PDF), los divide en fragmentos
(chunks) y genera la base de datos vectorial persistente.
"""

import os
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"
from typing import List, Any

from langchain_community.document_loaders import DirectoryLoader, TextLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings


# Configuración por defecto
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"


def load_documents(data_path: str = DATA_DIR) -> List[Any]:
    """Carga todos los documentos soportados (MD, TXT, PDF) desde la carpeta data."""
    if not os.path.exists(data_path):
        os.makedirs(data_path, exist_ok=True)
        print(f"Carpeta de datos creada en: {data_path}")
        return []

    documents = []
    
    # Cargar Markdown y TXT
    md_loader = DirectoryLoader(data_path, glob="**/*.md", loader_cls=TextLoader, loader_kwargs={'encoding': 'utf-8'})
    txt_loader = DirectoryLoader(data_path, glob="**/*.txt", loader_cls=TextLoader, loader_kwargs={'encoding': 'utf-8'})
    
    documents.extend(md_loader.load())
    documents.extend(txt_loader.load())
    
    # Cargar PDFs si existen
    try:
        pdf_loader = DirectoryLoader(data_path, glob="**/*.pdf", loader_cls=PyPDFLoader)
        documents.extend(pdf_loader.load())
    except Exception as e:
        print(f"Nota: Carga de PDFs no ejecutada o sin archivos ({e})")

    return documents


def split_documents(documents: List[Any], chunk_size: int = 800, chunk_overlap: int = 150):
    """Divide los documentos en fragmentos manejables para embeddings."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""]
    )
    chunks = text_splitter.split_documents(documents)
    return chunks


def build_vector_store(chunks: List[Any], db_path: str = DB_DIR):
    """Genera embeddings y los almacena en Chroma DB de forma persistente."""
    if not chunks:
        print("No se encontraron fragmentos para almacenar.")
        return None

    print(f"Generando embeddings para {len(chunks)} fragmentos...")
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
    
    vector_store = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=db_path,
        collection_metadata={"hnsw:space": "cosine"}
    )
    print(f"[OK] Base de datos vectorial guardada exitosamente en: {db_path}")
    return vector_store


def run_ingestion():
    """Ejecuta el pipeline completo de ingesta."""
    print("--- Iniciando proceso de ingesta de documentos de Burnout ---")
    docs = load_documents()
    print(f"Documentos cargados: {len(docs)}")
    
    if not docs:
        print("Agrega archivos .md, .txt o .pdf en la carpeta 'data/' para continuar.")
        return

    chunks = split_documents(docs)
    print(f"Fragmentos creados: {len(chunks)}")
    
    build_vector_store(chunks)


if __name__ == "__main__":
    run_ingestion()
