# 🎯 HỆ THỐNG ĐIỂM DANH HỌC LÁI XE AZ

Hệ thống điểm danh thông minh cho trung tâm học lái xe AZ với tích hợp Google Sheets API và WebSocket real-time.

## ✨ Tính năng chính

### 🎯 Điểm danh thông minh
- **Điểm danh theo mã**: Học viên nhập mã 6 số để điểm danh
- **Real-time updates**: Hiển thị thông tin điểm danh real-time qua WebSocket
- **Tự động đồng bộ**: Đồng bộ dữ liệu với Google Sheets

### 📊 Quản lý Admin
- **Dashboard quản lý**: Xem thống kê, quản lý phiên điểm danh
- **Google Sheets Integration**: Đọc/ghi dữ liệu trực tiếp từ Google Sheets
- **Multi-khoa hỗ trợ**: Hỗ trợ nhiều khoa (K15, K16, v.v.)
- **Session management**: Tạo, quản lý phiên điểm danh với thời gian

### 🔔 Thông báo
- **Real-time notifications**: Thông báo khi học viên điểm danh
- **Countdown timer**: Đếm ngược thời gian còn lại của phiên
- **Status tracking**: Theo dõi trạng thái hoạt động

## 🛠 Công nghệ sử dụng

### Frontend
- **Next.js 15** với App Router
- **TypeScript** cho type safety
- **Tailwind CSS** cho styling
- **Shadcn/ui** cho UI components
- **Socket.io Client** cho real-time communication
- **Framer Motion** cho animations
- **Zustand** cho state management

### Backend
- **Next.js API Routes** cho backend
- **Socket.io** cho WebSocket server
- **Prisma ORM** với SQLite database
- **Google Sheets API** cho data integration
- **JWT Authentication** cho Google Sheets

### Database
- **SQLite** cho local development
- **Prisma** cho ORM
- **Schema design** cho students, sessions, attendance

## 📁 Cấu trúc dự án

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Trang chính (điểm danh)
│   ├── admin/             # Admin dashboard
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Shadcn/ui components
│   ├── AttendanceForm.tsx
│   ├── AdminDashboard.tsx
│   └── ...
├── lib/                   # Utilities và services
│   ├── db.ts             # Database client
│   ├── socket.ts         # Socket.io server
│   ├── google-sheets.ts  # Google Sheets API
│   └── utils.ts          # Helper functions
├── hooks/                 # Custom React hooks
├── stores/               # Zustand stores
└── types/                # TypeScript types
```

## 🚀 Cài đặt và chạy

### 1. Clone dự án
```bash
git clone https://github.com/ptadigi/diemdanhaz.git
cd diemdanhaz
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Setup database
```bash
npm run db:push
```

### 4. Cấu hình môi trường
Tạo file `.env.local` với các biến sau:
```env
# Google Sheets API
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY=your_private_key

# NextAuth
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

### 5. Setup Google Sheets API
1. Tạo Google Cloud Project
2. Enable Google Sheets API
3. Tạo Service Account
4. Download JSON key file
5. Share spreadsheet với service account email

### 6. Chạy dự án
```bash
npm run dev
```

Truy cập `http://localhost:3000` để xem ứng dụng.

## 📖 Hướng dẫn sử dụng

### Đối với học viên
1. Truy cập trang chủ
2. Nhập mã điểm danh 6 số
3. Nhấn "Điểm Danh"
4. Xea thông báo xác nhận

### Đối với admin
1. Truy cập `/admin`
2. Tạo phiên điểm danh mới
3. Cài đặt thời gian và khoa
4. Theo dõi điểm danh real-time
5. Xem thống kê và báo cáo

## 🔧 API Endpoints

### Public APIs
- `POST /api/attendance` - Điểm danh học viên
- `GET /api/session/[id]` - Lấy thông tin phiên

### Admin APIs
- `POST /api/admin/sessions` - Tạo phiên mới
- `GET /api/admin/sessions` - Lấy danh sách phiên
- `POST /api/admin/test-connection` - Test Google Sheets connection
- `POST /api/admin/sync` - Đồng bộ dữ liệu

### WebSocket Events
- `attendance_update` - Cập nhật điểm danh real-time
- `session_created` - Phiên mới được tạo
- `session_ended` - Phiến kết thúc

## 📊 Database Schema

### Student
```typescript
interface Student {
  id: string
  name: string
  khoa: string
  googleSheetRow: number?
  createdAt: Date
  updatedAt: Date
}
```

### Session
```typescript
interface Session {
  id: string
  name: string
  khoa: string
  startTime: Date
  endTime: Date
  attendanceCode: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Attendance
```typescript
interface Attendance {
  id: string
  studentId: string
  sessionId: string
  checkedAt: Date
  syncStatus: 'pending' | 'synced' | 'error'
  googleSheetRow: number?
  createdAt: Date
  updatedAt: Date
}
```

## 🔄 Luồng hoạt động

1. **Admin tạo phiên**: Tạo phiên điểm danh với mã và thời gian
2. **Đồng bộ học viên**: Tự động đọc danh sách từ Google Sheets
3. **Học viên điểm danh**: Nhập mã và xác nhận điểm danh
4. **Real-time updates**: Cập nhật trạng thái qua WebSocket
5. **Đồng bộ Google Sheets**: Ghi dữ liệu điểm danh vào spreadsheet

## 🐛 Troubleshooting

### Common Issues
1. **Google Sheets API Error**: Kiểm tra service account và permissions
2. **WebSocket Connection**: Đảm bảo server đang chạy
3. **Database Error**: Chạy `npm run db:push` để cập nhật schema

### Debug Mode
```bash
# Kiểm tra log
npm run dev

# Kiểm tra database
npx prisma studio

# Test Google Sheets connection
curl -X POST http://localhost:3000/api/admin/test-connection
```

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - xem file [LICENSE](LICENSE) để biết chi tiết.

## 📞 Liên hệ

- **Email**: support@hoclaixeaz.vn
- **Website**: https://hoclaixeaz.vn
- **GitHub**: https://github.com/ptadigi/diemdanhaz

---

⭐ Nếu dự án hữu ích, hãy cho chúng tôi một star!