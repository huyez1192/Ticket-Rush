Ticket Rush – Đặt vé online, hệ thống có 2 vai trò chính là Customer và Admin, trọng tâm là chọn ghế, giữ chỗ, bán vé điện tử, xử lý tranh chấp dữ liệu khi nhiều người cùng đặt vé và mở rộng bằng Virtual Queue.

## 1. Bảng yêu cầu chức năng tổng quan

| Mã YC | Nhóm chức năng | Vai trò | Mô tả yêu cầu | Mức độ |
|---|---|---|---|---|
| FR-01 | Xác thực | Customer, Admin | Người dùng có thể đăng ký, đăng nhập, đăng xuất khỏi hệ thống. | Bắt buộc |
| FR-02 | Phân quyền | Customer, Admin | Hệ thống phân biệt quyền Customer và Admin. Customer chỉ mua/quản lý vé, Admin quản trị toàn bộ nền tảng. | Bắt buộc |
| FR-03 | Quản lý sự kiện | Admin | Admin tạo, cập nhật, xoá hoặc thay đổi trạng thái sự kiện. | Bắt buộc |
| FR-04 | Xem sự kiện | Customer | Customer có thể xem danh sách sự kiện đang mở bán hoặc sắp diễn ra. | Bắt buộc |
| FR-05 | Tìm kiếm sự kiện | Customer | Customer có thể tìm kiếm sự kiện theo tên, thời gian, địa điểm hoặc trạng thái. | Bắt buộc |
| FR-06 | Chi tiết sự kiện | Customer | Customer xem thông tin chi tiết sự kiện: tên, mô tả, thời gian, địa điểm, sơ đồ ghế, giá vé. | Bắt buộc |
| FR-07 | Cấu hình sơ đồ ghế | Admin | Admin khai báo ma trận ghế cho từng khu vực, ví dụ: khu A có 10 hàng, mỗi hàng 15 ghế. | Bắt buộc |
| FR-08 | Cấu hình loại ghế và giá | Admin | Admin chia khu vực ghế và gán giá cho từng loại/khu vực ghế, ví dụ VIP, Standard, Economy. | Bắt buộc |
| FR-09 | Hiển thị sơ đồ ghế | Customer | Customer xem sơ đồ ghế trực quan, mỗi ghế có trạng thái và màu sắc riêng. | Bắt buộc |
| FR-10 | Chọn ghế | Customer | Customer click vào ghế còn trống để chọn ghế muốn mua. | Bắt buộc |
| FR-11 | Giữ ghế tạm thời | Customer | Khi Customer chọn ghế thành công, ghế chuyển sang trạng thái Locked trong thời gian giới hạn. | Bắt buộc |
| FR-12 | Đồng bộ trạng thái ghế | System | Trạng thái ghế được cập nhật tự động trên giao diện mà không cần F5, dùng Polling hoặc WebSocket. | Bắt buộc |
| FR-13 | Chống đặt trùng ghế | System | Nếu nhiều người cùng chọn một ghế, hệ thống chỉ cho một người giữ ghế thành công bằng Transaction/Row Locking. | Bắt buộc |
| FR-14 | Thanh toán giả lập | Customer | Customer xem đơn hàng và bấm “XÁC NHẬN” để coi như thanh toán thành công. | Bắt buộc |
| FR-15 | Phát hành vé điện tử | System | Sau khi thanh toán thành công, hệ thống tạo vé điện tử kèm QR Code. | Bắt buộc |
| FR-16 | Quản lý vé cá nhân | Customer | Customer xem danh sách vé đã mua và chi tiết vé điện tử. | Bắt buộc |
| FR-17 | Tự động nhả ghế | System | Ghế bị giữ quá 10 phút mà chưa thanh toán sẽ tự động được nhả về trạng thái có thể bán. | Bắt buộc |
| FR-18 | Dashboard doanh thu | Admin | Admin theo dõi doanh thu theo thời gian thực. | Bắt buộc |
| FR-19 | Dashboard lấp đầy ghế | Admin | Admin theo dõi số ghế đã bán, đang giữ, còn trống theo thời gian thực. | Bắt buộc |
| FR-20 | Thống kê khách hàng | Admin | Admin xem thống kê khách hàng theo độ tuổi, giới tính để phân tích thị hiếu. | Bắt buộc |
| FR-21 | Virtual Queue | Customer, System | Khi lượng truy cập quá lớn, hệ thống đưa người dùng vào phòng chờ và cấp quyền vào theo từng nhóm. | Nâng cao |

