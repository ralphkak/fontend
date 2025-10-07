from datetime import datetime
from uuid import uuid4

lifelog_db = []

def create_log_item(item: dict):
    if not item.get("text"):
        raise ValueError("text is required")
    rec = {
        "id": str(uuid4()),
        "ts": datetime.utcnow().isoformat() + "Z",
        "kind": item.get("kind", "note"),
        "text": item["text"],
        "props": item.get("props", {}),
    }
    lifelog_db.append(rec)
    return rec
