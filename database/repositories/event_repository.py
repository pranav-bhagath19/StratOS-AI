from datetime import datetime, timezone
from database.firebase import collections
from database.repositories.base import BaseRepository

class EventRepository(BaseRepository):
    def __init__(self):
        super().__init__(collections.INTELLIGENCE_EVENTS)

    def insert(self, event_id: str, analysis_id: str, agent: str, event_type: str, message: str, payload: dict | None = None, provider_product: str | None = None) -> dict:
        now_str = datetime.now(timezone.utc).isoformat()
        row = {
            "id": event_id,
            "analysis_id": analysis_id,
            "agent": agent,
            "event_type": event_type.lower(),
            "message": message,
            "payload": payload,
            "provider_product": provider_product,
            "created_at": now_str
        }
        if self.collection:
            self.collection.document(event_id).set(row)
        else:
            self._write_local(event_id, row)
        return row

    def list_for_analysis(self, analysis_id: str) -> list[dict]:
        if self.collection:
            docs = self.collection.where("analysis_id", "==", analysis_id).stream()
            results = [d.to_dict() for d in docs]
        else:
            results = [r for r in self._list_local() if r.get("analysis_id") == analysis_id]
        
        results.sort(key=lambda x: x.get("created_at", ""))
        return results
