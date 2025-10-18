# 📊 Báo cáo thống kê theo khóa học

## 🎯 Tính năng mới

Đã thêm tính năng báo cáo thống kê chi tiết theo khóa học vào trang quản lý, giúp admin dễ dàng theo dõi tình hình điểm danh của từng lớp.

## ✨ Tính năng chính

### 1. Tổng quan thống kê
- **Tổng số học viên**: Hiển thị tổng số học viên trong hệ thống
- **Đã điểm danh**: Số học viên đã hoàn thành điểm danh
- **Vắng mặt**: Số học viên chưa điểm danh
- **Số khóa**: Tổng số các khóa học đang hoạt động
- **Ngày**: Hiển thị ngày của báo cáo

### 2. Chi tiết theo khóa
- **Phân loại theo khóa**: Mỗi khóa học được hiển thị riêng biệt
- **Tỷ lệ điểm danh**: Hiển thị phần trăm học viên có mặt
- **Màu sắc phân biệt**:
  - 🟢 Xanh lá: Tỷ lệ ≥ 90%
  - 🟡 Vàng: Tỷ lệ 70-89%
  - 🔴 Đỏ: Tỷ lệ < 70%

### 3. Chi tiết học viên
- **Mở rộng/thu gọn**: Click vào từng khóa để xem chi tiết
- **Thông tin học viên**:
  - Tên học viên
  - Thời gian điểm danh (nếu có)
  - Trạng thái (Có mặt/Vắng mặt)
- **Phân loại màu sắc**:
  - Nền xanh: Học viên có mặt
  - Nền đỏ: Học viên vắng mặt

## 🛠️ Kỹ thuật

### API Endpoint
```
GET /api/admin/stats?sessionId={id}&date={date}
```

### Component
- `ClassStatsReport.tsx`: Component hiển thị báo cáo thống kê
- `stats/route.ts`: API xử lý thống kê dữ liệu

### Nguồn dữ liệu
- **Chỉ sử dụng dữ liệu thật**: Google Sheets qua ZAI SDK
- **Không có mock data**: Hệ thống sẽ báo lỗi nếu không thể kết nối
- **Xử lý lỗi**: Hiển thị thông báo rõ ràng khi không có dữ liệu

## 📍 Vị trí

Tính năng được tích hợp vào trang quản lý `/setgio` với bố cục:

1. **Trạng thái hiện tại**: Thời gian và trạng thái hệ thống
2. **Cài đặt khung giờ**: Thiết lập thời gian điểm danh
3. **Quản lý phiên**: Tạo và quản lý phiên điểm danh
4. **📊 Báo cáo thống kê**: (Mới) Thống kê theo khóa học

## 🎨 Giao diện

- **Thiết kế responsive**: Tương thích mọi kích thước màn hình
- **Animation**: Mượt mà với Framer Motion
- **Màu sắc**: Sử dụng Tailwind CSS với blue/green theme
- **Icons**: Lucide React icons
- **Cards**: shadcn/ui components

## 🔄 Real-time

- **Auto refresh**: Nút làm mới dữ liệu
- **Timestamp**: Hiển thị thời gian cập nhật cuối cùng
- **Loading states**: Spinner khi tải dữ liệu

## 📱 Mobile-friendly

- **Responsive grid**: Tự động điều chỉnh số cột
- **Touch-friendly**: Kích thước button phù hợp
- **Scrollable**: Kéo xem danh sách học viên dài

## 🔒 Security

- **Admin only**: Chỉ admin mới có thể truy cập
- **AuthGuard**: Bảo vệ route
- **TypeScript**: Type safety cho toàn bộ component

## 📈 Tương lai

Có thể mở rộng thêm:
- Export ra Excel/PDF
- Filter theo khoảng thời gian
- So sánh giữa các kỳ
- Email báo cáo tự động