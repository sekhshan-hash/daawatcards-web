import os

import requests

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
STORAGE_PREFIX = "invites"
_storage_key = None


def init_storage(force: bool = False):
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


def _request(method, path, **kwargs):
    for attempt in range(2):
        headers = {"X-Storage-Key": init_storage(force=attempt == 1), **kwargs.pop("headers", {})}
        resp = requests.request(method, f"{STORAGE_URL}/objects/{path}", headers=headers, **kwargs)
        if resp.status_code != 404 or attempt == 1:
            resp.raise_for_status()
            return resp
        kwargs["headers"] = {k: v for k, v in headers.items() if k != "X-Storage-Key"}
    return resp


def put_object(path: str, data: bytes, content_type: str) -> dict:
    return _request("PUT", path, headers={"Content-Type": content_type}, data=data, timeout=120).json()


def get_object(path: str):
    resp = _request("GET", path, timeout=60)
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
