# 📋 YÊU CẦU THÔNG TIN TỪ DỰ ÁN CŨ (Old XemGiaDat Project)

## 🎯 Mục đích
Tôi đang phát triển phiên bản 2 của ứng dụng XemGiaDat với kiến trúc mới (PMTiles + React). Tôi cần tham khảo logic xử lý và kiến trúc của dự án cũ để cải thiện độ chính xác.

---

## 📂 CÁC FILE QUAN TRỌNG CẦN XEM

### 1. **File Xử Lý Click và Selection**
Các file xử lý khi user click vào bản đồ để chọn thửa đất:
- File xác định mã xã từ tọa độ click
- File query/load data từ 56 files GeoJSON theo mã xã
- Logic vẽ polygon lên map sau khi click

**Câu hỏi cụ thể:**
- Làm thế nào để xác định mã xã từ click point?
- Cấu trúc của 56 files GeoJSON (tên file, format, properties)?
- Logic để vẽ đúng toàn bộ geometry của thửa đất (tránh vẽ thiếu)?

### 2. **File Quản Lý Dimension Labels**
Các file vẽ kích thước lên các cạnh polygon:
- Logic tính toán distance giữa các điểm
- Logic group các cạnh ngắn
- Logic update position khi zoom/pan

**Câu hỏi cụ thể:**
- Có event listener nào để update dimensions khi map move?
- Có throttle/debounce không?
- Min/max zoom level hiển thị dimensions?

### 3. **File Cấu Hình Map Styles**
- Cấu hình layers (order, paint properties)
- Logic thay đổi line-width theo zoom level
- Cấu hình highlight style

**Câu hỏi cụ thể:**
- Line width ở mỗi zoom level là bao nhiêu?
- Màu sắc và opacity của highlight layer?
- Có dùng filter expressions phức tạp không?

### 4. **File Data Schema**
- Property names trong GeoJSON files
- Mapping giữa property names và UI labels
- Data validation/normalization logic

**Câu hỏi cụ thể:**
- Properties chính xác trong GeoJSON: SoThuTuThua, SoHieuToBanDo, etc?
- Có properties nào khác quan trọng không?
- Logic convert data types (string/number)?

---

## 🔍 THÔNG TIN BỔ SUNG CẦN

### A. Kiến trúc tổng quan
- Cấu trúc thư mục dự án cũ
- Tech stack chính (framework, libraries)
- Entry point file (index.html, main.js?)

### B. Data Loading Strategy
- Lazy load hay load all upfront?
- Caching strategy
- Error handling khi file missing

### C. Performance Optimizations
- Có dùng Web Workers không?
- Có throttle rendering không?
- Max số features hiển thị cùng lúc?

---

## 📊 OUTPUT MONG MUỐN

Hãy trả về:
1. **List các files** cần xem (với path đầy đủ)
2. **Code snippets** quan trọng nhất (functions xử lý click, vẽ dimensions, load data)
3. **Config objects** (map style, layer definitions)
4. **Workflow diagram** (nếu có): Click → Detect Xa → Load GeoJSON → Draw → Highlight

---

## ⚡ VẤN ĐỀ HIỆN TẠI CẦN GIẢI QUYẾT

Trong dự án mới (v2), tôi đang gặp:
1. ✅ **Dimensions đã zoom theo** - FIXED
2. ✅ **Highlight hoạt động** - FIXED
3. ✅ **Data display** - FIXED
4. ✅ **Cache & Performance** - FIXED

---

## 🎯 TÍNH NĂNG MỚI CẦN TÍCH HỢP (ƯU TIÊN CAO)

### 1. **Firebase Authentication** 🔐
Cần tích hợp đăng nhập Firebase từ dự án cũ:
- Email/Password authentication
- Social login (Google, Facebook, Github)
- User profile management
- Session persistence
- Role-based access control

**Câu hỏi cụ thể:**
- Cấu trúc Firebase project (Firestore vs Realtime Database)?
- User schema & collection structure?
- Authentication flow (login, register, logout)?
- Token management & refresh strategy?

### 2. **Share Feature with Location** 📍
Tính năng chia sẻ link chứa tọa độ (ưu tiên cao):
- Copy link với coordinates (lat, lng, zoom)
- Share qua Zalo, Facebook, Messenger, Others
- Deep linking support (click link → zoom to parcel + display info)
- URL parameters parsing & validation

**Câu hỏi cụ thể:**
- URL format hiện tại? (ví dụ: `?lat=16.05&lng=108.20&zoom=18&parcel=57/23`)
- Parcel identifier trong URL (số tờ/thửa hay OBJECTID)?
- Shortlink service dùng? (bit.ly, tinyurl, custom?)
- Social sharing text template?
- Tracking metrics (click count, share count)?

### 3. **Persistent Sharing** 💾
Lưu lại history chia sẻ & tracking:
- Save shared links in Firestore
- Track who shared, when, where
- Analytics: most shared parcels
- User's sharing history

---

## 🚀 ĐỀ XUẤT THỰC HIỆN

Hãy gửi báo cáo chi tiết về:

### A. Firebase Integration
- [ ] Firebase project config & credentials
- [ ] Authentication implementation (public/js/modules/firebase-auth.js)
- [ ] User collection schema in Firestore
- [ ] Real-time database structure (nếu có)
- [ ] Security rules & permissions

### B. Share Feature
- [ ] Share module code (public/js/modules/share-module.js hoặc tương tự)
- [ ] URL builder & deeplink handler
- [ ] Social sharing integration code
- [ ] Link tracking mechanism
- [ ] Shortlink service (nếu có)

### C. Code Snippets Cần
1. `initializeFirebase()` - Firebase setup
2. `loginWithEmail(email, password)` - Auth
3. `shareParcel(soTo, soThua, lat, lng)` - Generate share link
4. `parseSharedLink(url)` - Handle incoming link
5. `zoomToParcel(soTo, soThua)` - Navigate to parcel
6. Social media share handlers (Zalo, FB, etc)

### D. API/Libraries
- Firebase SDK version? (v8, v9?)
- Social sharing library? (sharer.js?, manual?)
- Shortlink API? (Firebase Dynamic Links, bit.ly?)
- Analytics setup?

### E. Data Structure Examples
```json
// User profile structure
// Shared link log structure
// Analytics collection structure
```

---

## 📊 EXPECTED OUTPUT

Báo cáo nên bao gồm:

1. **Firebase Configuration** (firebaseConfig object)
2. **Authentication Module** (150-200 lines code)
3. **Share Module** (200-300 lines code)
4. **URL Scheme Documentation**
5. **Workflow Diagrams**:
   - Click Share → Generate Link → Copy/Send
   - Receive Link → Parse URL → Zoom & Display
6. **Code Examples** từ dự án cũ
7. **Best Practices & Security Tips**

---

## ⏱️ THỜI GIAN MỨC ĐỘ HIỆN TẠI

- ✅ Map Display & Click: **COMPLETE**
- ✅ Dimension Labels: **COMPLETE**
- ✅ Search & Data: **COMPLETE**
- 🔄 Firebase Auth: **PENDING** (cần báo cáo)
- 🔄 Share Feature: **PENDING** (cần báo cáo)

**Ước tính sau khi tích hợp:** +20% tăng user engagement (giống dự án cũ)

---

**Cảm ơn! 🙏**
