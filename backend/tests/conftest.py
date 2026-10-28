# Shared test setup (iteration 11+): OTP login was removed, so old tests that call
# /api/auth/otp/* are transparently redirected to a fresh Google-style user + session
# created directly in MongoDB. Published card payloads get agreed_terms=True unless set.
import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import requests
from pymongo import MongoClient


def _env(path, key):
    try:
        for line in open(path):
            if line.startswith(key + "="):
                return line.split("=", 1)[1].strip().strip('"')
    except FileNotFoundError:
        pass
    return None


if not os.environ.get("REACT_APP_BACKEND_URL"):
    os.environ["REACT_APP_BACKEND_URL"] = _env("/app/frontend/.env", "REACT_APP_BACKEND_URL")

_mongo = MongoClient(_env("/app/backend/.env", "MONGO_URL"))
_db = _mongo[_env("/app/backend/.env", "DB_NAME")]
_orig_post = requests.Session.post
_orig_put = requests.Session.put
_orig_request = requests.Session.request


def _fake(status, data):
    r = requests.models.Response()
    r.status_code = status
    import json
    r._content = json.dumps(data).encode()
    r.headers["Content-Type"] = "application/json"
    return r


def _new_session(name="TEST_User"):
    uid = f"TEST_user_{uuid.uuid4().hex[:10]}"
    token = f"TEST_tok_{uuid.uuid4().hex}"
    user = {"user_id": uid, "auth_provider": "google", "email": f"{uid.lower()}@example.com",
            "name": name or "TEST_User", "picture": "", "is_admin": False,
            "created_at": datetime.now(timezone.utc).isoformat()}
    _db.users.insert_one(dict(user))
    _db.user_sessions.insert_one({"session_token": token, "user_id": uid,
                                  "expires_at": datetime.now(timezone.utc) + timedelta(days=2),
                                  "created_at": datetime.now(timezone.utc)})
    return user, token


def _patched_request(self, method, url, *args, **kwargs):
    u = str(url)
    if (kwargs.get("headers") or {}).get("X-No-Shim"):
        return _orig_request(self, method, url, *args, **kwargs)
    if u.endswith("/auth/otp/request"):
        return _fake(200, {"ok": True, "mocked": True, "dev_code": "123456"})
    if u.endswith("/auth/otp/verify"):
        body = kwargs.get("json") or {}
        if body.get("code") != "123456":
            return _fake(400, {"detail": "Invalid code"})
        user, token = _new_session(body.get("name"))
        self.headers["Authorization"] = f"Bearer {token}"
        self.cookies.set("session_token", token)
        return _fake(200, user)
    js = kwargs.get("json")
    if method.upper() in ("POST", "PUT") and isinstance(js, dict) and "/api/cards" in u \
            and js.get("status") == "published" and "agreed_terms" not in js:
        kwargs["json"] = {**js, "agreed_terms": True}
    return _orig_request(self, method, url, *args, **kwargs)


requests.Session.request = _patched_request


def pytest_collection_modifyitems(config, items):
    skip = pytest.mark.skip(reason="OTP/phone login removed in iteration 11 (obsolete)")
    for it in items:
        if it.name in ("test_otp_request_mock", "test_otp_invalid_phone", "test_otp_wrong_code",
                       "test_verify_cookie_me_bearer_logout"):
            it.add_marker(skip)


def pytest_sessionfinish(session, exitstatus):
    ids = [u["user_id"] for u in _db.users.find({"user_id": {"$regex": "^TEST_user_"}}, {"user_id": 1})]
    if ids:
        cards = [c["card_id"] for c in _db.cards.find({"owner_id": {"$in": ids}}, {"card_id": 1})]
        _db.cards.delete_many({"card_id": {"$in": cards}})
        _db.guests.delete_many({"card_id": {"$in": cards}})
        _db.wishes.delete_many({"card_id": {"$in": cards}})
        _db.user_sessions.delete_many({"user_id": {"$in": ids}})
        _db.users.delete_many({"user_id": {"$in": ids}})
