from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    """
    Core application configuration settings for Project Tirith (The Watch).
    
    Automatically loads and validates variables from the system environment or a .env file.
    Utilizes Pydantic Field aliases to map standard environment variables (e.g., DATABASE_URL)
    to domain-specific internal attributes.
    """
    
    # Project Metadata
    PROJECT_NAME: str = "Tirith"
    PROJECT_VERSION: str = "1.0.0"

    # Database Configuration
    PALANTIR_URI: str = Field(alias="DATABASE_URL")

    # Security & Authentication Configuration 
    RING_OF_POWER_SECRET: str = Field(alias="SECRET_KEY")
    ALGORITHM: str = "HS256"
    WATCH_SHIFT_MINUTES: int = Field(default=30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Third-Party API Keys
    RESEND_API_KEY: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        extra="ignore", 
        populate_by_name=True 
    )

# Global settings instance to be imported across the application
settings = Settings()