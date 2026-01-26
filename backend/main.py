import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.agent.tools import ToolRegistry
from backend.api import chat_router, general_router, sessions_router
from backend.config import settings
from backend.db.base import create_db_and_tables, dispose_db
from backend.tools.calculator import calculator
from backend.tools.tavily_search import tavily_search


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # 注册所有工具
    ToolRegistry.register_tool(calculator)
    ToolRegistry.register_tool(tavily_search)
    print("Tools registered successfully!")

    await create_db_and_tables()
    print("Database initialized successfully!")
    yield
    await dispose_db()
    print("Database connections closed!")


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(general_router)
app.include_router(sessions_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
