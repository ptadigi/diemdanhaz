# Hướng dẫn Upload Source Code lên GitHub

## 🔧 Cấu hình GitHub Authentication

### Method 1: Sử dụng Personal Access Token (PAT)

1. **Tạo Personal Access Token:**
   - Đăng nhập GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token"
   - Chọn scopes: `repo`, `workflow`
   - Copy token

2. **Push code:**
   ```bash
   cd /home/z/my-project
   git remote set-url origin https://ptadigi:<YOUR_TOKEN>@github.com/ptadigi/diemdanhaz.git
   git push -u origin main
   ```

### Method 2: Sử dụng GitHub CLI

1. **Cài đặt GitHub CLI:**
   ```bash
   curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
   sudo apt update
   sudo apt install gh
   ```

2. **Login và push:**
   ```bash
   gh auth login
   git push -u origin main
   ```

## 📁 Source Code Đã Chuẩn Bị

### ✅ Đã hoàn thành:
- [x] Hệ thống điểm danh với màu xanh đồng bộ
- [x] Logo AZ header và favicon
- [x] Trang quản trị hệ thống
- [x] API endpoints đầy đủ
- [x] Database schema
- [x] Responsive design
- [x] Animations và effects

### 📁 Cấu trúc thư mục:
```
diemdanhaz/
├── src/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── page.tsx      # Trang điểm danh
│   │   └── setgio/       # Trang quản trị
│   ├── components/       # UI components
│   ├── lib/             # Utilities và database
│   └── styles/          # Global styles
├── public/              # Static assets (logo, favicon)
├── prisma/              # Database schema
└── package.json         # Dependencies
```

### 🚀 Features:
- **Điểm danh thông minh:** Xác thực thông tin + mã 6 số
- **Quản trị thời gian thực:** Cài đặt khung giờ điểm danh
- **Responsive:** Hoạt động trên mọi thiết bị
- **Real-time updates:** BroadcastChannel cho multi-tab
- **Google Sheets integration:** Lưu dữ liệu học viên
- **Modern UI:** Tailwind CSS + Framer Motion

## 🎯 Kết quả

Repository sẽ có sẵn:
- Frontend Next.js 15 với App Router
- Backend API routes
- Database SQLite với Prisma
- UI components với Shadcn/ui
- Deploy-ready configuration

**URL:** https://github.com/ptadigi/diemdanhaz