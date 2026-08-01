from datetime import datetime, timezone
from database.firebase import collections
from database.repositories.base import BaseRepository

class BriefRepository(BaseRepository):
    def __init__(self):
        super().__init__(collections.BRIEFS)

    def insert(self, brief_id: str, analysis_id: str, brief_data: dict) -> dict:
        now_str = datetime.now(timezone.utc).isoformat()
        row = {
            "id": brief_id,
            "analysis_id": analysis_id,
            "market_move_score": brief_data.get("market_move_score", 0),
            "recommended_move": brief_data.get("recommended_move", "monitor").lower(),
            "confidence_score": brief_data.get("confidence_score", 0),
            "executive_summary": brief_data.get("executive_summary", ""),
            "action_pack": brief_data.get("action_pack", {}),
            "provider_calls": brief_data.get("provider_calls", []),
            "created_at": now_str,
            "shared_at": brief_data.get("shared_at")
        }
        
        if self.collection:
            self.collection.document(analysis_id).set(row)
        else:
            self._write_local(analysis_id, row)
        return row

    def get_by_analysis(self, analysis_id: str) -> dict | None:
        if self.collection:
            doc = self.collection.document(analysis_id).get()
            return doc.to_dict() if doc.exists else None
        return self._read_local(analysis_id)

    def mark_shared(self, analysis_id: str) -> dict | None:
        now_str = datetime.now(timezone.utc).isoformat()
        if self.collection:
            doc_ref = self.collection.document(analysis_id)
            doc = doc_ref.get()
            if doc.exists:
                doc_ref.update({"shared_at": now_str})
                return doc_ref.get().to_dict()
            return None
        else:
            row = self._read_local(analysis_id)
            if row:
                row["shared_at"] = now_str
                self._write_local(analysis_id, row)
                return row
            return None
