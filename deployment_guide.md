# Hướng dẫn Triển khai Hệ thống PromoGuard lên VPS

Tài liệu này hướng dẫn chi tiết quy trình triển khai hệ thống **PromoGuard** lên máy chủ ảo VPS (khuyên dùng hệ điều hành Ubuntu Server 22.04 LTS hoặc 24.04 LTS).

---

## 1. Chuẩn bị Hạ tầng VPS & Tối ưu hóa Bộ nhớ

Hệ thống của chúng ta chạy đồng thời nhiều container nặng như **Keycloak**, **Kafka**, **Postgres**, **Redis**, **Spring Boot App** cùng **4 Exporters**.

*   **Cấu hình khuyến nghị:** Tối thiểu 2 vCPU / 4GB RAM.
*   **Mẹo tối ưu bộ nhớ (Crucial Senior Tip):** Với VPS 4GB RAM, khi chạy đồng loạt các container này hệ thống rất dễ gặp tình trạng Out-Of-Memory (OOM) khiến các container tự động bị tắt (thường là Keycloak hoặc Kafka). Hãy cấu hình **4GB Virtual Memory (SWAP)** để hệ thống chạy ổn định 100%:

### Thiết lập SWAP trên VPS (Ubuntu):
Chạy các lệnh sau với quyền `root` trên VPS:
```bash
# 1. Tạo file swap kích thước 4GB
sudo fallocate -l 4G /swapfile

# 2. Phân quyền chỉ cho root truy cập
sudo chmod 600 /swapfile

# 3. Định dạng file thành swap space
sudo mkswap /swapfile

# 4. Kích hoạt swap
sudo swapon /swapfile

# 5. Cấu hình tự động mount swap khi reboot VPS
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 6. Kiểm tra lại hoạt động
free -h
```

---

## 2. Cài đặt Docker & Docker Compose trên VPS

Chạy script cài đặt nhanh chính thức từ Docker trên VPS:
```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài đặt Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Kiểm tra phiên bản cài đặt thành công
docker --version
docker compose version
```

---

## 3. Quy trình Đóng gói & Chuyển mã nguồn lên VPS

Vì quá trình biên dịch Maven (`mvnw clean package`) cần kết nối DB để sinh code JOOQ, ta sẽ build file JAR ở **máy local** của bạn, sau đó đẩy lên VPS.

### Bước 1: Build file JAR tại máy local
Chạy lệnh sau tại thư mục `PromoGuard-BE` trên máy local (đảm bảo container postgres local đang chạy):
```powershell
.\mvnw.cmd clean package -DskipTests
```
Lệnh này sẽ tạo ra tệp JAR tại thư mục `target/demo-0.0.1-SNAPSHOT.jar`.

### Bước 2: Đẩy mã nguồn lên VPS
Bạn có thể sử dụng Git hoặc lệnh `scp` để chuyển tệp lên VPS. Cách đơn giản nhất:
1.  **Git clone** dự án từ repository của bạn lên VPS.
2.  Đẩy file JAR mới build lên thư mục `PromoGuard-BE/target/` trên VPS thông qua công cụ SFTP (FileZilla/MobaXterm) hoặc dùng lệnh `scp` từ máy local:
    ```powershell
    scp target/demo-0.0.1-SNAPSHOT.jar user@vps_ip:/path/to/project/PromoGuard-BE/target/
    ```

---

## 4. Thiết lập File Môi trường `.env` trên VPS

Tạo một file `.env` tại thư mục gốc của dự án trên VPS để định cấu hình các tham số sản xuất (Production config):

```env
# IP hoặc Tên miền của VPS
VPS_IP=your_vps_ip_or_domain

# Database Credentials
POSTGRES_DB=promoguard
POSTGRES_USER=promoguard
POSTGRES_PASSWORD=MatKhauBaoMatCuaBan

# Redis Configuration
REDIS_PORT=6379

# Profile Spring Boot hoạt động
SPRING_PROFILES_ACTIVE=production
```

> [!WARNING]
> Cần thay đổi mật khẩu mặc định của Postgres trong file `.env` và cập nhật tương ứng các URL kết nối của ứng dụng.

---

## 5. Trỏ Domain & Thiết lập SSL (HTTPS) cho Nginx

Để hệ thống chạy qua giao thức HTTPS bảo mật bằng Cloudflare (Khuyên dùng):

1.  **Cấu hình DNS:** Truy cập trang quản trị Domain (như Cloudflare, GoDaddy), tạo một bản ghi **A Record** trỏ tên miền (ví dụ `promoguard.yourdomain.com`) về IP của VPS.
2.  **Bật Proxy Cloudflare:** Bật biểu tượng đám mây màu vàng (Proxied) trên Cloudflare DNS.
3.  **Cấu hình SSL trên Cloudflare:** Chọn chế độ mã hóa SSL/TLS là **Full** hoặc **Flexible**. Điều này giúp mã hóa HTTPS từ Client đến Cloudflare, và Cloudflare sẽ định tuyến an toàn tới cổng 80 của Nginx trên VPS.

---

## 6. Khởi chạy Hệ thống trên VPS

Di chuyển đến thư mục gốc chứa tệp `docker-compose.yml` trên VPS và kích hoạt:

```bash
# Khởi chạy các cơ sở dữ liệu và Kafka (không chạy app/nginx profile)
docker compose up -d

# Nếu muốn build và khởi chạy ứng dụng (Backend app + Nginx proxy):
docker compose --profile full up -d --build
```

Kiểm tra trạng thái hoạt động của các container:
```bash
docker ps
```

---

## 7. Cấu hình Realm Keycloak trên VPS

1.  Truy cập Keycloak Admin Portal tại địa chỉ: `http://<your_vps_ip_or_domain>:8082` (Đăng nhập bằng tài khoản admin thiết lập trong file docker-compose).
2.  Tạo mới một Realm bằng cách nhấn **Import Realm**.
3.  Chọn tệp cấu hình Realm đã xuất sẵn (từ thư mục `deploy/keycloak/import/`) để khôi phục toàn bộ cấu hình Client (`promoguard-web`), các vai trò (Roles) và các tài khoản người dùng thử nghiệm.

---

## 8. Kiểm tra Giám sát Grafana

*   Truy cập Grafana tại `http://<your_vps_ip_or_domain>:3000`.
*   Truy cập mục **Data Sources** kiểm tra kết nối với Prometheus (`http://prometheus:9090`).
*   Nhập (Import) các Dashboards tương ứng với Exporters để theo dõi:
    *   **Postgres Dashboard:** ID `9628` (dành cho postgres-exporter).
    *   **Redis Dashboard:** ID `11833` (dành cho redis-exporter).
    *   **JVM Dashboard:** ID `4701` (dành cho Micrometer Spring Boot).
    *   **Nginx Dashboard:** ID `12708` (dành cho nginx-prometheus-exporter).
