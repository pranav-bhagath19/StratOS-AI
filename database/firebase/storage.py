import logging
from firebase_admin import storage
from database.firebase.admin import get_firebase_app

log = logging.getLogger(__name__)

def upload_file_to_bucket(source_path: str, destination_blob: str) -> str | None:
    """Uploads local file to Firebase Storage bucket, returning public URL."""
    app = get_firebase_app()
    if not app:
        log.warning("Firebase: Storage running in local offline mode, upload skipped.")
        return f"file://local-mock/{destination_blob}"
    try:
        bucket = storage.bucket(app=app)
        blob = bucket.blob(destination_blob)
        blob.upload_from_filename(source_path)
        # Make blob public if desired, or return public/authenticated URL
        blob.make_public()
        return blob.public_url
    except Exception as exc:
        log.exception(f"Firebase: Storage upload failed: {exc}")
        return None

def download_file_from_bucket(source_blob: str, destination_path: str) -> bool:
    """Downloads a blob from Firebase Storage to local path."""
    app = get_firebase_app()
    if not app:
        log.warning("Firebase: Storage running in local offline mode, download skipped.")
        return False
    try:
        bucket = storage.bucket(app=app)
        blob = bucket.blob(source_blob)
        blob.download_to_filename(destination_path)
        return True
    except Exception as exc:
        log.exception(f"Firebase: Storage download failed: {exc}")
        return False
