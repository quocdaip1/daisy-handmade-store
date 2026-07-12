# Deploy Daisy lên Render

## Kiến trúc

- `daisy-store`: frontend React/Vite dạng Static Site.
- `daisy-api`: backend Laravel chạy bằng Docker.
- `daisy-database`: PostgreSQL production.

Blueprint đặt `plan: free` cho backend và database; Static Site miễn phí mặc định nên không khai báo `plan`. Backend miễn phí có thể sleep khi không có truy cập; database miễn phí chịu giới hạn thời gian và dung lượng theo chính sách hiện hành của Render.

## Các bước

1. Đẩy toàn bộ repository lên GitHub.
2. Trong Render, chọn **New > Blueprint** và kết nối repository.
3. Chọn file `render.yaml` ở thư mục gốc.
4. Điền các biến đang để `sync: false`:
   - Backend `APP_KEY`: chạy local `php artisan key:generate --show` rồi copy kết quả.
   - Backend `APP_URL`: URL public của `daisy-api`, không có dấu `/` cuối.
   - Backend `FRONTEND_URL`: URL public của `daisy-store`, không có dấu `/` cuối.
   - Frontend `VITE_API_BASE_URL`: URL backend kèm `/api`, ví dụ `https://daisy-api.onrender.com/api`.
5. Deploy lại frontend sau khi có URL backend chính xác.
6. Kiểm tra `/up`, sau đó smoke test đăng ký, đăng nhập, sản phẩm, checkout và đơn hàng.

## Lưu ý an toàn

- Không commit `.env`, `APP_KEY`, password database hoặc secret lên GitHub.
- Giữ `APP_DEBUG=false` ở production.
- Free tier không hỗ trợ pre-deploy command; backend Docker tự chạy `php artisan migrate --force` trước Apache mỗi khi container khởi động. Không chạy `migrate:fresh`.
- Nếu đổi domain frontend, cập nhật đồng thời `FRONTEND_URL` backend.
