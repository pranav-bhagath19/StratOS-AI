from datetime import datetime, timezone
from database.firebase import collections
from database.repositories.base import BaseRepository

class AnalysisRepository(BaseRepository):
    def __init__(self):
        super().__init__(collections.ANALYSES)

    def insert(self, analysis_id: str, target: str, analysis_type: str, context: str | None = None, status: str = "queued") -> dict:
        now_str = datetime.now(timezone.utc).isoformat()
        row = {
            "id": analysis_id,
            "target": target,
            "analysis_type": analysis_type.lower(),
            "status": status,
            "context": context,
            "created_at": now_str,
            "updated_at": now_str
        }
        
        if self.collection:
            self.collection.document(analysis_id).set(row)
        else:
            self._write_local(analysis_id, row)
        return row

    def update_status(self, analysis_id: str, status: str) -> None:
        now_str = datetime.now(timezone.utc).isoformat()
        if self.collection:
            self.collection.document(analysis_id).update({
                "status": status,
                "updated_at": now_str
            })
        else:
            row = self._read_local(analysis_id)
            if row:
                row["status"] = status
                row["updated_at"] = now_str
                self._write_local(analysis_id, row)

    def get(self, analysis_id: str) -> dict | None:
        if self.collection:
            doc = self.collection.document(analysis_id).get()
            return doc.to_dict() if doc.exists else None
        return self._read_local(analysis_id)

    def list_all(self, limit: int = 20, offset: int = 0) -> list[dict]:
        if self.collection:
            docs = self.collection.stream()
            results = [d.to_dict() for d in docs]
        else:
            results = self._list_local()

        # Sort by created_at DESC
        results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return results[offset:offset+limit]

    def find_prior(self, target: str, analysis_type: str, exclude_id: str) -> dict | None:
        if self.collection:
            docs = self.collection.where("target", "==", target).where("status", "==", "completed").stream()
            results = [d.to_dict() for d in docs]
        else:
            results = [r for r in self._list_local() if r.get("target") == target and r.get("status") == "completed"]

        filtered = [
            r for r in results
            if r.get("analysis_type") == analysis_type.lower() and r.get("id") != exclude_id
        ]
        if not filtered:
            return None
        filtered.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return filtered[0]
