# 📋 YÊU CẦU BÁO CÁO: FIREBASE AUTH & SHARE FEATURE

**Mục đích:** Tích hợp tính năng đăng nhập Firebase và chia sẻ link có tọa độ từ dự án cũ sang hệ thống MapLibre mới

**Ngày gửi:** 2026-02-05  
**Dự án:** XemGiaDat v2 (xemgiadat-v2)  
**Tech Stack:** React + MapLibre GL + PMTiles  

---

## 📌 PHẦN 1: FIREBASE AUTHENTICATION

### 1.1 Cấu Hình Project
Vui lòng gửi:

```markdown
#### Firebase Project Setup
- [ ] Firebase Project ID
- [ ] Web API Key
- [ ] Auth Domain
- [ ] Database URL (nếu dùng Realtime Database)
- [ ] Storage Bucket
- [ ] firebaseConfig object (có thể sanitize keys)
```

**Ví dụ format:**
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyD...",
        authDomain: "xemgiadat.firebaseapp.com",
            projectId: "xemgiadat-staging",
                storageBucket: "xemgiadat.appspot.com",
                    messagingSenderId: "123456789",
                        appId: "1:123456789:web:abcd1234"
                        };
                        ```

                        ### 1.2 Authentication Flow

                        **Cần các file code:**

                        ```
                        A. Initialization File
                           - Tên file: ?
                              - Dòng code: ?
                                 - Chức năng: Initialize Firebase, setup auth listeners

                                 B. Login Module
                                    - Tên file: public/js/modules/firebase-auth.js ?
                                       - Methods: loginWithEmail(), loginWithGoogle(), loginWithFacebook()?
                                          - Return: User object with { uid, email, displayName, photoURL }?

                                          C. Registration Module
                                             - Tên file: ?
                                                - Validation: Email format, password strength?
                                                   - Auto-create Firestore document cho user mới?

                                                   D. Logout Module
                                                      - Tên file: ?
                                                         - Clear local data?
                                                            - Redirect URL?
                                                            ```

                                                            ### 1.3 User Data Schema

                                                            **Firestore Collection: `users`**
                                                            ```json
                                                            {
                                                              "uid_12345": {
                                                                  "email": "user@example.com",
                                                                      "displayName": "Nguyễn Văn A",
                                                                          "photoURL": "https://...",
                                                                              "phone": "09xxxxxxxxx",
                                                                                  "createdAt": "2026-02-05",
                                                                                      "lastLogin": "2026-02-05",
                                                                                          "role": "user" | "admin",
                                                                                              "preferences": {
                                                                                                    "defaultZoom": 18,
                                                                                                          "theme": "light",
                                                                                                                "language": "vi"
                                                                                                                    },
                                                                                                                        "sharedParcels": 15,
                                                                                                                            "favoriteCount": 8
                                                                                                                              }
                                                                                                                              }
                                                                                                                              ```

                                                                                                                              **Các câu hỏi:**
                                                                                                                              - [ ] Collection name & structure chính xác?
                                                                                                                              - [ ] Có sub-collections (favorites, savedLocations, etc.)?
                                                                                                                              - [ ] Có custom claims hoặc user metadata nào?
                                                                                                                              - [ ] Phone verification được dùng?
                                                                                                                              - [ ] Social login mapping (Google UID → Firestore)?

                                                                                                                              ### 1.4 Security & Permissions

                                                                                                                              **Firestore Rules:**
                                                                                                                              ```
                                                                                                                              - Quy tắc: User chỉ xem được dữ liệu của mình?
                                                                                                                              - Admin có full access?
                                                                                                                              - Public data (shared links) ai cũng xem được?
                                                                                                                              - Rate limiting có?
                                                                                                                              ```

                                                                                                                              **Firebase Auth Rules:**
                                                                                                                              ```
                                                                                                                              - Email verification bắt buộc?
                                                                                                                              - Password requirements?
                                                                                                                              - Session timeout?
                                                                                                                              - Device verification?
                                                                                                                              ```

                                                                                                                              ---

                                                                                                                              ## 📌 PHẦN 2: SHARE FEATURE WITH LOCATION

                                                                                                                              ### 2.1 URL Scheme

                                                                                                                              **Cần clarify:**

                                                                                                                              ```markdown
                                                                                                                              #### Share Link Format

                                                                                                                              Hiện tại URL format của dự án cũ là gì?
                                                                                                                              - [ ] `https://xemgiadat.com/?lat=16.05&lng=108.20&zoom=18`
                                                                                                                              - [ ] `https://xemgiadat.com/?soThua=57&soTo=23&zoom=18`
                                                                                                                              - [ ] `https://xemgiadat.com/?maXa=20314&soThua=57&soTo=23`
                                                                                                                              - [ ] `https://xemgiadat.com/s/abc123def456` (shortlink)
                                                                                                                              - [ ] Khác? Vui lòng chỉ định

                                                                                                                              #### Parcel Identifier
                                                                                                                              - [ ] Dùng số tờ/thửa (soTo/soThua)?
                                                                                                                              - [ ] Hay dùng OBJECTID?
                                                                                                                              - [ ] Hay cả hai?

                                                                                                                              #### Query Parameters Khác
                                                                                                                              - [ ] `userId` (người chia sẻ)?
                                                                                                                              - [ ] `timestamp` (thời điểm chia sẻ)?
                                                                                                                              - [ ] `ref` (referral code)?
                                                                                                                              - [ ] `campaign` (tracking)?
                                                                                                                              ```

                                                                                                                              ### 2.2 Share Button Implementation

                                                                                                                              **Cần code từ các hàm:**

                                                                                                                              ```javascript
                                                                                                                              // A. Copy Link to Clipboard
                                                                                                                              function copyShareLink(soTo, soThua, lat, lng) {
                                                                                                                                  // Implementation?
                                                                                                                                      // Toast notification?
                                                                                                                                          // Error handling?
                                                                                                                                          }

                                                                                                                                          // B. Share to Zalo
                                                                                                                                          function shareToZalo(soTo, soThua, lat, lng) {
                                                                                                                                              // Zalo SDK integration?
                                                                                                                                                  // API endpoint?
                                                                                                                                                      // Message template?
                                                                                                                                                      }

                                                                                                                                                      // C. Share to Facebook
                                                                                                                                                      function shareToFacebook(soTo, soThua, lat, lng) {
                                                                                                                                                          // Facebook SDK?
                                                                                                                                                              // Share Dialog?
                                                                                                                                                                  // Open Graph setup?
                                                                                                                                                                  }

                                                                                                                                                                  // D. Share to Messenger
                                                                                                                                                                  function shareToMessenger(soTo, soThua, lat, lng) {
                                                                                                                                                                      // Messenger integration?
                                                                                                                                                                          // Direct share?
                                                                                                                                                                          }

                                                                                                                                                                          // E. Share to WhatsApp / Telegram / Other
                                                                                                                                                                          function shareToWhatsApp(soTo, soThua, lat, lng) {
                                                                                                                                                                              // URL encoding?
                                                                                                                                                                                  // Message format?
                                                                                                                                                                                  }
                                                                                                                                                                                  ```

                                                                                                                                                                                  **Các câu hỏi:**
                                                                                                                                                                                  - [ ] Có dùng third-party library? (sharer.js, social-share-url, etc.)
                                                                                                                                                                                  - [ ] SDK version? (Zalo SDK version?)
                                                                                                                                                                                  - [ ] Browser compatibility? (Mobile first?)
                                                                                                                                                                                  - [ ] Login required để share?

                                                                                                                                                                                  ### 2.3 Share Text Templates

                                                                                                                                                                                  **Hiện tại dùng template gì khi chia sẻ?**

                                                                                                                                                                                  ```markdown
                                                                                                                                                                                  #### Share Message Template

                                                                                                                                                                                  Ví dụ template cho Zalo:
                                                                                                                                                                                  "🏠 Xem thửa đất số 57, tờ 23 tại Đà Nẵng
                                                                                                                                                                                  📍 Diện tích: 250m²
                                                                                                                                                                                  💰 Giá: [Tính từ API]
                                                                                                                                                                                  👉 Xem chi tiết: {SHARE_LINK}"

                                                                                                                                                                                  Có customize dựa trên:
                                                                                                                                                                                  - [ ] Parcel properties (diện tích, mục đích sử dụng)?
                                                                                                                                                                                  - [ ] Price data (giá đất)?
                                                                                                                                                                                  - [ ] Sender name/avatar?
                                                                                                                                                                                  - [ ] Recipient location (geoip-based)?
                                                                                                                                                                                  ```

                                                                                                                                                                                  ### 2.4 Deep Linking Handler

                                                                                                                                                                                  **Khi người khác click vào link, cần:**

                                                                                                                                                                                  ```javascript
                                                                                                                                                                                  // A. Parse URL Parameters
                                                                                                                                                                                  function parseShareLink(url) {
                                                                                                                                                                                      // Extract lat, lng, zoom, soTo, soThua từ URL?
                                                                                                                                                                                          // Validation?
                                                                                                                                                                                              // Fallback nếu parameters không hợp lệ?
                                                                                                                                                                                              }

                                                                                                                                                                                              // B. Zoom to Parcel
                                                                                                                                                                                              function zoomToParcel(soTo, soThua, lat, lng, zoom) {
                                                                                                                                                                                                  // Center map tại [lat, lng]?
                                                                                                                                                                                                      // Zoom level?
                                                                                                                                                                                                          // Highlight parcel?
                                                                                                                                                                                                              // Display info panel?
                                                                                                                                                                                                              }

                                                                                                                                                                                                              // C. Fetch & Display Parcel Info
                                                                                                                                                                                                              async function displayParcelInfo(soTo, soThua) {
                                                                                                                                                                                                                  // Load GeoJSON from cache hay network?
                                                                                                                                                                                                                      // Display dimensions?
                                                                                                                                                                                                                          // Show price?
                                                                                                                                                                                                                              // Analytics event?
                                                                                                                                                                                                                              }
                                                                                                                                                                                                                              ```

                                                                                                                                                                                                                              **Các câu hỏi:**
                                                                                                                                                                                                                              - [ ] URL parsing library dùng? (querystring, URLSearchParams, etc.)
                                                                                                                                                                                                                              - [ ] Redirect logic nếu URL invalid?
                                                                                                                                                                                                                              - [ ] Auto-zoom animation hay instant?
                                                                                                                                                                                                                              - [ ] Display info panel tự động?
                                                                                                                                                                                                                              - [ ] Google Analytics / Firebase Analytics event?

                                                                                                                                                                                                                              ---

                                                                                                                                                                                                                              ## 📌 PHẦN 3: TRACKING & ANALYTICS

                                                                                                                                                                                                                              ### 3.1 Analytics Events

                                                                                                                                                                                                                              **Cần track những events nào?**

                                                                                                                                                                                                                              ```markdown
                                                                                                                                                                                                                              #### Share Analytics
                                                                                                                                                                                                                              - [ ] Event: "parcel_shared"
                                                                                                                                                                                                                                - Parameters: soTo, soThua, platform (zalo, fb, etc), userId
                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                  - [ ] Event: "shared_link_clicked"
                                                                                                                                                                                                                                    - Parameters: soTo, soThua, source_userId, click_userId, timestamp
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      - [ ] Event: "shared_parcel_viewed"
                                                                                                                                                                                                                                        - Parameters: soTo, soThua, viewer_userId, time_spent

                                                                                                                                                                                                                                        #### Most Shared Parcels
                                                                                                                                                                                                                                        - Track top 10 most shared parcels
                                                                                                                                                                                                                                        - Real-time leaderboard?
                                                                                                                                                                                                                                        ```

                                                                                                                                                                                                                                        ### 3.2 Sharing History

                                                                                                                                                                                                                                        **Firestore Collection: `shareHistory` hoặc `shares`**

                                                                                                                                                                                                                                        ```json
                                                                                                                                                                                                                                        {
                                                                                                                                                                                                                                          "share_12345": {
                                                                                                                                                                                                                                              "parcelId": "57_23",
                                                                                                                                                                                                                                                  "soThua": 57,
                                                                                                                                                                                                                                                      "soTo": 23,
                                                                                                                                                                                                                                                          "maXa": "20314",
                                                                                                                                                                                                                                                              "lat": 16.05,
                                                                                                                                                                                                                                                                  "lng": 108.20,
                                                                                                                                                                                                                                                                      "sharedBy": "uid_123",
                                                                                                                                                                                                                                                                          "sharedTo": "zalo|facebook|messenger|whatsapp|direct",
                                                                                                                                                                                                                                                                              "sharedAt": "2026-02-05T10:30:00Z",
                                                                                                                                                                                                                                                                                  "views": 5,
                                                                                                                                                                                                                                                                                      "clicks": 3,
                                                                                                                                                                                                                                                                                          "shortUrl": "xgd.link/abc123"
                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                            ```

                                                                                                                                                                                                                                                                                            **Các câu hỏi:**
                                                                                                                                                                                                                                                                                            - [ ] Lưu every share hay aggregate?
                                                                                                                                                                                                                                                                                            - [ ] TTL (time-to-live) cho shared links?
                                                                                                                                                                                                                                                                                            - [ ] Có social metadata (og:title, og:image)?
                                                                                                                                                                                                                                                                                            - [ ] Analytics dashboard?

                                                                                                                                                                                                                                                                                            ---

                                                                                                                                                                                                                                                                                            ## 📌 PHẦN 4: SHORTLINK SERVICE

                                                                                                                                                                                                                                                                                            ### 4.1 Shortlink Generation

                                                                                                                                                                                                                                                                                            **Dự án cũ dùng shortlink service nào?**

                                                                                                                                                                                                                                                                                            ```markdown
                                                                                                                                                                                                                                                                                            - [ ] Firebase Dynamic Links
                                                                                                                                                                                                                                                                                            - [ ] bit.ly API
                                                                                                                                                                                                                                                                                            - [ ] tinyurl API
                                                                                                                                                                                                                                                                                            - [ ] Custom shortlink service
                                                                                                                                                                                                                                                                                            - [ ] No shortlink (dùng full URL)

                                                                                                                                                                                                                                                                                            Nếu custom, cần:
                                                                                                                                                                                                                                                                                            - [ ] Backend service implementation
                                                                                                                                                                                                                                                                                            - [ ] Database schema
                                                                                                                                                                                                                                                                                            - [ ] Expiration policy
                                                                                                                                                                                                                                                                                            ```

                                                                                                                                                                                                                                                                                            ### 4.2 URL Redirect Flow

                                                                                                                                                                                                                                                                                            ```
                                                                                                                                                                                                                                                                                            User sends: https://xgd.link/abc123
                                                                                                                                                                                                                                                                                              ↓
                                                                                                                                                                                                                                                                                              Shortlink service redirects to:
                                                                                                                                                                                                                                                                                                https://hvduoc.github.io/xemgiadat-v2/?soThua=57&soTo=23&lat=16.05&lng=108.20&ref=share_abc123
                                                                                                                                                                                                                                                                                                  ↓
                                                                                                                                                                                                                                                                                                  Frontend parses URL & zooms to parcel
                                                                                                                                                                                                                                                                                                  ```

                                                                                                                                                                                                                                                                                                  **Cần code:**
                                                                                                                                                                                                                                                                                                  - [ ] Shortlink creation API endpoint
                                                                                                                                                                                                                                                                                                  - [ ] Redirect middleware
                                                                                                                                                                                                                                                                                                  - [ ] Click tracking logic

                                                                                                                                                                                                                                                                                                  ---

                                                                                                                                                                                                                                                                                                  ## 📌 PHẦN 5: SOCIAL MEDIA INTEGRATION

                                                                                                                                                                                                                                                                                                  ### 5.1 Social Platforms

                                                                                                                                                                                                                                                                                                  **Hiện tại hỗ trợ share tới các platform nào?**

                                                                                                                                                                                                                                                                                                  ```markdown
                                                                                                                                                                                                                                                                                                  - [ ] Zalo (Priority 1 - Vietnamese platform)
                                                                                                                                                                                                                                                                                                  - [ ] Facebook (Priority 1)
                                                                                                                                                                                                                                                                                                  - [ ] Messenger (Priority 1)
                                                                                                                                                                                                                                                                                                  - [ ] WhatsApp (Priority 2)
                                                                                                                                                                                                                                                                                                  - [ ] Telegram (Priority 2)
                                                                                                                                                                                                                                                                                                  - [ ] Signal (Priority 3)
                                                                                                                                                                                                                                                                                                  - [ ] Email (Priority 1)
                                                                                                                                                                                                                                                                                                  - [ ] Clipboard Copy (Priority 1)
                                                                                                                                                                                                                                                                                                  ```

                                                                                                                                                                                                                                                                                                  ### 5.2 Zalo Integration

                                                                                                                                                                                                                                                                                                  **Zalo SDK setup:**

                                                                                                                                                                                                                                                                                                  ```javascript
                                                                                                                                                                                                                                                                                                  // Zalo SDK initialization?
                                                                                                                                                                                                                                                                                                  // Share dialog code?
                                                                                                                                                                                                                                                                                                  // Fallback URL?
                                                                                                                                                                                                                                                                                                  // Device support (web, mobile)?
                                                                                                                                                                                                                                                                                                  ```

                                                                                                                                                                                                                                                                                                  Cần file:
                                                                                                                                                                                                                                                                                                  - [ ] public/js/modules/zalo-share.js (nếu có riêng)
                                                                                                                                                                                                                                                                                                  - [ ] Zalo SDK version
                                                                                                                                                                                                                                                                                                  - [ ] App ID
                                                                                                                                                                                                                                                                                                  - [ ] Server Key

                                                                                                                                                                                                                                                                                                  ### 5.3 Facebook Integration

                                                                                                                                                                                                                                                                                                  **Facebook SDK + Open Graph:**

                                                                                                                                                                                                                                                                                                  ```javascript
                                                                                                                                                                                                                                                                                                  // FB.init() code?
                                                                                                                                                                                                                                                                                                  // Share dialog implementation?
                                                                                                                                                                                                                                                                                                  // og:title, og:image, og:description?
                                                                                                                                                                                                                                                                                                  // Feed story vs Dialog?
                                                                                                                                                                                                                                                                                                  ```

                                                                                                                                                                                                                                                                                                  ---

                                                                                                                                                                                                                                                                                                  ## 📌 PHẦN 6: MOBILE SUPPORT

                                                                                                                                                                                                                                                                                                  ### 6.1 Mobile-Specific Implementation

                                                                                                                                                                                                                                                                                                  ```markdown
                                                                                                                                                                                                                                                                                                  #### iOS
                                                                                                                                                                                                                                                                                                  - [ ] Deep linking scheme (xemgiadat://)
                                                                                                                                                                                                                                                                                                  - [ ] Universal Links (.well-known/apple-app-site-association)
                                                                                                                                                                                                                                                                                                  - [ ] Native app integration?

                                                                                                                                                                                                                                                                                                  #### Android
                                                                                                                                                                                                                                                                                                  - [ ] App Links
                                                                                                                                                                                                                                                                                                  - [ ] Custom scheme (xemgiadat://)
                                                                                                                                                                                                                                                                                                  - [ ] Native app
                                                                                                                                                                                                                                                                                                  integration?

                                                                                                                                                                                                                                                                                                  #### Progressive Web App
                                                                                                                                                                                                                                                                                                  - [ ] Manifest.json update
                                                                                                                                                                                                                                                                                                  - [ ] Service Worker caching
                                                                                                                                                                                                                                                                                                  - [ ] Install banner
                                                                                                                                                                                                                                                                                                  ```

                                                                                                                                                                                                                                                                                                  ### 6.2 Mobile Share Sheet

                                                                                                                                                                                                                                                                                                  ```javascript
                                                                                                                                                                                                                                                                                                  // Native share API?
                                                                                                                                                                                                                                                                                                  navigator.share({
                                                                                                                                                                                                                                                                                                      title: "Xem thửa đất",
                                                                                                                                                                                                                                                                                                          text: "...",
                                                                                                                                                                                                                                                                                                              url: shareLink
                                                                                                                                                                                                                                                                                                              });
                                                                                                                                                                                                                                                                                                              ```

                                                                                                                                                                                                                                                                                                              ---

                                                                                                                                                                                                                                                                                                              ## 📊 EXPECTED DELIVERABLES

                                                                                                                                                                                                                                                                                                              Vui lòng gửi báo cáo gồm:

                                                                                                                                                                                                                                                                                                              ### 1. **Firebase Configuration** (5-10 lines)
                                                                                                                                                                                                                                                                                                                 - firebaseConfig object
                                                                                                                                                                                                                                                                                                                    - Initialization code

                                                                                                                                                                                                                                                                                                                    ### 2. **Authentication Module** (150-200 lines)
                                                                                                                                                                                                                                                                                                                       - `initAuth()`
                                                                                                                                                                                                                                                                                                                          - `loginWithEmail(email, password)`
                                                                                                                                                                                                                                                                                                                             - `loginWithGoogle()`
                                                                                                                                                                                                                                                                                                                                - `loginWithFacebook()`
                                                                                                                                                                                                                                                                                                                                   - `logout()`
                                                                                                                                                                                                                                                                                                                                      - `getCurrentUser()`
                                                                                                                                                                                                                                                                                                                                         - Error handling

                                                                                                                                                                                                                                                                                                                                         ### 3. **Share Module** (250-350 lines)
                                                                                                                                                                                                                                                                                                                                            - `generateShareLink(soTo, soThua, lat, lng)`
                                                                                                                                                                                                                                                                                                                                               - `copyToClipboard(text)`
                                                                                                                                                                                                                                                                                                                                                  - `shareToZalo(shareLink)`
                                                                                                                                                                                                                                                                                                                                                     - `shareToFacebook(soTo, soThua)`
                                                                                                                                                                                                                                                                                                                                                        - `shareToMessenger(shareLink)`
                                                                                                                                                                                                                                                                                                                                                           - `parseSharedLink(url)`
                                                                                                                                                                                                                                                                                                                                                              - `zoomToSharedParcel(soTo, soThua)`

                                                                                                                                                                                                                                                                                                                                                              ### 4. **URL Scheme Documentation**
                                                                                                                                                                                                                                                                                                                                                                 - Exact format of share URLs
                                                                                                                                                                                                                                                                                                                                                                    - Example URLs
                                                                                                                                                                                                                                                                                                                                                                       - Parameter descriptions

                                                                                                                                                                                                                                                                                                                                                                       ### 5. **Firebase Rules** (50-100 lines)
                                                                                                                                                                                                                                                                                                                                                                          - Firestore rules for users collection
                                                                                                                                                                                                                                                                                                                                                                             - Firestore rules for shares collection
                                                                                                                                                                                                                                                                                                                                                                                - Authentication rules

                                                                                                                                                                                                                                                                                                                                                                                ### 6. **Code Files Reference**
                                                                                                                                                                                                                                                                                                                                                                                   - Full path của mỗi file
                                                                                                                                                                                                                                                                                                                                                                                      - Line numbers for relevant functions
                                                                                                                                                                                                                                                                                                                                                                                         - Workflow diagrams (ASCII or image)

                                                                                                                                                                                                                                                                                                                                                                                         ### 7. **Best Practices & Tips**
                                                                                                                                                                                                                                                                                                                                                                                            - Performance optimizations
                                                                                                                                                                                                                                                                                                                                                                                               - Error handling patterns
                                                                                                                                                                                                                                                                                                                                                                                                  - Security considerations
                                                                                                                                                                                                                                                                                                                                                                                                     - Rate limiting strategies

                                                                                                                                                                                                                                                                                                                                                                                                     ### 8. **Test Cases** (Optional)
                                                                                                                                                                                                                                                                                                                                                                                                        - How to test share successfully
                                                                                                                                                                                                                                                                                                                                                                                                           - Common issues & solutions
                                                                                                                                                                                                                                                                                                                                                                                                              - Device testing prerequisites

                                                                                                                                                                                                                                                                                                                                                                                                              ---

                                                                                                                                                                                                                                                                                                                                                                                                              ## 🔗 INTEGRATION INTO V2

                                                                                                                                                                                                                                                                                                                                                                                                              Sau khi nhận báo cáo, tôi cần implement:

                                                                                                                                                                                                                                                                                                                                                                                                              1. **Initialize Firebase** trong React component
                                                                                                                                                                                                                                                                                                                                                                                                              2. **Add Login UI** (Modal hoặc Page)
                                                                                                                                                                                                                                                                                                                                                                                                              3. **Add User Profile** panel
                                                                                                                                                                                                                                                                                                                                                                                                              4. **Add Share Button** trong Parcel Info Panel
                                                                                                                                                                                                                                                                                                                                                                                                              5. **Parse shared URL** on app load
                                                                                                                                                                                                                                                                                                                                                                                                              6. **Track share events** analytics
                                                                                                                                                                                                                                                                                                                                                                                                              7. **Store user preferences** (favorite parcels, etc)
                                                                                                                                                                                                                                                                                                                                                                                                              8. **Add user favorites** feature

                                                                                                                                                                                                                                                                                                                                                                                                              **Files sẽ tạo:**
                                                                                                                                                                                                                                                                                                                                                                                                              - `src/services/FirebaseService.ts`
                                                                                                                                                                                                                                                                                                                                                                                                              - `src/services/ShareService.ts`
                                                                                                                                                                                                                                                                                                                                                                                                              - `src/components/LoginModal.tsx`
                                                                                                                                                                                                                                                                                                                                                                                                              - `src/components/ShareButton.tsx`
                                                                                                                                                                                                                                                                                                                                                                                                              - `src/components/UserProfile.tsx`

                                                                                                                                                                                                                                                                                                                                                                                                              ---

                                                                                                                                                                                                                                                                                                                                                                                                              ## 📞 LIÊN HỆ & QUY TRÌNH

                                                                                                                                                                                                                                                                                                                                                                                                              **Gửi báo cáo tới:**
                                                                                                                                                                                                                                                                                                                                                                                                              - Định dạng: Markdown file hoặc PDF
                                                                                                                                                                                                                                                                                                                                                                                                              - Bao gồm code snippets từ file thực tế
                                                                                                                                                                                                                                                                                                                                                                                                              - Kèm theo `git diff` hoặc file paths

                                                                                                                                                                                                                                                                                                                                                                                                              **Timeline:**
                                                                                                                                                                                                                                                                                                                                                                                                              - Nhận báo cáo: ASAP
                                                                                                                                                                                                                                                                                                                                                                                                              - Phân tích: 1-2 ngày
                                                                                                                                                                                                                                                                                                                                                                                                              - Implement: 3-5 ngày
                                                                                                                                                                                                                                                                                                                                                                                                              - Testing: 2-3 ngày

                                                                                                                                                                                                                                                                                                                                                                                                              **Success Metrics:**
                                                                                                                                                                                                                                                                                                                                                                                                              - Social shares tăng 50%+ (giống dự án cũ)
                                                                                                                                                                                                                                                                                                                                                                                                              - User engagement tăng
                                                                                                                                                                                                                                                                                                                                                                                                              - Referral traffic từ shared links

                                                                                                                                                                                                                                                                                                                                                                                                              ---

                                                                                                                                                                                                                                                                                                                                                                                                              ## 🎯 PRIORITY

                                                                                                                                                                                                                                                                                                                                                                                                              | Feature | Importance | Complexity | Est. Time |
                                                                                                                                                                                                                                                                                                                                                                                                              |---------|-----------|-----------|-----------|
                                                                                                                                                                                                                                                                                                                                                                                                              | Firebase Auth | HIGH | Medium | 2-3d |
                                                                                                                                                                                                                                                                                                                                                                                                              | Copy Link | HIGH | Low | 0.5d |
                                                                                                                                                                                                                                                                                                                                                                                                              | Share to Social | HIGH | Medium | 1-2d |
                                                                                                                                                                                                                                                                                                                                                                                                              | Deep Linking | HIGH | Medium | 1d |
                                                                                                                                                                                                                                                                                                                                                                                                              | Analytics | MEDIUM | Low | 0.5d |
                                                                                                                                                                                                                                                                                                                                                                                                              | Shortlinks | MEDIUM | Medium | 1-2d |
                                                                                                                                                                                                                                                                                                                                                                                                              | Mobile Support | MEDIUM | Medium | 1-2d |

                                                                                                                                                                                                                                                                                                                                                                                                              ---

                                                                                                                                                                                                                                                                                                                                                                                                              **Cảm ơn! 🙏**

                                                                                                                                                                                                                                                                                                                                                                                                              *Generated: 2026-02-05*  
                                                                                                                                                                                                                                                                                                                                                                                                              *For: XemGiaDat v2 (xemgiadat-v2)*
                                                                                                                                                                                                                                                                                                                                                                                                              