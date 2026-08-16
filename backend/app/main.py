from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import auth, documents, forms, history, profile

app = FastAPI(
    title="AgentFlow API",
    version="0.1.0",
    description="Approval-first form workflow automation API",
)

# Allow both local development and the deployed Netlify frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://agentflowio.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routers
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(forms.router)
app.include_router(documents.router)
app.include_router(history.router)


@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "agentflow-api",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "agentflow-api",
        "mode": "production",
    }