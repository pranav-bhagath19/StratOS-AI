import logging
from database.firebase.admin import get_firebase_app

log = logging.getLogger(__name__)

class DatabaseProvider:
    _firestore_client = None

    @classmethod
    def get_client(cls):
        """Initializes and returns the Firestore client, or None if in local mode."""
        if cls._firestore_client is None:
            app = get_firebase_app()
            if app:
                try:
                    from firebase_admin import firestore
                    cls._firestore_client = firestore.client()
                    log.info("Firebase: Firestore client connected.")
                except Exception as exc:
                    log.error(f"Firebase: Failed to connect Firestore client: {exc}")
                    cls._firestore_client = None
        return cls._firestore_client
