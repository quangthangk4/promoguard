import time
import requests
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

KEYCLOAK_URL = "http://localhost:8082"
ADMIN_REALM = "master"
TARGET_REALM = "PromoGuard"

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"

USER_PASSWORD = "123456"

TOTAL_USERS = 10000
MAX_WORKERS = 50

# =========================
# TOKEN
# =========================

token_lock = threading.Lock()

admin_token = None
token_created_at = 0

def get_admin_token():
    response = requests.post(
        f"{KEYCLOAK_URL}/realms/{ADMIN_REALM}/protocol/openid-connect/token",
        headers={
            "Content-Type": "application/x-www-form-urlencoded"
        },
        data={
            "grant_type": "password",
            "client_id": "admin-cli",
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        }
    )

    response.raise_for_status()

    return response.json()["access_token"]


def ensure_token():
    global admin_token
    global token_created_at

    with token_lock:
        if (
            admin_token is None
            or time.time() - token_created_at > 50
        ):
            admin_token = get_admin_token()
            token_created_at = time.time()

    return admin_token

# =========================
# CREATE USER
# =========================

def create_user(index):

    token = ensure_token()

    username = f"user{index:05d}"

    payload = {
        "username": username,
        "enabled": True,
        "emailVerified": True,
        "email": f"{username}@test.com",
        "credentials": [
            {
                "type": "password",
                "value": USER_PASSWORD,
                "temporary": False
            }
        ]
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    response = requests.post(
        f"{KEYCLOAK_URL}/admin/realms/{TARGET_REALM}/users",
        headers=headers,
        json=payload,
        timeout=30
    )

    # token hết hạn giữa chừng
    if response.status_code == 401:

        token = get_admin_token()

        headers["Authorization"] = f"Bearer {token}"

        response = requests.post(
            f"{KEYCLOAK_URL}/admin/realms/{TARGET_REALM}/users",
            headers=headers,
            json=payload,
            timeout=30
        )

    if response.status_code == 201:
        return "created"

    if response.status_code == 409:
        return "exists"

    return f"failed: {response.status_code}"

# =========================
# MAIN
# =========================

created = 0
exists = 0
failed = 0

start = time.time()

with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:

    futures = [
        executor.submit(create_user, i)
        for i in range(1, TOTAL_USERS + 1)
    ]

    for idx, future in enumerate(as_completed(futures), start=1):

        result = future.result()

        if result == "created":
            created += 1

        elif result == "exists":
            exists += 1

        else:
            failed += 1
            print(result)

        if idx % 100 == 0:
            print(
                f"Processed={idx} "
                f"Created={created} "
                f"Exists={exists} "
                f"Failed={failed}"
            )

elapsed = time.time() - start

print("\n========== DONE ==========")
print(f"Created : {created}")
print(f"Exists  : {exists}")
print(f"Failed  : {failed}")
print(f"Time    : {elapsed:.2f}s")