from dataclasses import dataclass
import os
from pathlib import Path

try:
    from dotenv import load_dotenv

    backend_root = Path(__file__).resolve().parents[2]
    env_file = backend_root / ".env"
    example_file = backend_root / ".env.example"

    if env_file.exists():
        load_dotenv(env_file)
    elif example_file.exists():
        load_dotenv(example_file)
except ImportError:
    # Environment variables still work before dependencies are installed.
    pass


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    mongodb_uri: str = os.getenv("MONGODB_URI", "")
    mongodb_database: str = os.getenv("MONGODB_DATABASE", "agentflow")
    mongodb_vector_index: str = os.getenv("MONGODB_VECTOR_INDEX", "document_embedding_index")
    gemini_embedding_model: str = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
    pinecone_api_key: str = os.getenv("PINECONE_API_KEY", "")
    pinecone_index_name: str = os.getenv("PINECONE_INDEX_NAME", "agentworkflow")
    pinecone_index_host: str = os.getenv("PINECONE_INDEX_HOST", "https://agentworkflow-y5fq5lx.svc.aped-4627-b74a.pinecone.io")
    pinecone_namespace: str = os.getenv("PINECONE_NAMESPACE", "agentflow")
    jwt_secret: str = os.getenv("JWT_SECRET", "development-only-secret")
    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")


settings = Settings()
