# Google Sheets API Setup Guide

## Tổng quan

Hệ thống đã được cập nhật để hỗ trợ ghi trực tiếp vào Google Sheets sử dụng Google Sheets API thay vì chỉ phụ thuộc vào n8n webhook.

## Các thay đổi chính

### 1. Mở rộng GoogleSheetsService

- Thêm method `initializeSheets()` để khởi tạo Google Sheets API client
- Thêm method `markAttendanceDirect()` để ghi trực tiếp vào Google Sheets
- Thêm method `markAttendanceDirectAuto()` để tự động tìm cột và ghi
- Thêm method `testConnection()` để kiểm tra kết nối
- Thêm method `columnNumberToLetter()` để chuyển đổi số cột thành chữ cái

### 2. Cập nhật API

- `/api/attendance` đã được cập nhật để sử dụng `markAttendanceDirectAuto()`
- `/api/test-sheets` đã được mở rộng để hỗ trợ test ghi trực tiếp
- `/api/admin/stats` đã được cập nhật để sử dụng GoogleSheetsService

### 3. Trang Admin mới

- `/admin/dashboard` - Dashboard quản trị với thống kê real-time
- `/admin/test-sheets` - Trang test Google Sheets API

## Cấu hình Service Account

### 1. Tạo Service Account

1. Đi đến [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. Đi đến **IAM & Admin** → **Service Accounts**
4. Click **Create Service Account**
5. Điền thông tin:
   - Name: `Google Sheets API Service`
   - Description: `Service account for Google Sheets API access`
6. Click **Create and Continue**
7. Thêm role: **Google Sheets** → **Google Sheets User**
8. Click **Done**

### 2. Tạo JSON Key

1. Trong danh sách Service Accounts, click vào service account vừa tạo
2. Đi đến tab **KEYS**
3. Click **Add Key** → **Create new key**
4. Chọn **JSON**
5. Click **Create** - file JSON sẽ được tải về

### 3. Cấp quyền truy cập Google Sheets

1. Mở file JSON vừa tải về, copy email (client_email)
2. Mở Google Sheet của bạn
3. Click **Share** → **Share with people and groups**
4. Dán email của service account vào
5. Cấp quyền **Editor**

### 4. Cấu hình Environment Variables

Mở file `.env` và cập nhật các biến sau:

```env
# Google Sheets API Configuration
GOOGLE_SPREADSHEET_ID=1AKhYZrbgo7tq5ZrexHBeXJO_8hry8tWa1hJWWlu40JM
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
WEBHOOK_URL=https://n8n.phamthanh.net/webhook/diemdanh
```

**Lưu ý:**
- `GOOGLE_SPREADSHEET_ID`: ID của Google Sheet (lấy từ URL)
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Email từ file JSON
- `GOOGLE_PRIVATE_KEY`: Private key từ file JSON, thay thế `\n` thực tế bằng `\\n`

## Sử dụng

### 1. Test kết nối

1. Đăng nhập vào admin panel: `/admin`
2. Username: `hoclaixeaz`
3. Password: `Hoclaixeaz@2025!@#`
4. Đi đến **Test Google Sheets API**
5. Click **Test Kết nối Google Sheets API**

### 2. Test ghi dữ liệu

1. Sau khi kết nối thành công, chọn học viên và khóa
2. Click **Test Ghi tự động** để test ghi điểm danh
3. Kiểm tra kết quả trong Google Sheets

### 3. Sử dụng trong production

Hệ thống sẽ tự động sử dụng Google Sheets API khi học viên điểm danh:
- Tìm thông tin học viên
- Tìm cột ngày hôm nay
- Ghi trực tiếp giá trị TRUE vào ô tương ứng
- Xác nhận lại giá trị đã ghi

## Troubleshooting

### 1. Lỗi "Missing Google Service Account credentials"

**Nguyên nhân:** Chưa cấu hình environment variables
**Giải pháp:** Kiểm tra lại file `.env` và đảm bảo các biến được điền đúng

### 2. Lỗi "The caller does not have permission"

**Nguyên nhân:** Service account không có quyền truy cập Google Sheets
**Giải pháp:** 
- Kiểm tra lại email của service account
- Đảm bảo đã share Google Sheets với email đó và cấp quyền Editor

### 3. Lỗi "Invalid JSON private key"

**Nguyên nhân:** Private key format không đúng
**Giải pháp:**
- Copy chính xác private key từ file JSON
- Thay thế tất cả `\n` bằng `\\n` trong environment variable
- Đảm bảo private key được bao phủ trong dấu ngoặc kép

### 4. Lỗi "Spreadsheet not found"

**Nguyên nhân:** Spreadsheet ID không đúng
**Giải pháp:**
- Kiểm tra lại ID từ URL Google Sheets
- Đảm bảo Google Sheet đã được share với service account

## Lợi ích

1. **Độ tin cậy cao:** Ghi trực tiếp vào Google Sheets không phụ thuộc vào webhook
2. **Real-time:** Dữ liệu được cập nhật ngay lập tức
3. **Verification:** Hệ thống tự động xác nhận lại giá trị đã ghi
4. **Fallback:** Vẫn giữ webhook n8n như backup
5. **Easy testing:** Có trang test riêng để kiểm tra kết nối

## Backup và Fallback

Hệ thống vẫn giữ webhook n8n để:
- Gửi thông báo
- Lưu log
- Dùng làm backup nếu Google Sheets API gặp vấn đề

## Monitoring

Sử dụng trang `/admin/test-sheets` để:
- Kiểm tra kết nối API
- Test đọc/ghi dữ liệu
- Xem log các thao tác
- Debug lỗi nếu có