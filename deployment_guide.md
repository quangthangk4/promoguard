Preparing the Blueprint
  Dưới đây là cẩm nang hướng dẫn toàn bộ quy trình từ Build local -> Upload -> Deploy từ đầu trên VPS.
  ──────
  ### PHẦN 1: BUILD LẠI FILE JAR TẠI MÁY LOCAL
  Mở PowerShell trên máy local của bạn tại thư mục gốc  C:\Users\thang\OneDrive\Desktop\PromoGuard :

    # 1. Di chuyển vào thư mục Backend
    cd PromoGuard-BE

    # 2. Dọn dẹp và đóng gói lại dự án (bỏ qua chạy test để build nhanh hơn)
    .\mvnw clean package -DskipTests

    # 3. Quay trở ra thư mục gốc
    cd ..

  Kết quả: Bạn sẽ có một file JAR sạch sẽ không còn outbox tại đường dẫn  PromoGuard-BE/target/demo-0.0.1-SNAPSHOT.jar .
  ──────
  ### PHẦN 2: ĐƯA CÁC FILE LÊN VPS (SCP)

  Vẫn đứng tại thư mục gốc  C:\Users\thang\OneDrive\Desktop\PromoGuard  trên máy local (nơi có file khoá  promoguardKey.pem ), chạy các lệnh
  sau:

    # 1. Đảm bảo cấu trúc thư mục trên VPS đã sẵn sàng
    ssh -i promoguardKey.pem ubuntu@56.10.12.163 "mkdir -p ~/promoguard/PromoGuard-BE/target ~/promoguard/deploy/keycloak/import"

    # 2. Upload file JAR mới lên VPS
    scp -i promoguardKey.pem PromoGuard-BE/target/demo-0.0.1-SNAPSHOT.jar ubuntu@56.10.12.163:~/promoguard/PromoGuard-BE/target/

    # 3. Upload file cấu hình docker-compose.yml mới lên VPS
    scp -i promoguardKey.pem docker-compose.yml ubuntu@56.10.12.163:~/promoguard/

    # 4. Upload file export cấu hình Keycloak lên VPS
    scp -i promoguardKey.pem deploy/keycloak/import/promoguard-realm.json ubuntu@56.10.12.163:~/promoguard/deploy/keycloak/import/
    ──────
  ### PHẦN 3: DEPLOY LẠI TỪ ĐẦU TRÊN VPS

  Bước 1: SSH vào VPS:

    ssh -i promoguardKey.pem ubuntu@56.10.12.163

  Bước 2: Xoá sạch cụm cũ (bao gồm cả database trống cũ để khởi tạo mới hoàn toàn):

    cd ~/promoguard

    # Lệnh này sẽ xoá các container cũ và xoá sạch dữ liệu các Volume cũ (-v) để tránh lỗi lệch cấu hình
    docker compose --profile full down -v

  Bước 3: Khởi chạy cụm dịch vụ mới:

    docker compose --profile full up -d --build

  (Docker Compose sẽ tự động nhận file  promoguard-realm.json  để cấu hình sẵn Keycloak khi khởi chạy).

  Bước 4: Tắt tính năng ép buộc HTTPS của Keycloak trên VPS:
  Sau khi chạy lệnh khởi động khoảng 15 - 20 giây (chờ Keycloak tạo xong database), bạn chạy lệnh sau trên VPS:

    # 1. Tắt ép buộc HTTPS trong DB của Keycloak
    docker exec -it promoguard-keycloak-postgres psql -U keycloak -d keycloak -c "UPDATE realm SET ssl_required = 'NONE';"

    # 2. Khởi động lại container Keycloak để nhận cấu hình mới
    docker restart promoguard-keycloak
    ──────
  ### PHẦN 4: KIỂM TRA HỆ THỐNG

  1. Xem log của Spring Boot App:
    docker compose logs -f app
    (Hãy kiểm tra xem log có báo lỗi kết nối DB, Redis, Kafka hay lỗi Keycloak Issuer URI không. Nếu log hiển thị  Started DemoApplication...
  là thành công).
  2. Truy cập các dịch vụ:
      • Keycloak (Quản lý User & Client): Truy cập  http://56.10.12.163:8082  (Đăng nhập  admin / admin  và kiểm tra xem Realm  PromoGuard
      đã được import tự động chưa).
      • Swagger UI (Test API): Truy cập  http://56.10.12.163:8080/swagger-ui/index.html .