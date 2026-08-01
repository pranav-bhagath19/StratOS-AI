from datetime import datetime, timezone
from database.firebase import collections
from database.repositories.base import BaseRepository

class ScheduleRepository(BaseRepository):
    def __init__(self):
        super().__init__(collections.ANALYSIS_SCHEDULES)

    def list_all(self) -> list[dict]:
        if self.collection:
            docs = self.collection.stream()
            results = [d.to_dict() for d in docs]
        else:
            results = self._list_local()
        
        results.sort(key=lambda x: x.get("created_at", ""))
        return results

    def insert(self, schedule_id: str, target: str, analysis_type: str, cron: str, label: str | None = None, slack_webhook_url: str | None = None) -> dict:
        now_str = datetime.now(timezone.utc).isoformat()
        row = {
            "id": schedule_id,
            "target": target,
            "analysis_type": analysis_type.lower(),
            "cron": cron,
            "label": label,
            "slack_webhook_url": slack_webhook_url,
            "last_run_at": None,
            "last_analysis_id": None,
            "created_at": now_str
        }
        if self.collection:
            self.collection.document(schedule_id).set(row)
        else:
            self._write_local(schedule_id, row)
        return row

    def delete(self, schedule_id: str) -> None:
        if self.collection:
            self.collection.document(schedule_id).delete()
        else:
            self._delete_local(schedule_id)

    def mark_ran(self, schedule_id: str, analysis_id: str) -> None:
        now_str = datetime.now(timezone.utc).isoformat()
        if self.collection:
            self.collection.document(schedule_id).update({
                "last_run_at": now_str,
                "last_analysis_id": analysis_id
            })
        else:
            row = self._read_local(schedule_id)
            if row:
                row["last_run_at"] = now_str
                row["last_analysis_id"] = analysis_id
                self._write_local(schedule_id, row)
