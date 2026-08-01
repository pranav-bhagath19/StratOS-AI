import hashlib
from datetime import datetime, timezone
from database.firebase import collections
from database.repositories.base import BaseRepository

class CacheRepository(BaseRepository):
    def __init__(self):
        super().__init__(collections.SCRAPER_CACHE)

    def _make_key(self, target_url: str, dataset_id: str) -> str:
        # Generate stable, valid firestore document key from target_url + dataset_id
        raw_key = f"{target_url}_{dataset_id}"
        return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    def get(self, target_url: str, dataset_id: str, cutoff_iso: str) -> dict | None:
        doc_id = self._make_key(target_url, dataset_id)
        if self.collection:
            doc = self.collection.document(doc_id).get()
            if doc.exists:
                data = doc.to_dict()
                if data.get("created_at", "") >= cutoff_iso:
                    return data
            return None
        else:
            data = self._read_local(doc_id)
            if data and data.get("created_at", "") >= cutoff_iso:
                return data
            return None

    def set(self, target_url: str, dataset_id: str, snapshot_id: str, data: dict | list) -> None:
        doc_id = self._make_key(target_url, dataset_id)
        now_str = datetime.now(timezone.utc).isoformat()
        row = {
            "id": doc_id,
            "target_url": target_url,
            "dataset_id": dataset_id,
            "snapshot_id": snapshot_id,
            "data": data,
            "created_at": now_str
        }
        if self.collection:
            self.collection.document(doc_id).set(row)
        else:
            self._write_local(doc_id, row)
