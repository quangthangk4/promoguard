import requests
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

KEYCLOAK_URL = "http://56.10.12.163:8082"
ADMIN_REALM = "master"
TARGET_REALM = "PromoGuard"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"
MAX_WORKERS = 100

def get_admin_token():
    response = requests.post(
        f"{KEYCLOAK_URL}/realms/{ADMIN_REALM}/protocol/openid-connect/token",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={
            "grant_type": "password",
            "client_id": "admin-cli",
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        }
    )
    response.raise_for_status()
    return response.json()["access_token"]

admin_token = get_admin_token()

def update_user(user):
    username = user.get("username", "")
    if "@test.com" not in username:
        return "skip"
    
    try:
        idx_str = username.split("@")[0].replace("user", "")
        user["firstName"] = "User"
        user["lastName"] = idx_str
        
        headers = {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }
        res = requests.put(
            f"{KEYCLOAK_URL}/admin/realms/{TARGET_REALM}/users/{user['id']}",
            headers=headers,
            json=user,
            timeout=10
        )
        if res.status_code in [200, 204]:
            return "updated"
        return f"failed: {res.status_code}"
    except Exception as e:
        return f"error: {str(e)}"

# Fetch users
users = []
first = 0
max_results = 500
headers = {
    "Authorization": f"Bearer {admin_token}",
    "Content-Type": "application/json"
}

print("Đang tải danh sách người dùng từ Keycloak trên VPS...")
while True:
    res = requests.get(
        f"{KEYCLOAK_URL}/admin/realms/{TARGET_REALM}/users?first={first}&max={max_results}",
        headers=headers
    )
    data = res.json()
    if not data:
        break
    users.extend(data)
    first += max_results
    print(f"Đã tải {len(users)} người dùng...")

print(f"Tổng số người dùng đã tải: {len(users)}. Bắt đầu cập nhật firstName/lastName...")

updated = 0
failed = 0
skipped = 0

with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
    futures = [executor.submit(update_user, u) for u in users]
    for idx, fut in enumerate(as_completed(futures), 1):
        res = fut.result()
        if res == "updated":
            updated += 1
        elif res == "skip":
            skipped += 1
        else:
            failed += 1
            
        if idx % 1000 == 0:
            print(f"Đã xử lý {idx}/{len(users)} | Thành công: {updated} | Bỏ qua: {skipped} | Lỗi: {failed}")

print(f"\n========== HOÀN THÀNH ==========")
print(f"Cập nhật thành công: {updated}")
print(f"Bỏ qua: {skipped}")
print(f"Lỗi: {failed}")
