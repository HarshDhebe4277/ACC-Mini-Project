from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "College Event Management System"
    APP_ENV: str = "development"
    
    # Supabase Configuration
    SUPABASE_URL: str = "https://example.supabase.co"
    SUPABASE_ANON_KEY: str = "default-anon-key"
    SUPABASE_SERVICE_ROLE_KEY: str = "default-service-role-key"
    SUPABASE_JWT_SECRET: str = "default-jwt-secret-min-32-chars-long-abcdef"
    DATABASE_URL: Union[str, None] = None
    
    # Mistral AI Configuration
    MISTRAL_API_KEY: str = "dummy-mistral-api-key"
    
    # Security & QR Verification
    QR_HMAC_SECRET: str = "default-qr-hmac-secret-key-for-dev-32chars"
    
    # CORS
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()

