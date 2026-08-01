from backend.config.config import settings

class FirebaseConfig:
    """Firebase settings wrapper."""
    
    @property
    def project_id(self) -> str:
        return settings.firebase_project_id

    @property
    def private_key_id(self) -> str:
        return settings.firebase_private_key_id

    @property
    def private_key(self) -> str:
        return settings.firebase_private_key.replace("\\n", "\n") if settings.firebase_private_key else ""

    @property
    def client_email(self) -> str:
        return settings.firebase_client_email

    @property
    def client_id(self) -> str:
        return settings.firebase_client_id

    @property
    def client_cert_url(self) -> str:
        return settings.firebase_client_cert_url

    @property
    def api_key(self) -> str:
        return settings.firebase_api_key

    @property
    def auth_domain(self) -> str:
        return settings.firebase_auth_domain

    @property
    def storage_bucket(self) -> str:
        return settings.firebase_storage_bucket

    @property
    def app_id(self) -> str:
        return settings.firebase_app_id

firebase_config = FirebaseConfig()