## 2. Bảng yêu cầu chức năng chi tiết cho Customer

| Mã YC | Chức năng | Mô tả chi tiết | Dữ liệu đầu vào | Kết quả đầu ra | Ghi chú xử lý |
|---|---|---|---|---|---|
| CUS-01 | Đăng ký tài khoản | Khách hàng tạo tài khoản để mua vé và quản lý vé. | Họ tên, email, mật khẩu, ngày sinh, giới tính | Tài khoản mới được tạo | Email nên là duy nhất. Mật khẩu cần được mã hóa. |
| CUS-02 | Đăng nhập | Khách hàng đăng nhập để đặt vé. | Email, mật khẩu | Access token/session đăng nhập | Nếu sai thông tin thì báo lỗi. |
| CUS-03 | Xem danh sách sự kiện | Hiển thị các sự kiện đang bán vé hoặc sắp mở bán. | Bộ lọc tùy chọn | Danh sách sự kiện | Có thể phân trang hoặc tải thêm. |
| CUS-04 | Tìm kiếm sự kiện | Tìm kiếm sự kiện theo từ khóa. | Tên sự kiện, địa điểm, thời gian | Danh sách sự kiện phù hợp | Nên hỗ trợ tìm kiếm gần đúng. |
| CUS-05 | Lọc sự kiện | Lọc theo trạng thái, thời gian, thể loại hoặc địa điểm. | Bộ lọc | Danh sách đã lọc | Giúp giao diện dễ dùng hơn. |
| CUS-06 | Xem chi tiết sự kiện | Xem đầy đủ thông tin sự kiện. | ID sự kiện | Thông tin sự kiện, giá vé, sơ đồ ghế | Chỉ xem được sự kiện hợp lệ hoặc đã công khai. |
| CUS-07 | Xem sơ đồ ghế | Hiển thị ghế theo khu vực, hàng, số ghế và trạng thái. | ID sự kiện | Ma trận ghế trực quan | Ghế có màu theo trạng thái: Available, Locked, Sold. |
| CUS-08 | Chọn ghế | Customer click chọn một hoặc nhiều ghế còn trống. | Seat ID | Ghế được chọn tạm trên UI | Chưa chắc giữ chỗ thành công cho đến khi gọi API lock seat. |
| CUS-09 | Giữ ghế | Hệ thống khóa ghế cho Customer trong 10 phút. | Event ID, Seat ID, User ID | Ghế chuyển sang Locked | Phải xử lý bằng transaction/row lock để tránh race condition. |
| CUS-10 | Xem thời gian giữ chỗ | Hiển thị countdown còn bao lâu để thanh toán. | Locked seat/order | Đồng hồ đếm ngược | Hết giờ thì ghế bị nhả. |
| CUS-11 | Xem đơn hàng checkout | Hiển thị thông tin vé trước khi xác nhận. | Danh sách ghế đã giữ | Tổng tiền, chi tiết ghế, sự kiện | Không cần tích hợp cổng thanh toán thật. |
| CUS-12 | Xác nhận thanh toán | Customer bấm “XÁC NHẬN” để hoàn tất mua vé. | Order ID | Vé chuyển sang Sold | Chỉ được xác nhận khi ghế vẫn còn Locked bởi đúng user. |
| CUS-13 | Nhận vé điện tử | Sau khi thanh toán thành công, hệ thống sinh vé điện tử. | Order đã thanh toán | Ticket + QR Code | QR Code dùng để check-in giả lập hoặc hiển thị vé. |
| CUS-14 | Xem vé của tôi | Customer xem danh sách vé đã mua. | User ID | Danh sách vé | Có thể lọc theo sự kiện sắp diễn ra/đã qua. |
| CUS-15 | Xem chi tiết vé | Customer xem chi tiết một vé. | Ticket ID | QR Code, mã vé, ghế, sự kiện | Chỉ chủ vé mới được xem. |
| CUS-16 | Hủy chọn ghế trước thanh toán | Customer bỏ ghế đã chọn hoặc quay lại chọn ghế khác. | Seat ID hoặc Order ID | Ghế được release | Chỉ áp dụng khi vé chưa Sold. |
| CUS-17 | Vào phòng chờ | Khi hệ thống quá tải, Customer được đưa vào Waiting Room. | Phiên truy cập | Vị trí trong hàng chờ | Thuộc phần nâng cao Virtual Queue. |
| CUS-18 | Nhận quyền vào đặt vé | Hệ thống cấp token đặt vé cho từng nhóm người trong hàng chờ. | Queue token | Được vào màn chọn ghế | Ví dụ cấp 50 người/lượt. |

