import os
import json
import logging
from database.firebase.firestore import DatabaseProvider

log = logging.getLogger(__name__)

LOCAL_DB_FILE = "firebase_local.json"

def _load_local_db() -> dict:
    if not os.path.exists(LOCAL_DB_FILE):
        return {
            "analyses": {},
            "briefs": {},
            "intelligence_events": {},
            "citations": {},
            "analysis_schedules": {},
            "scraper_cache": {}
        }
    try:
        with open(LOCAL_DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        log.warning(f"Firebase Local: Failed to read local DB: {exc}")
        return {
            "analyses": {},
            "briefs": {},
            "intelligence_events": {},
            "citations": {},
            "analysis_schedules": {},
            "scraper_cache": {}
        }

def _save_local_db(db: dict):
    try:
        with open(LOCAL_DB_FILE, "w", encoding="utf-8") as f:
            json.dump(db, f, indent=2, ensure_ascii=False)
    except Exception as exc:
        log.warning(f"Firebase Local: Failed to save local DB: {exc}")


class BaseRepository:
    def __init__(self, collection_name: str):
        self.collection_name = collection_name

    @property
    def client(self):
        return DatabaseProvider.get_client()

    @property
    def collection(self):
        cl = self.client
        if cl:
            return cl.collection(self.collection_name)
        return None

    def _write_local(self, doc_id: str, data: dict):
        db = _load_local_db()
        if self.collection_name not in db:
            db[self.collection_name] = {}
        db[self.collection_name][doc_id] = data
        _save_local_db(db)

    def _delete_local(self, doc_id: str):
        db = _load_local_db()
        if self.collection_name in db and doc_id in db[self.collection_name]:
            del db[self.collection_name][doc_id]
            _save_local_db(db)

    def _read_local(self, doc_id: str) -> dict | None:
        db = _load_local_db()
        return db.get(self.collection_name, {}).get(doc_id)

    def _list_local(self) -> list[dict]:
        db = _load_local_db()
        return list(db.get(self.collection_name, {}).values())
