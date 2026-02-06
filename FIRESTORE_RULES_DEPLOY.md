# 🔥 Firestore Rules Deployment Guide

## ⚠️ CRITICAL: Deploy Rules to Firebase Console

**Vấn đề hiện tại**: Form đăng tin bị lỗi `permission-denied` vì Firestore rules chưa được cập nhật.

---

## 📋 Hướng Dẫn Deploy (5 phút)

### Bước 1: Mở Firebase Console
1. Truy cập: https://console.firebase.google.com/
2. Chọn project: **xemgiadat-dfe15**
3. Menu bên trái → **Firestore Database**
4. Tab **Rules** (ở top)

### Bước 2: Copy Rules
Mở file [`firestore.rules`](./firestore.rules) trong repo này, copy toàn bộ nội dung.

### Bước 3: Paste vào Firebase Console
1. Xóa hết rules cũ trong editor
2. Paste nội dung từ `firestore.rules`
3. Click **Publish** (button màu xanh)
4. Đợi ~30 giây để rules được áp dụng

---

## ✅ Kiểm Tra Sau Khi Deploy

1. **Test form đăng tin**:
   - Đăng nhập
   - Chọn thửa
   - Click "Rao" → điền form → submit
   - ✅ Thành công → thấy "Đã ghi nhận!"
   - ❌ Thất bại → check console log

2. **Test old data loading**:
   - Zoom vào Đà Nẵng
   - ✅ Thấy pins màu cam (old listings)
   - ✅ Click vào → popup hiển thị thông tin

---

## 📊 Rules Summary

| Collection | Read | Create | Update/Delete |
|-----------|------|--------|---------------|
| `users` | Public | Own only | Own only (admin can delete) |
| `listings` | Public | Own + auto-approve + validation | Own only (admin can manage) |
| `portfolios` | Public/Private/Admin | Own + validation | Own only (admin can delete) |
| `feedback` | Admin only | Public (no auth) | Admin only |
| `analytics` | Admin only | Admin only | Admin only |
| `beta-signups` | Admin only | Public (with email validation) | Admin only |
| **Default** | Deny | Deny | Deny |

**Key Features**:
- ✅ Admin UID: `FEpPWWT1EaTWQ9FOqBxWN5FeEJk1` (Ba Được) với special permissions
- ✅ Listings auto-approve (không cần pending workflow)
- ✅ Contact info (phone/email) lấy từ users collection (không lưu trong listings)
- ✅ Portfolios có visibility control (private/public)
- ✅ Validation chi tiết cho price (negotiable hoặc fixed)
- ✅ Default deny rule cho security
- ✅ Backward compatible với v1 data

---

## 🔧 Nếu Vẫn Lỗi

### Lỗi: "Missing or insufficient permissions"
**Nguyên nhân**: Rules chưa được publish hoặc deploy sai project

**Fix**:
1. Kiểm tra lại project trong Firebase Console (phải là `xemgiadat-dfe15`)
2. Đảm bảo đã click **Publish** (không phải Save draft)
3. Đợi 1-2 phút cho rules propagate
4. Hard refresh app (Ctrl+Shift+R)

### Lỗi: "status must be approved"
**Nguyên nhân**: Code đang gửi `status: 'pending'`

**Fix**: Đã sửa trong commit này → `status: 'approved'`

---

## 📝 Notes

- Rules này đơn giản hơn v1 (không cần admin approval)
- Có thể thêm admin approval sau nếu cần
- Public read cho users để hiển thị contact info trong listings
- Auto-approve listings để giảm friction cho MVP

---

**Deploy xong → test ngay → báo kết quả!** 🚀
