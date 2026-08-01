import logging
from firebase_admin import auth
from database.firebase.admin import get_firebase_app

log = logging.getLogger(__name__)

def verify_token(id_token: str) -> dict | None:
    """Verifies a Firebase client ID token (JWT) for authentication."""
    app = get_firebase_app()
    if not app:
        log.warning("Firebase: Auth helper running in local offline mode, token verification bypassed.")
        return {"uid": "local-test-user", "email": "test@example.com"}
    try:
        decoded_token = auth.verify_id_token(id_token, app=app)
        return decoded_token
    except Exception as exc:
        log.warning(f"Firebase: ID token verification failed: {exc}")
        return None

def create_user(email: str, password: str) -> str | None:
    """Creates a new user account in Firebase Auth."""
    app = get_firebase_app()
    if not app:
        log.warning("Firebase: Auth helper running in local offline mode, user creation skipped.")
        return "local-test-uid"
    try:
        user = auth.create_user(email=email, password=password, app=app)
        return user.uid
    except Exception as exc:
        log.exception(f"Firebase: Failed to create user: {exc}")
        return None
