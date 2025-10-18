# 🚗 Hệ Thống Điểm Danh - Học Lái Xe AZ

Hệ thống điểm danh trực tuyến hiện đại cho học viên Học Lái Xe AZ với giao diện responsive và tính năng thời gian thực.

## ✨ Features

### 🎯 Điểm Danh Thông Minh
- **Xác thực 2 bước:** Thông tin cá nhân + Mã 6 số
- **Thời gian thực:** Auto-update trạng thái điểm danh
- **Multi-tab sync:** Đồng bộ trên tất cả các trình duyệt mở
- **Validation:** Kiểm tra CCCD, SĐT, thông tin học viên

### ⚙️ Quản Trị Hệ Thống
- **Cài đặt thời gian:** Bắt đầu - Kết thúc khung giờ điểm danh
- **Real-time status:** Hiển thị trạng thái hoạt động
- **Broadcast updates:** Tự động cập nhật cho tất cả users
- **Local storage:** Cache settings cho offline capability

### 🎨 Giao Diện
- **Modern UI:** Tailwind CSS + Shadcn/ui components
- **Responsive:** Tối ưu cho mobile, tablet, desktop
- **Animations:** Framer Motion effects mượt mà
- **Color scheme:** Màu xanh đồng bộ, chuyên nghiệp

### 📊 Integration
- **Google Sheets:** Lưu dữ liệu điểm danh tự động
- **Webhook notifications:** Gửi thông báo đến external systems
- **SQLite database:** Prisma ORM với schema tối ưu

## 🛠 Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** SQLite client
- **UI:** Shadcn/ui, Lucide icons, Framer Motion
- **Notifications:** Sonner toast, Webhook integration

## 📁 Project Structure

```
diemdanhaz/
├── src/
│   ├── app/
│   │   ├── api/                 # API endpoints
│   │   │   ├── attendance/      # Điểm danh APIs
│   │   │   ├── settings/        # Cài đặt APIs
│   │   │   └── session/         # Session management
│   │   ├── page.tsx            # Trang điểm danh chính
│   │   └── setgio/             # Trang quản trị
│   ├── components/
│   │   ├── ui/                 # Shadcn/ui components
│   │   └── zai-attendance-form.tsx  # Main form component
│   ├── lib/
│   │   ├── db.ts               # Database client
│   │   └── google-sheets.ts    # Sheets integration
│   └── styles/                 # Global styles
├── public/
│   ├── logohoclaixeaz.png      # Logo header
│   └── icon-192.png           # Favicon
├── prisma/
│   └── schema.prisma          # Database schema
└── package.json               # Dependencies
```

## 🚀 Quick Start

### 1. Clone repository
```bash
git clone https://github.com/ptadigi/diemdanhaz.git
cd diemdanhaz
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup database
```bash
npm run db:push
```

### 4. Start development server
```bash
npm run dev
```

### 5. Open browser
Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Usage

### 🎓 Học viên (Điểm danh)
1. Truy cập trang chủ
2. Điền thông tin cá nhân (CCCD, Họ tên, SĐT, Khóa)
3. Nhập mã 6 số được giáo viên công bố
4. Hoàn tất điểm danh ✅

### 👨‍🏫 Giáo viên (Quản trị)
1. Truy cập `/setgio`
2. Cài đặt khung giờ điểm danh
3. Bật/tắt hệ thống
4. Theo dõi trạng thái real-time

## 🔧 Configuration

### Environment Variables
```env
# Google Sheets (optional)
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_RANGE=Sheet1!A:Z

# Webhook (optional)
WEBHOOK_URL=https://your-webhook-url.com
```

### Database Settings
- **File:** `./db/attendance.db`
- **Schema:** Xem `prisma/schema.prisma`
- **Reset:** `npm run db:push --force-reset`

## 🎨 Customization

### Màu sắc chủ đạo
- **Primary:** Blue 600 (`#2563eb`)
- **Secondary:** Cyan 600 (`#0891b2`)
- **Accent:** Teal 600 (`#0d9488`)

### Logo & Branding
- **Header:** `public/logohoclaixeaz.png`
- **Favicon:** `public/icon-192.png`
- **Dimensions:** Height 64px, width auto

## 📄 API Documentation

### `/api/attendance/verify`
- **Method:** POST
- **Body:** `{ cccd, hoTen, soDienThoai, khoa }`
- **Response:** Student information validation

### `/api/attendance/confirm`
- **Method:** POST
- **Body:** `{ studentInfo, code, formData }`
- **Response:** Attendance confirmation

### `/api/settings`
- **GET:** Retrieve current settings
- **POST:** Update system settings

## 🚀 Deployment

### Vercel (Recommended)
1. Connect repository to Vercel
2. Auto-deploy on push to main
3. Configure environment variables

### Docker
```bash
docker build -t diemdanhaz .
docker run -p 3000:3000 diemdanhaz
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📝 License

This project is proprietary to Học Lái Xe AZ.

## 🆘 Support

- **Email:** support@hoclaixeaz.com
- **Issues:** [GitHub Issues](https://github.com/ptadigi/diemdanhaz/issues)

---

🚗 **Học Lái Xe AZ - Hệ Thống Điểm Danh Thông Minh**