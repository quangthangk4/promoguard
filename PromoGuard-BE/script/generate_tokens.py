import time
import requests
import os
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

KEYCLOAK_URL = "http://56.10.12.163:8082" # Trỏ tới Keycloak của bạn
REALM = "PromoGuard"
CLIENT_ID = "promoguard-web"
USER_PASSWORD = "123456"

TOTAL_USERS = 10000 # Tổng số token cần sinh (phù hợp với kịch bản test lên tới 10,000 users)
MAX_WORKERS = 100  # Chạy song song 100 luồng để lấy token cực nhanh
OUTPUT_FILE = "../src/test/resources/tokens.csv"

# Tạo thư mục lưu trữ nếu chưa tồn tại
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

tokens = []
lock = threading.Lock()

def fetch_token(index):
    username = f"user{index:05d}@test.com"
    url = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token"
    
    try:
        response = requests.post(
            url,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={
                "grant_type": "password",
                "client_id": CLIENT_ID,
                "username": username,
                "password": USER_PASSWORD
            },
            timeout=10
        )
        
        if response.status_code == 200:
            access_token = response.json()["access_token"]
            return access_token
        else:
            return None
    except Exception as e:
        return None

def main():
    print(f"Bắt đầu lấy {TOTAL_USERS} tokens từ Keycloak tại {KEYCLOAK_URL}...")
    start_time = time.time()
    
    success_count = 0
    failed_count = 0
    
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(fetch_token, i): i for i in range(1, TOTAL_USERS + 1)}
        
        for idx, future in enumerate(as_completed(futures), start=1):
            token = future.result()
            if token:
                with lock:
                    tokens.append(token)
                success_count += 1
            else:
                failed_count += 1
                
            if idx % 500 == 0:
                print(f"Đã xử lý: {idx}/{TOTAL_USERS} | Thành công: {success_count} | Thất bại: {failed_count}")

    # Ghi tokens ra file CSV
    print(f"Đang ghi {len(tokens)} tokens vào file {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("token\n") # Gatling Header
        for token in tokens:
            f.write(f"{token}\n")
            
    elapsed = time.time() - start_time
    print("\n========== HOÀN THÀNH ==========")
    print(f"Tổng số token lấy được: {success_count}")
    print(f"Thất bại: {failed_count}")
    print(f"Thời gian thực hiện: {elapsed:.2f} giây")
    print(f"File lưu tại: {os.path.abspath(OUTPUT_FILE)}")

if __name__ == "__main__":
    main()
