# 🎯 Logic: Chỉ một phiên điểm danh hoạt động tại một thời điểm

## 📋 Tại sao cần logic này?

1. **Tránh nhầm lẫn**: Học viên không bị confuse giữa nhiều mã điểm danh
2. **Đảm bảo tính nhất quán**: Dữ liệu điểm danh không bị phân tán
3. **Quản lý dễ dàng**: Admin chỉ cần theo dõi một phiên tại một thời điểm
4. **Phòng chống lỗi**: Tránh trường hợp điểm danh vào phiên sai

## 🔧 Cơ chế hoạt động

### 1. Khi tạo phiên mới
```typescript
// Đóng tất cả các phiên đang hoạt động trước đó
await db.diemDanhSession.updateMany({
  where: { isActive: true },
  data: { isActive: false }
})

// Sau đó mới tạo phiên mới
const session = await db.diemDanhSession.create({
  data: { sessionCode, title, startTime, endTime, isActive: true }
})
```

### 2. Khi lấy danh sách phiên
```typescript
// Kiểm tra và đóng các phiên hoạt động cũ
const activeSessions = sessions.filter(s => s.isActive)
if (activeSessions.length > 1) {
  // Chỉ giữ phiên mới nhất
  const newestActive = activeSessions[0]
  const othersToDeactivate = activeSessions.slice(1)
  
  // Đóng các phiên cũ hơn
  await db.diemDanhSession.updateMany({
    where: { id: { in: othersToDeactivate.map(s => s.id) } },
    data: { isActive: false }
  })
}
```

### 3. Cleanup tự động
```typescript
// Đóng các phiên đã hết hạn
const expiredSessions = await db.diemDanhSession.updateMany({
  where: {
    isActive: true,
    endTime: { lt: now }
  },
  data: { isActive: false }
})
```

## 🎨 Giao diện người dùng

### 1. Nút tạo phiên
- **Disabled khi có phiên hoạt động**: `disabled={isCreating || sessions.some(isSessionActive)}`
- **Cảnh báo rõ ràng**: "⚠️ Chỉ có một phiên hoạt động tại một thời điểm"

### 2. Hiển thị phiên hoạt động
- **Tiêu đề**: "Phiên đang hoạt động (Duy nhất)"
- **Thông báo**: "✅ Đây là phiên hoạt động duy nhất tại thời điểm này"
- **Màu sắc đặc biệt**: Green theme để nhấn mạnh

### 3. Tự động cleanup
- Khi load trang: Gọi API cleanup để đóng phiên hết hạn
- Khi refresh: Tự động dọn dẹp các phiên không hợp lệ

## 🛡️ Các lớp bảo vệ

### 1. Tại API level
- **POST /api/admin/sessions**: Luôn đóng phiên cũ trước khi tạo mới
- **GET /api/admin/sessions**: Tự động đóng các phiên hoạt động trùng lặp
- **POST /api/admin/cleanup**: Dọn dẹp phiên hết hạn và trùng lặp

### 2. Tại Database level
- **Unique constraint**: Có thể thêm constraint nếu cần
- **Transaction**: Đảm bảo tính nguyên tử khi đóng/ tạo phiên

### 3. Tại Frontend level
- **Button state**: Disable nút tạo khi có phiên hoạt động
- **Visual feedback**: Hiển thị rõ ràng phiên đang hoạt động
- **Auto refresh**: Tự động cập nhật trạng thái

## 🔄 Quy trình hoạt động

### Scenario 1: Tạo phiên mới
1. User click "Tạo phiên mới"
2. API đóng tất cả phiên đang hoạt động
3. API tạo phiên mới với `isActive: true`
4. Frontend cập nhật UI, disable nút tạo
5. Hiển thị phiên hoạt động duy nhất

### Scenario 2: Phiên hết hạn
1. System tự động kiểm tra khi load trang
2. API cleanup đóng phiên đã hết hạn
3. Frontend enable lại nút tạo phiên
4. User có thể tạo phiên mới

### Scenario 3: Refresh trang
1. Component mount → gọi `fetchSessions()`
2. `fetchSessions()` gọi cleanup API trước
3. Cleanup đóng phiên hết hạn và trùng lặp
4. Sau đó mới lấy danh sách phiên sạch

## 📊 Kết quả

### ✅ Đảm bảo
- Chỉ có **một phiên** `isActive: true` tại bất kỳ thời điểm nào
- Không có phiên đã hết hạn vẫn còn hoạt động
- UI luôn hiển thị trạng thái chính xác

### ✅ User Experience
- Rõ ràng, không gây nhầm lẫn
- Nút tạo phiên được disable/enable hợp lý
- Thông báo trạng thái rõ ràng

### ✅ Data Integrity
- Dữ liệu điểm danh không bị phân tán
- Mỗi phiên điểm danh có ý nghĩa duy nhất
- Dễ dàng truy vấn và báo cáo

## 🚀 Testing

```bash
# Tạo phiên mới khi chưa có phiên hoạt động
curl -X POST http://localhost:3000/api/admin/sessions

# Tạo phiên mới khi đã có phiên hoạt động (sẽ đóng phiên cũ)
curl -X POST http://localhost:3000/api/admin/sessions

# Cleanup thủ công
curl -X POST http://localhost:3000/api/admin/cleanup

# Kiểm tra các phiên hoạt động
curl http://localhost:3000/api/admin/sessions | jq '.sessions | map(select(.isActive == true))'
```

Logic này đảm bảo hệ thống điểm danh luôn nhất quán và dễ quản lý!