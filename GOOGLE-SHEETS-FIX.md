# 🔧 GOOGLE SHEETS INTEGRATION FIX

## 🎯 Vấn đề phát hiện
Phiên điểm danh mở nhưng không tra được dữ liệu từ Google Sheets.

## 🔍 Nguyên nhân
Cấu trúc cột trong code không khớp với thực tế:

### ❌ Code cũ (sai):
```
Cột 0: Họ tên
Cột 1: CCCD  
Cột 2: SĐT
```

### ✅ Thực tế trong Google Sheets:
```
Cột 0: STT
Cột 1: NGÀY ĐK
Cột 2: HỌ VÀ TÊN
Cột 3: NGÀY SINH
Cột 4: CCCD
Cột 5: SĐT
```

## 🛠️ Đã sửa

### 1. Cập nhật cấu trúc cột
```typescript
// Cấu trúc thực tế: 0=STT, 1=NGÀY ĐK, 2=HỌ VÀ TÊN, 3=NGÀY SINH, 4=CCCD, 5=SĐT, ...
const stt = row[0] || ''
const ngayDk = row[1] || ''
const hoTen = row[2] || ''
const ngaySinh = row[3] || ''
const cccd = row[4] || ''
const soDienThoai = row[5] || ''
```

### 2. Thêm debug logging
```typescript
console.log('findStudent called with:', { hoTen, cccd, soDienThoai, khoa })
console.log('Total students found:', students.length)
console.log('Found by name:', found)
console.log('Found by CCCD:', found)
console.log('Found by phone:', found)
console.log('Final result:', found)
```

### 3. Kiểm tra Google Sheets access
✅ CSV export endpoint hoạt động  
✅ Sheet K15 có dữ liệu  
❌ Sheet K16 trống (chưa có học viên)

## 📊 Dữ liệu test

### Học viên K15 mẫu:
```
Tên: NGUYỄN THỊ BÍCH HIẾU
CCCD: 060191000633
SĐT: 972240313
Khóa: K15
```

### API test thành công:
```bash
curl -X POST /api/attendance/verify \
  -d '{"cccd":"060191000633","hoTen":"NGUYỄN THỊ BÍCH HIẾU","soDienThoai":"972240313","khoa":"K15"}'

# Response:
{"success":true,"message":"Xác thực thông tin thành công","studentInfo":{"row":2,"hoTen":"NGUYỄN THỊ BÍCH HIẾU","cccd":"060191000633","soDienThoai":"972240313","khoa":"K15"}}
```

## 🚀 Deploy

### File:
- `hoclaixeaz-attendance-deploy-debug.tar.gz` (228KB)

### Lệnh deploy:
```bash
scp ../hoclaixeaz-attendance-deploy-debug.tar.gz root@phamthanh.net:/tmp/
ssh root@phamthanh.net "cd /var/www/ && mkdir -p hoclaixeaz-attendance && cd hoclaixeaz-attendance && tar -xzf /tmp/hoclaixeaz-attendance-deploy-debug.tar.gz && npm ci --production && npm run build && pm2 delete hoclaixeaz-attendance 2>/dev/null || true && pm2 start npm --name 'hoclaixeaz-attendance' -- start && pm2 save && echo '✅ Deploy thành công!'"
```

## 🧪 Test sau deploy

1. **Test Google Sheets access**:
   - Truy cập: https://lt.hoclaixeaz.vn
   - Điền thông tin học viên K15 mẫu

2. **Kiểm tra log server**:
   ```bash
   ssh root@phamthanh.net "pm2 logs hoclaixeaz-attendance --lines 20"
   ```

3. **Test các học viên khác**:
   - NGUYỄN VĂN BÌNH (CCCD: 060091005743, SĐT: 979472068)
   - ĐOÀN THỊ PHƯƠNG DUNG (CCCD: 060195016543, SĐT: 328208223)

## 📝 Lưu ý

1. **K16 không có dữ liệu** - Cần thêm học viên K16 vào Google Sheets
2. **Debug logging** - Có thể disable sau khi test xong
3. **Real-time sync** - Settings vẫn hoạt động bình thường
4. **Time validation** - Đã sửa hardcode giờ

---

**Status**: ✅ Google Sheets integration FIXED  
**Next**: Deploy và test với dữ liệu thật