## 3. Bảng yêu cầu chức năng chi tiết cho Admin

| Mã YC | Chức năng | Mô tả chi tiết | Dữ liệu đầu vào | Kết quả đầu ra | Ghi chú xử lý |
|---|---|---|---|---|---|
| ADM-01 | Đăng nhập Admin | Admin đăng nhập vào hệ thống quản trị. | Email, mật khẩu | Phiên đăng nhập Admin | Cần phân quyền nghiêm ngặt. |
| ADM-02 | Tạo sự kiện | Admin tạo sự kiện mới. | Tên, mô tả, thời gian, địa điểm, ảnh, trạng thái | Sự kiện mới | Ban đầu có thể là Draft. |
| ADM-03 | Cập nhật sự kiện | Admin chỉnh sửa thông tin sự kiện. | Event ID + dữ liệu mới | Sự kiện được cập nhật | Không nên sửa tùy tiện nếu đã bán vé. |
| ADM-04 | Xóa sự kiện | Admin xóa hoặc vô hiệu hóa sự kiện. | Event ID | Sự kiện bị xóa/ẩn | Nên dùng soft delete nếu đã phát sinh vé. |
| ADM-05 | Đổi trạng thái sự kiện | Admin chuyển trạng thái: Draft, Published, Selling, Closed, Cancelled. | Event ID, trạng thái mới | Trạng thái được cập nhật | Trạng thái ảnh hưởng đến việc Customer có mua được vé không. |
| ADM-06 | Tạo khu vực ghế | Admin tạo các khu vực như A, B, VIP, Standard. | Tên khu, mô tả | Seat zone mới | Mỗi khu có thể có giá riêng. |
| ADM-07 | Khai báo ma trận ghế | Admin nhập số hàng và số ghế mỗi hàng. | Zone ID, số hàng, số ghế/hàng | Danh sách ghế được sinh tự động | Ví dụ A: 10 hàng × 15 ghế. |
| ADM-08 | Gán giá ghế | Admin gán giá tiền cho từng khu vực hoặc loại ghế. | Zone ID/Seat type, giá | Bảng giá vé | Giá cần > 0. |
| ADM-09 | Cập nhật sơ đồ ghế | Admin chỉnh sửa số ghế, loại ghế, khu vực. | Seat map config | Sơ đồ ghế mới | Cần hạn chế sửa ghế đã Sold. |
| ADM-10 | Theo dõi doanh thu realtime | Dashboard hiển thị doanh thu cập nhật liên tục. | Event ID, khoảng thời gian | Tổng doanh thu, doanh thu theo thời gian | Có thể dùng WebSocket hoặc polling. |
| ADM-11 | Theo dõi tình trạng ghế | Dashboard hiển thị số ghế Available, Locked, Sold, Released. | Event ID | Tỷ lệ lấp đầy ghế | Quan trọng cho flash sale. |
| ADM-12 | Thống kê khách hàng theo tuổi | Admin xem phân bố khách hàng theo nhóm tuổi. | Event ID | Biểu đồ/thống kê độ tuổi | Dựa trên ngày sinh của Customer. |
| ADM-13 | Thống kê khách hàng theo giới tính | Admin xem phân bố khách hàng theo giới tính. | Event ID | Biểu đồ/thống kê giới tính | Dựa trên thông tin hồ sơ người dùng. |
| ADM-14 | Xem danh sách đơn hàng | Admin xem các đơn đặt vé. | Bộ lọc: sự kiện, trạng thái, thời gian | Danh sách order | Hữu ích để kiểm tra giao dịch. |
| ADM-15 | Xem danh sách vé đã bán | Admin xem vé theo sự kiện, khu vực, trạng thái. | Event ID, trạng thái vé | Danh sách ticket | Hỗ trợ quản trị và đối soát. |
| ADM-16 | Quản lý hàng chờ ảo | Admin xem số người đang chờ, số người được cấp quyền vào mua vé. | Event ID | Queue dashboard | Phần nâng cao. |
| ADM-17 | Cấu hình tốc độ cấp quyền | Admin cấu hình số người được vào màn chọn ghế mỗi lượt. | Số lượng user/lượt | Queue rule | Ví dụ 50 người/lượt như đề bài. |

