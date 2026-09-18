import logging
import threading
import firebase_admin
from firebase_admin import credentials
from database.firebase.config import firebase_config

log = logging.getLogger(__name__)

_app = None
_init_lock = threading.Lock()


def get_firebase_app():
    """Initializes and returns the shared Firebase Admin App instance in a thread-safe, idempotent manner."""
    global _app

    # Fast-path check without lock
    if _app is not None:
        return _app

    with _init_lock:
        if _app is not None:
            return _app

        # Check if an app has already been initialized (e.g. by another module or test runner)
        if firebase_admin._apps and "[DEFAULT]" in firebase_admin._apps:
            _app = firebase_admin.get_app()
            return _app

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
                    options["storageBucket"] = firebase_config.storage_bucket
                _app = firebase_admin.initialize_app(cred, options)
                log.info("Firebase: Admin SDK initialized successfully with service account certificate info.")
            except ValueError as ve:
                # If another thread/process managed to initialize it simultaneously
                if "already exists" in str(ve).lower():
                    _app = firebase_admin.get_app()
                else:
                    log.error("Firebase: Initialization ValueError: %s", ve)
                    raise
            except Exception as exc:
                log.error("Firebase: Failed to initialize Admin SDK with certificate: %s", exc)
                raise
        else:
            log.warning("Firebase: Credentials not fully configured. Operating in LOCAL / OFFLINE mode.")

    return _app
