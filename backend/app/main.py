from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import auth, documents, forms, history, profile
from .core.config import settings

app = FastAPI(title="AgentFlow API", version="0.1.0", description="Approval-first form workflow automation API")
app.add_middleware(CORSMiddleware, allow_origins=[settings.frontend_origin], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(forms.router)
app.include_router(documents.router)
app.include_router(history.router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "agentflow-api", "mode": "local-demo"}
