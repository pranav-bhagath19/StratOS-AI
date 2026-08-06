import logging
from database.repositories.base import BaseRepository

log = logging.getLogger(__name__)

class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__("users")

    def insert_or_update(self, uid: str, display_name: str, email: str, photo_url: str | None = None, provider: str = "google") -> dict:
        data = {
            "uid": uid,
            "display_name": display_name,
            "email": email,
            "photo_url": photo_url,
            "provider": provider,
            "updated_at": str(logging.Formatter().formatTime(logging.LogRecord("", 0, "", 0, "", (), None))),
        }
        if self.collection:
            try:
                self.collection.document(uid).set(data, merge=True)
                return data
            except Exception as exc:
                log.exception(f"Firebase Firestore UserRepository: Failed to write user {uid}: {exc}")
        
        self._write_local(uid, data)
        return data

    def get(self, uid: str) -> dict | None:
        if self.collection:
            try:
                doc = self.collection.document(uid).get()
                if doc.exists:
                    return doc.to_dict()
                return None
            except Exception as exc:
                log.warning(f"Firebase Firestore UserRepository: Failed to get user {uid}: {exc}")

        return self._read_local(uid)
