 Tôi hoàn toàn đồng ý 100% với những nhận xét và bổ sung này. Những lời khuyên này cực kỳ sắc sảo, mang tính thực
  chiến cao và phản ánh đúng tư duy của một Senior Backend Engineer/Tech Lead khi thiết kế và tối ưu hệ thống.

  Nếu bạn đưa dự án này đi phỏng vấn, nhà tuyển dụng sẽ không chỉ hỏi "Bạn có dùng Kafka/Redis không?" (vì ai cũng có
  thể vẽ ra sơ đồ đó), mà họ sẽ hỏi: "Khi chạy 10.000 user, bottleneck đầu tiên xuất hiện ở đâu? Bạn đã phân tích chỉ
  số nào để tìm ra nó và đã tuning cấu hình gì để vượt qua?"
  Do đó, chúng ta nên điều chỉnh lại Kế hoạch (Plan) hoàn thiện dự án theo đúng định hướng này. Dưới đây là kế hoạch
  mới đã được nâng cấp dựa trên các góp ý chất lượng ở trên:
  ──────
   KẾ HOẠCH NÂNG CẤP DÀNH CHO SENIOR PORTFOLIO SHOWCASE
  ### GIAI ĐOẠN 1: DOCKER HÓA & TRANG BỊ CÁC EXPORTER GIÁM SÁT
  Để Grafana có thể vẽ được biểu đồ chi tiết của Nginx, Postgres, Redis và Kafka, chúng ta cần bổ sung các container
  Exporter vào hệ thống giám sát:
  1. Backend App Dockerization: Viết Dockerfile tối ưu (dùng multi-stage build để giảm kích thước image).
  2. Postgres Exporter ( postgres-exporter ): Thu thập số liệu về Active Connections, Locks, Transactions/sec, và
  Deadlocks.
  3. Redis Exporter ( redis-exporter ): Thu thập số liệu về Connected Clients, Memory usage, Ops/sec.
  4. Kafka Exporter ( kafka-exporter  hoặc JMX): Đo đạc chính xác Producer Rate, Consumer Rate và Lag trên từng
  Partition.
  5. Nginx Stub Status & Nginx Exporter: Bật cấu hình  /stub_status  của Nginx để đo số lượng Active/Waiting
  Connections.
  ──────
  ### GIAI ĐOẠN 2: DEPLOY LÊN VPS & THIẾT LẬP DOMAIN + SSL

  • Tải toàn bộ hạ tầng mới lên VPS.
  • Cấu hình Domain và SSL (Let's Encrypt) thông qua Nginx.
  • Thiết lập bảo mật cơ bản cho VPS (UFW firewall, chỉ mở các cổng cần thiết như 80, 443, 3000 cho Grafana, v.v.).
  ──────
  ### GIAI ĐOẠN 3: XÂY DỰNG HAI KỊCH BẢN THỬ NGHIỆM GATLING (TÁCH BIỆT AUTH)
  Chúng ta sẽ viết kịch bản Gatling chia làm 2 bài test riêng biệt để cô lập lỗi:

  • Kịch bản A (Chỉ test Claim - JWT có sẵn):
      • Sử dụng Access Token đã được lấy và lưu sẵn trong file CSV.
      • Mục tiêu: Đo hiệu năng thuần của logic Nghiệp vụ (Spring Boot -> Redis Lua Script -> Kafka -> Postgres
      Consumer).
  • Kịch bản B (Test End-to-End - Login + Claim):
      • Mỗi user ảo của Gatling sẽ thực hiện: Gọi API Login Keycloak để lấy token -> Dùng token đó gọi API Claim.
      • Mục tiêu: Chỉ ra sự sụt giảm hiệu năng rõ rệt khi có thêm bước xác thực (do Keycloak mã hóa password tốn rất
      nhiều CPU) và chứng minh sự cần thiết của việc tách biệt tải.

  ──────
  ### GIAI ĐOẠN 4: CHẠY THỬ NGHIỆM BASELINE & XÁC ĐỊNH ĐIỂM GÃY

  Tiến hành nâng dần lượng Concurrent Users (người dùng đồng thời) theo các mốc:

    Users:  100 → 500 → 1000 → 2000 → 5000 → 10000

  Mỗi mốc chạy trong vòng 1-2 phút và ghi nhận lại:

  • TPS (Throughput)
  • P95 Response Time
  • Error Rate (%)
  • Quan sát biểu đồ Grafana để tìm xem ở mốc nào hệ thống bắt đầu "đuối" và dịch vụ nào đạt ngưỡng giới hạn trước
  (CPU VPS đạt 100%, RAM cạn kiệt, hay Connection Pool bị chờ).
  ──────
  ### GIAI ĐOẠN 5: TỐI ƯU HÓA HỆ THỐNG THEO QUY TRÌNH KHOA HỌC

  Khi phát hiện bottleneck, chúng ta sẽ tối ưu theo thứ tự ưu tiên:

  1. Nếu nghẽn Database:
      • Kiểm tra xem câu lệnh SQL nào chậm (dùng  pg_stat_statements ).
      • Kiểm tra thời gian giữ transaction trong Spring Boot (có bị giữ lock quá lâu không).
      • Chỉ tăng nhẹ DB Pool (ví dụ từ 10 lên 20) sau khi chắc chắn các truy vấn đã tối ưu để tránh lỗi nghẽn CPU do
      tranh chấp tiến trình (PostgreSQL sử dụng kiến trúc Process-per-connection nên quá nhiều kết nối sẽ làm sập
      CPU).
  2. Nếu nghẽn Kafka Consumer:
      • Kiểm tra lag. Nếu lag tăng, tăng số lượng Partition và tăng số lượng luồng tiêu thụ song song (concurrency)
      của  @KafkaListener .
  3. Nếu nghẽn Redis:
      • Tối ưu hóa Lua script hoặc cấu hình connection pool của Lettuce/Jedis.

  ──────
  ### GIAI ĐOẠN 6: VIẾT BÁO CÁO KẾT QUẢ VÀ PORTFOLIO SHOWCASE

  Đây sẽ là "vũ khí bí mật" trên CV của bạn. Chúng ta sẽ chèn vào tệp  README.md  ở gốc thư mục:

  • Bảng số liệu kết quả chạy Gatling qua các mốc.
  • Nhật ký tối ưu hóa (Optimization Log): Trình bày chi tiết từng Bottleneck phát hiện được và cách bạn đã xử lý nó
  để cải thiện TPS lên gấp bao nhiêu lần.
  ──────
  ### Bước đi tiếp theo của chúng ta:

  Nếu bạn đồng ý với kế hoạch này, chúng ta sẽ bắt đầu ngay Bước 1 của Giai đoạn 1:

  1. Viết Dockerfile cho backend app.
  2. Cấu hình thêm các Exporter (Nginx, Postgres, Redis, Kafka) vào docker-compose.yml để sẵn sàng cho việc giám sát
  chuyên sâu.