# 🚀 Zero-Touch Deploy - Hướng dẫn sử dụng

## Giới thiệu

Hệ thống Zero-Touch Deploy cho phép bạn triển khai code lên production 100% từ điện thoại mà không cần dùng terminal hay máy tính.

## Tính năng

✅ **Tự động phát hiện nhánh**: Tự động tìm nhánh `copilot/...` mới nhất  
✅ **Triển khai một chạm**: Chỉ cần bấm nút "Run workflow"  
✅ **Dọn dẹp tự động**: Tự động xóa nhánh sau khi deploy (có thể tắt)  
✅ **An toàn**: Sử dụng GitHub Actions với quyền hạn được kiểm soát  

## Cách sử dụng

### Từ điện thoại (GitHub Mobile App)

1. Mở GitHub app trên điện thoại
2. Vào repository: **hvduoc/xemgiadat-v2**
3. Chọn tab **Actions**
4. Chọn workflow: **🚀 Chốt Đơn (CEO Mode)**
5. Bấm nút **Run workflow**
6. Cấu hình (tùy chọn):
   - **branch_name**: Để trống hoặc nhập tên nhánh cụ thể
   - **cleanup**: Bật/tắt tự động xóa nhánh (mặc định: BẬT)
7. Bấm **Run workflow** để bắt đầu

### Từ trình duyệt web

1. Truy cập: https://github.com/hvduoc/xemgiadat-v2/actions
2. Chọn workflow: **🚀 Chốt Đơn (CEO Mode)**
3. Bấm nút **Run workflow** (góc trên bên phải)
4. Cấu hình tương tự như trên
5. Bấm **Run workflow** để bắt đầu

## Quy trình hoạt động

```
┌─────────────────────────────────────────────────┐
│  1. Phát hiện nhánh                            │
│     - Dùng input hoặc tìm copilot/... mới nhất│
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  2. Deploy to Main                             │
│     - git reset --hard origin/<branch>         │
│     - git push origin main --force             │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  3. Cleanup (nếu bật)                          │
│     - Xóa nhánh remote                         │
└─────────────────────────────────────────────────┘
```

## Tham số đầu vào

### branch_name (Tùy chọn)
- **Mô tả**: Tên nhánh muốn triển khai
- **Mặc định**: Tự động tìm nhánh `copilot/...` mới nhất
- **Ví dụ**: `copilot/setup-zero-touch-deploy`

### cleanup (Boolean)
- **Mô tả**: Xóa nhánh sau khi triển khai xong
- **Mặc định**: `true` (BẬT)
- **Khuyến nghị**: Để BẬT để giữ repository gọn gàng

## Ví dụ sử dụng

### Trường hợp 1: Deploy nhánh mới nhất (Khuyến nghị)
```
branch_name: (để trống)
cleanup: true
```
→ Tự động tìm và deploy nhánh `copilot/...` mới nhất, sau đó xóa nhánh

### Trường hợp 2: Deploy nhánh cụ thể
```
branch_name: copilot/feature-xyz
cleanup: true
```
→ Deploy nhánh `copilot/feature-xyz` và xóa nhánh sau đó

### Trường hợp 3: Deploy nhưng giữ lại nhánh
```
branch_name: (để trống hoặc chỉ định)
cleanup: false
```
→ Deploy nhưng KHÔNG xóa nhánh (hữu ích khi muốn backup)

## Lưu ý quan trọng

⚠️ **Force Push**: Workflow này sử dụng `git push --force` để đảm bảo main luôn giống nhánh được deploy

⚠️ **Quyền hạn**: Workflow cần quyền `contents: write` để push code

⚠️ **Không rollback**: Sau khi deploy, không thể rollback tự động. Nếu cần rollback, bạn phải chạy lại workflow với nhánh cũ hơn

## Xử lý sự cố

### Lỗi: "No copilot branch found"
- **Nguyên nhân**: Không tìm thấy nhánh `copilot/...` nào
- **Giải pháp**: Nhập tên nhánh cụ thể vào `branch_name`

### Lỗi: "Permission denied"
- **Nguyên nhân**: Không có quyền push
- **Giải pháp**: Kiểm tra settings của repository hoặc liên hệ admin

### Workflow không chạy
- **Kiểm tra**: Actions có được bật trong repository settings
- **Kiểm tra**: File `.github/workflows/ceo-deploy.yml` có tồn tại

## So sánh với quy trình thủ công

### Trước đây (Thủ công)
```bash
git fetch origin copilot/ux-refinement-v4-1
git checkout copilot/ux-refinement-v4-1
git push origin copilot/ux-refinement-v4-1:main --force
```
→ Cần máy tính, terminal, và các lệnh git

### Bây giờ (Zero-Touch)
```
Mở GitHub App → Actions → Run workflow → Bấm nút
```
→ 100% từ điện thoại, không cần terminal!

## Bảo mật

✅ Sử dụng `GITHUB_TOKEN` tự động (không cần tạo token riêng)  
✅ Quyền hạn tối thiểu: chỉ `contents: write`  
✅ Chạy trên môi trường GitHub Actions được bảo mật  
✅ Tất cả thao tác đều được log và audit  

## Kết luận

Zero-Touch Deploy giúp bạn:
- ⚡ Deploy nhanh chóng từ bất cứ đâu
- 📱 Hoàn toàn từ điện thoại
- 🎯 Giảm thiểu lỗi thủ công
- 🔒 An toàn và có audit trail

**Chúc bạn deploy thành công! 🚀**
