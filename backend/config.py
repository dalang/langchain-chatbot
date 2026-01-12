from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ZHIPUAI_API_KEY: str
    TAVILY_API_KEY: str
    TAVILY_MAX_RESULTS: int = 3
    LANGSMITH_API_KEY: str = ""

    DATABASE_URL: str = "sqlite+aiosqlite:///./data/chatbot.db"

    HOST: str = "127.0.0.1"
    PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    MODEL_NAME: str = "glm-4"
    TEMPERATURE: float = 0.01
    MAX_ITERATIONS: int = 5

    SESSION_EXPIRE_HOURS: int = 24

    APP_NAME: str = "LangChain Chatbot API"
    DEBUG: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
