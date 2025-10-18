# 📋 Google Sheets Setup Guide

## 🔍 Vấn đề hiện tại
```
Error: Method doesn't allow unregistered callers (callers without established identity). 
Please use API Key or other form of API consumer identity to call this API.
```

## 🛠️ Các bước cần làm

### 1. Enable Google Sheets API
1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. Đi đến **APIs & Services** → **Library**
4. Search "Google Sheets API"
5. Click **Enable**

### 2. Kiểm tra Service Account Permissions
1. Đi đến **APIs & Services** → **Credentials**
2. Tìm Service Account: `840100177409-compute@developer.gserviceaccount.com`
3. Click vào service account → **Permissions**
4. Đảm bảo có role:
   - **Project** → **Editor** hoặc
   - **Project** → **Viewer**

### 3. Share Spreadsheet với Service Account
1. Mở spreadsheet: https://docs.google.com/spreadsheets/d/1AKhYZrbgo7tq5ZrexHBeXJO_8hry8tWa1hJWWlu40JM
2. Click **Share** (góc trên phải)
3. Add email: `840100177409-compute@developer.gserviceaccount.com`
4. Cấp quyền: **Viewer** hoặc **Editor**
5. Click **Send**

### 4. Verify Setup
Sau khi hoàn thành các bước trên, chạy lại test:

```bash
# Test trực tiếp
node test-google-sheets.js

# Test qua API
curl -X GET http://localhost:3000/api/debug/google-sheets
```

## 🔧 Troubleshooting

### Nếu vẫn lỗi 403:
1. **Kiểm tra API enabled**:
   ```bash
   curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
        "https://www.googleapis.com/drive/v3/files/1AKhYZrbgo7tq5ZrexHBeXJO_8hry8tWa1hJWWlu40JM"
   ```

2. **Kiểm tra service account key**:
   - Download lại JSON key file
   - Update environment variables

3. **Enable additional APIs**:
   - Google Drive API
   - Google Sheets API

### Nếu lỗi 404:
- Spreadsheet ID không đúng
- Service account không được share

### Nếu lỗi timeout:
- Check network connection
- Firewall settings

## 📞 Khi setup thành công

Bạn sẽ thấy:
```
✅ SUCCESS! Spreadsheet title: [Tên spreadsheet]
📋 Available sheets: [{title: "K15", sheetId: 123}, ...]
🎓 Khoa sheets found: 3
```

Và trang báo cáo sẽ hiển thị:
```
✅ Đã kết nối Google Sheets - Đang sử dụng dữ liệu thật từ 3 khóa học
```

## 🚀 Next Steps

Sau khi Google Sheets hoạt động:
1. Hệ thống sẽ tự động đọc danh sách khóa học thật
2. Data sẽ được sync 2-way giữa Database và Google Sheets
3. Reports sẽ hiển thị statistics từ real data

---

📝 **Note**: Environment variables hiện tại:
- Spreadsheet ID: `1AKhYZrbgo7tq5ZrexHBeXJO_8hry8tWa1hJWWlu40JM`
- Service Account: `840100177409-compute@developer.gserviceaccount.com`