## 4. Bảng yêu cầu chức năng xử lý trạng thái ghế/vé

| Mã YC | Trạng thái | Ý nghĩa | Ai/Cái gì kích hoạt | Trạng thái tiếp theo |
|---|---|---|---|---|
| LIFE-01 | Available | Ghế còn trống, có thể chọn. | Ghế mới tạo hoặc được nhả | Locked |
| LIFE-02 | Locked | Ghế đang được giữ tạm cho một Customer. | Customer click giữ ghế thành công | Sold hoặc Released |
| LIFE-03 | Sold | Ghế đã được thanh toán thành công. | Customer xác nhận checkout | Không quay lại Available |
| LIFE-04 | Released | Ghế bị nhả do hết 10 phút hoặc Customer hủy chọn. | Background Worker/Cronjob hoặc Customer hủy | Available |

## 5. Bảng yêu cầu chức năng hệ thống nền

| Mã YC | Chức năng hệ thống | Mô tả chi tiết | Mức độ |
|---|---|---|---|
| SYS-01 | Transaction khi giữ ghế | Khi Customer giữ ghế, backend phải mở transaction và lock dòng ghế tương ứng để tránh 2 người cùng giữ một ghế. | Bắt buộc |
| SYS-02 | Kiểm tra quyền sở hữu ghế locked | Chỉ user đã lock ghế mới được thanh toán ghế đó. | Bắt buộc |
| SYS-03 | Tự động release ghế hết hạn | Background Worker/Cronjob quét các ghế Locked quá 10 phút và chuyển về Available/Released. | Bắt buộc |
| SYS-04 | Realtime seat update | Khi ghế đổi trạng thái, frontend cập nhật tự động bằng Polling hoặc WebSocket. | Bắt buộc |
| SYS-05 | Đồng bộ dashboard Admin | Doanh thu và tình trạng ghế được cập nhật gần thời gian thực. | Bắt buộc |
| SYS-06 | Sinh mã vé | Sau khi thanh toán, hệ thống sinh mã vé duy nhất. | Bắt buộc |
| SYS-07 | Sinh QR Code | QR Code chứa mã vé hoặc URL kiểm tra vé. | Bắt buộc |
| SYS-08 | Virtual Queue token | User trong hàng chờ được cấp token/quyền vào chọn ghế theo lượt. | Nâng cao |
| SYS-09 | Giới hạn truy cập chọn ghế | Chỉ user có queue token hợp lệ mới được vào màn chọn ghế khi flash sale quá tải. | Nâng cao |
| SYS-10 | Kiểm tra dữ liệu đầu vào | Validate email, mật khẩu, giá vé, số hàng, số ghế, thời gian sự kiện, trạng thái sự kiện. | Bắt buộc |
