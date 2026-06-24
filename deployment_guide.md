 ### Bước 1: Mở Port trên Security Group của AWS (Bắt buộc)

  Mặc định AWS khóa hầu hết các cổng kết nối. Bạn cần truy cập vào trang quản trị AWS EC2 Console -> chọn Instance
  của bạn -> vào tab Security -> chọn Security Group và thêm các luật (Inbound Rules) sau:

  •  SSH  (Port 22): Cho phép IP của bạn truy cập để gõ lệnh.
  •  HTTP  (Port 80) &  HTTPS  (Port 443): Cho phép mọi IP truy cập (0.0.0.0/0) để Nginx định tuyến.
  •  Custom TCP  (Port 3000): Cho phép IP của bạn truy cập để xem dashboard Grafana.
  •  Custom TCP  (Port 8082): Cho phép IP của bạn truy cập Keycloak Admin Console (để cấu hình ban đầu).
  ──────
  ### Bước 2: Truy cập vào VPS qua SSH

  Mở Terminal trên máy tính (hoặc Git Bash/PowerShell) và chạy lệnh:

    ssh -i "duong/dan/toi/file-key-aws.pem" ubuntu@IP_PUBLIC_CUA_VPS

  (Nếu bạn dùng hệ điều hành khác Ubuntu trên AWS, user có thể là  ec2-user  hoặc  admin ).
  ──────
  ### Bước 3: Cài đặt Docker & Docker Compose trên VPS

  Sau khi đã SSH vào VPS thành công, bạn chạy các lệnh sau để cài đặt Docker:
    # Cập nhật các gói phần mềm hệ thống
    sudo apt update && sudo apt upgrade -y

    # Tải và chạy script cài đặt Docker chính thức
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh

    # Cài đặt docker-compose plugin
    sudo apt install docker-compose-plugin -y

    # Phân quyền cho user ubuntu chạy docker không cần sudo (tiện lợi hơn)
    sudo usermod -aG docker ubuntu

    # Khởi động lại session SSH để phân quyền docker có hiệu lực
    exit

  Sau đó thực hiện SSH lại vào VPS.
  ──────
  ### Bước 4: Chuyển mã nguồn và File JAR từ Local lên VPS
  Vì hệ thống dùng JOOQ để sinh code (cần kết nối DB local khi compile), cách chuẩn nhất là bạn biên dịch (build)
  file JAR ở máy local, sau đó đẩy tệp JAR này lên VPS.

  #### 1. Trên máy Local (máy tính của bạn):
  Mở terminal tại thư mục  PromoGuard-BE  và build file JAR:
    .\mvnw.cmd clean package -DskipTests

  Lệnh này sẽ tạo ra tệp  demo-0.0.1-SNAPSHOT.jar  trong thư mục  target .

  #### 2. Trên VPS:

  Tải thư mục dự án (chứa  docker-compose.yml , thư mục  deploy ) lên VPS. Bạn có thể dùng  Git clone  từ repository
  của bạn:

    # Clone dự án về thư mục home của VPS
    git clone <URL_REPOSITORY_CUA_BAN> promoguard
    cd promoguard

    # Tạo thư mục target trống bên trong BE để chứa file JAR sắp đẩy lên
    mkdir -p PromoGuard-BE/target

  #### 3. Đẩy file JAR từ Local lên VPS:

  Mở một terminal mới trên máy local của bạn, đứng tại thư mục  PromoGuard-BE  và chạy lệnh gửi file:

    scp -i "duong/dan/file-key-aws.pem" target/demo-0.0.1-SNAPSHOT.jar
  ubuntu@IP_PUBLIC_CUA_VPS:/home/ubuntu/promoguard/PromoGuard-BE/target/
    ──────
  ### Bước 5: Cấu hình File  .env  trên VPS

  Trên VPS, tạo file  .env  tại thư mục  /home/ubuntu/promoguard :

    nano .env

  Nhập nội dung cấu hình sau:

    # IP Public của VPS AWS
    VPS_IP=IP_PUBLIC_CUA_VPS

    # Thông tin Database
    POSTGRES_DB=promoguard
    POSTGRES_USER=promoguard
    POSTGRES_PASSWORD=MatKhauBaoMatCuaBan

    # Redis
    REDIS_PORT=6379

    # Active Profile
    SPRING_PROFILES_ACTIVE=production

  Nhấn  Ctrl + O  để lưu,  Enter  và  Ctrl + X  để thoát.
  ──────
  ### Bước 6: Khởi chạy ứng dụng
  Chạy lệnh khởi động Docker Compose ngay tại thư mục chứa tệp  docker-compose.yml  trên VPS:
    docker compose --profile full up -d --build

  Lệnh này sẽ tải các image cần thiết, build Docker image cho Spring Boot và chạy toàn bộ dịch vụ ngầm ( -d ).
  ──────
  ### Bước 7: Cấu hình Realm Keycloak trên VPS
  1. Mở trình duyệt trên máy local, truy cập:  http://IP_PUBLIC_CUA_VPS:8082
  2. Đăng nhập Keycloak với tài khoản admin (xem cấu hình username/password admin của keycloak trong file  docker-
  compose.yml  của bạn, thường mặc định là  admin / admin ).
  3. Nhấp vào góc trên bên trái (phần chọn Realm) -> chọn Create Realm -> Chọn Browse và tải lên file cấu hình Realm
  đã export sẵn tại đường dẫn thư mục  deploy/keycloak/import/  để tự động phục hồi cấu hình client, vai trò và user.