import logging
import firebase_admin
from firebase_admin import credentials
from database.firebase.config import firebase_config

log = logging.getLogger(__name__)

_app = None

def get_firebase_app():
    """Initializes and returns the shared Firebase Admin App instance."""
    global _app
    if _app is None:
        if firebase_config.project_id and firebase_config.private_key:
            try:
                info = {
                    "type": "service_account",
                    "project_id": firebase_config.project_id,
                    "private_key_id": firebase_config.private_key_id,
                    "private_key": firebase_config.private_key,
                    "client_email": firebase_config.client_email,
                    "client_id": firebase_config.client_id,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_x509_cert_url": firebase_config.client_cert_url,
                }
                # Remove empty string keys
                info = {k: v for k, v in info.items() if v}
                
                cred = credentials.Certificate(info)
                options = {}
                if firebase_config.storage_bucket:
                    options['storageBucket'] = firebase_config.storage_bucket
                _app = firebase_admin.initialize_app(cred, options)
                log.info("Firebase: Admin SDK initialized successfully with service account certificate info.")
            except Exception as exc:
                log.error(f"Firebase: Failed to initialize Admin SDK with certificate: {exc}")
                raise
        else:
            log.warning("Firebase: Credentials not fully configured. Operating in LOCAL / OFFLINE mode.")
    return _app
