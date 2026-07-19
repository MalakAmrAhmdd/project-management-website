from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    POSTGRES_USER: str = "ebs_user"
    POSTGRES_PASSWORD: str = "ebs_secure_pass_2024"
    POSTGRES_DB: str = "ebs_epm"
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str = "postgresql+asyncpg://ebs_user:ebs_secure_pass_2024@db:5432/ebs_epm"
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 9000
    CORS_ORIGINS: str = '["http://localhost:4000","http://frontend:4000"]'

    @property
    def cors_origins_list(self) -> List[str]:
        return json.loads(self.CORS_ORIGINS)

    class Config:
        env_file = ".env"


settings = Settings()
