import uuid
from datetime import datetime, timezone
from database.firebase import collections
from database.repositories.base import BaseRepository, _load_local_db, _save_local_db

class CitationRepository(BaseRepository):
    def __init__(self):
        super().__init__(collections.CITATIONS)

    def insert_citations(self, citations: list[dict]) -> list[dict]:
        if not citations:
            return []
        
        now_str = datetime.now(timezone.utc).isoformat()
        inserted = []
        
        if self.collection:
            for cit in citations:
                cit_id = str(uuid.uuid4())
                row = {
                    **cit,
                    "id": cit_id,
                    "created_at": now_str
                }
                self.collection.document(cit_id).set(row)
                inserted.append(row)
        else:
            db = _load_local_db()
            if self.collection_name not in db:
                db[self.collection_name] = {}
            for cit in citations:
                cit_id = str(uuid.uuid4())
                row = {
                    **cit,
                    "id": cit_id,
                    "created_at": now_str
                }
                db[self.collection_name][cit_id] = row
                inserted.append(row)
            _save_local_db(db)
            
        return inserted

    def list_citations(self, analysis_id: str) -> list[dict]:
        if self.collection:
            docs = self.collection.where("analysis_id", "==", analysis_id).stream()
            results = [d.to_dict() for d in docs]
        else:
            db = _load_local_db()
            citations_dict = db.get(self.collection_name, {})
            results = [c for c in citations_dict.values() if c.get("analysis_id") == analysis_id]
            
        results.sort(key=lambda x: x.get("created_at", ""))
        return results
