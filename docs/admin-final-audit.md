# Admin Final Audit – Daisy Handmade Store

Cập nhật: 16/07/2026

## 1. Kết luận

Admin Phase 1–9 đã có đủ các module được yêu cầu và toàn bộ kiểm tra tự động hiện tại đều đạt. Không phát hiện lỗi Critical trong authorization hoặc rò rỉ customer/admin API trực tiếp.

Trạng thái đề xuất: **đủ điều kiện staging, chưa nên production trước khi xử lý lưu trữ ảnh upload**. Docker/Render hiện chưa tạo public storage link và không cấu hình persistent storage, nên ảnh sản phẩm upload trong Admin có thể không truy cập được hoặc mất khi container restart/redeploy.

Audit này không tạo hoặc sửa tính năng. Responsive/accessibility được review bằng source; chưa có browser E2E hoặc kiểm tra trực quan vì phiên hiện tại không có in-app browser khả dụng.

## 2. Phạm vi và bằng chứng

- Backend: 34 Admin routes, Sanctum middleware, `EnsureAdmin`, Admin Form Requests, `OrderPolicy`, controllers/services và feature tests.
- Frontend: `AuthProvider`, `ProtectedAdminRoute`, Admin layout/navigation, toàn bộ pages/components/services/types Phase 1–9 và responsive CSS.
- Deployment: migrations, `render.yaml`, backend Dockerfile, CORS, filesystem và environment templates.

Kết quả chạy mới trong lượt audit:

```text
php artisan test: passed, 60/60 tests, 408 assertions
npm.cmd run lint: passed
npm.cmd run build: passed, Vite 8.1.4, 104 modules transformed
php artisan migrate:status: toàn bộ 10 migrations đã Ran
php artisan route:list --path=api/admin -v: 34 routes đều có auth:sanctum + EnsureAdmin
git diff --check: passed
```

## 3. Completed features

| Module | Trạng thái | Bằng chứng chính |
|---|---|---|
| Admin Auth/Foundation | Hoàn thành | Bearer token Sanctum, `/api/me`, server-side role probe, protected nested routes, logout |
| Product Management | Hoàn thành | List/search/filter, create/edit, soft deactivate, validated image upload |
| Category Management | Hoàn thành | List/create/edit, Active/Inactive, chỉ xóa danh mục rỗng; customer contract chỉ hiện active |
| Order Management | Hoàn thành | Search/status filter/detail, status và tracking update qua service |
| Customer Management | Hoàn thành | Search, profile/address/order history; password bị cấm trong Admin update |
| Coupon Management | Hoàn thành | Create/edit/toggle, usage statistics, dùng engine percent/fixed hiện có |
| Content Management | Hoàn thành | Hai banner slots, contact inbox read-only, policy create/edit/publish |
| Dashboard | Hoàn thành | Revenue, Orders, Customers, Products và top 5 Best Sellers từ Statistics API |
| Settings | Hoàn thành | Shop, Bank, Shipping, Social, SEO qua GET/PUT Settings API; không hard-code ở Admin frontend |

## 4. Backend audit

### Authorization, policies và role access

- Tất cả `/api/admin/*` nằm trong `auth:sanctum` và `EnsureAdmin`; unauthenticated nhận 401, customer nhận 403 trong các feature tests.
- Frontend không tin role trong login response. `ProtectedAdminRoute` lấy user hiện tại rồi gọi HEAD `/api/admin/dashboard`; quyết định cuối cùng vẫn do backend middleware.
- `User::isAdmin()` cho phép hai role `admin` và `staff`. Hiện hai role có toàn quyền giống nhau trên toàn bộ 34 Admin routes.
- Các Admin Form Requests kiểm tra lại `isAdmin()` cho mutation và validate field/range/status.
- `OrderPolicy` bảo vệ customer order view/cancel theo ownership và status; Admin order routes được bảo vệ ở route middleware.
- Public registration không nhận field role; password được hash bởi model cast và bị ẩn khỏi JSON. Admin Customer API cấm cập nhật password trực tiếp.

### Data integrity

- Product delete chuyển `inactive`; Category delete bị chặn khi còn product.
- Order status chỉ nhận `Order::STATUSES`; update chạy trong `OrderService` transaction.
- Coupon giới hạn percent, thời hạn, usage limits; coupon đã dùng chỉ bị disable.
- Dashboard revenue/Best Sellers chỉ dùng order đã paid.
- Settings update chạy transaction; shipping record không còn trong payload bị disable thay vì hard-delete.
- Upload giới hạn 8 ảnh/request, MIME JPG/JPEG/PNG/WebP và 5 MB/ảnh.

## 5. Frontend audit

### Route protection

- Tất cả Admin pages là children của `ProtectedAdminRoute` và `AdminLayout`.
- Không token chuyển tới `/dang-nhap`; token hợp lệ nhưng không đủ role chuyển về `/`; lỗi mạng có state retry riêng.
- API services dùng base URL tập trung và Bearer token; không query database hoặc chứa credential cấu hình cửa hàng.

### Responsive

- Layout chuyển từ sidebar hai cột sang một cột tại 760 px.
- Form/grid chuyển 2→1 cột theo breakpoint; Dashboard chuyển 4→2→1.
- Các bảng rộng nằm trong wrapper `overflow-x: auto`; detail pages chuyển về một cột ở tablet/mobile.
- Kết luận responsive dựa trên CSS/source review. Chưa xác minh trực quan ở desktop/tablet/mobile bằng browser trong lượt này.

### Accessibility

Điểm đạt:

- Có semantic `main`, `nav`, headings, `fieldset/legend`, label bao quanh input và live/error regions tại các flow chính.
- Dialog có `role="dialog"`, `aria-modal` và `aria-labelledby`; button hành động đa số có `type` rõ ràng.
- Ảnh preview dùng alt rỗng khi nội dung tên sản phẩm/banner đã xuất hiện cạnh ảnh, tránh lặp cho screen reader.

Khoảng trống:

- Modal Product/Category/Coupon/Banner/Policy/Contact chưa có focus trap, autofocus hợp lý, đóng bằng Escape hoặc trả focus về trigger.
- Một số nút đóng chỉ có ký tự `×`, chưa có `aria-label` mô tả.
- Table headers chưa khai báo `scope="col"`; validation errors chưa được nối nhất quán với control bằng `aria-invalid`/`aria-describedby`.
- Chưa có axe/Lighthouse/browser keyboard test hoặc frontend route-protection test tự động.

## 6. Security findings

| ID | Mức độ | Finding | Khuyến nghị |
|---|---|---|---|
| ADM-SEC-01 | High | Product upload dùng public local disk nhưng Docker không chạy `storage:link`; `render.yaml` không có persistent disk/object storage. File có thể 404 hoặc mất sau restart/redeploy. | Trước production, cấu hình object storage hoặc persistent disk, tạo public link/URL đúng và smoke-test upload/serve/redeploy. |
| ADM-SEC-02 | Medium | Sanctum token không có expiration và được lưu trong localStorage; XSS có thể lấy token dài hạn. | Đặt expiration/revocation policy, cân nhắc token abilities và CSP; thu hồi token khi offboard hoặc nghi ngờ lộ. |
| ADM-SEC-03 | Medium | `staff` có cùng toàn quyền với `admin`, bao gồm Bank/Settings và mutation. Access probe đã có staff test nhưng chưa có full-route staff matrix. | Xác nhận đây là chủ đích hoặc tách permissions/capabilities; thêm access matrix tests. |
| ADM-SEC-04 | Medium | Không có admin audit log/status history cho thay đổi order, coupon, content, settings hoặc bank account. | Ghi actor, action, resource, before/after và timestamp; không ghi token/password. |
| ADM-SEC-05 | Medium | Dialog chưa quản lý keyboard focus đầy đủ, có thể làm người dùng bàn phím/screen reader mất ngữ cảnh. | Thêm focus trap, Escape, initial focus và restore focus; chạy axe + keyboard test. |
| ADM-SEC-06 | Low | Admin mutation routes chưa có rate limiter riêng. | Thêm limiter phù hợp cho login-independent mutation/upload nếu threat model yêu cầu. |
| ADM-SEC-07 | Low | Banner `image`/`link` chỉ validate string/length, chưa giới hạn relative path hoặc http/https. Customer Homepage chưa consume API nên rủi ro hiện tại bị giới hạn. | Chuẩn hóa scheme/path trước khi dùng Banner API để render customer links. |
| ADM-SEC-08 | Low | Test suite chưa có ma trận 34 routes × unauthenticated/customer/staff/admin và chưa có frontend E2E. | Bổ sung representative mutation/role matrix và protected-route browser tests. |

Không phát hiện trong phạm vi audit:

- Customer truy cập được Admin API khi không có role.
- Public registration tự gán role admin/staff.
- Admin Customer API trả password hoặc cho sửa password trực tiếp.
- Frontend tự tính doanh thu, phí vận chuyển hoặc discount thay backend.
- Hard-coded Bank/Shop/Social/SEO values trong Admin Settings frontend.

## 7. Remaining issues

1. Xử lý blocker storage upload trước production.
2. Quyết định mô hình quyền `staff` so với `admin`; hiện không có quyền chi tiết.
3. Thiết lập vòng đời Sanctum token và audit trail cho thao tác nhạy cảm.
4. Hoàn thiện modal/table/form accessibility và chạy kiểm tra browser thực tế.
5. Social Links/SEO Defaults đã lưu ở backend nhưng customer Footer/head metadata chưa consume.
6. Dashboard chưa có cache/time-series; phù hợp dữ liệu nhỏ nhưng cần theo dõi khi số order tăng.
7. Admin Customer API update name/email vẫn tồn tại dù UI hiện read-only; cần giữ contract hoặc deprecate có kế hoạch, không mở rộng ngầm.

## 8. Deployment checklist

### Blocker trước production

- [ ] Chọn persistent disk hoặc object storage cho product uploads.
- [ ] Tạo/kiểm tra `public/storage` link hoặc CDN URL trong production container.
- [ ] Upload ảnh, mở URL ảnh, restart/redeploy rồi xác nhận file vẫn tồn tại.

### Environment và dữ liệu

- [ ] Backup database và xác nhận rollback trước migration.
- [ ] Đặt `APP_ENV=production`, `APP_DEBUG=false`, `APP_KEY` ổn định và `APP_URL` HTTPS chính xác.
- [ ] Đặt `FRONTEND_URL` đúng origin; không dùng wildcard CORS.
- [ ] Đặt `VITE_API_BASE_URL` trỏ đúng backend HTTPS trước frontend build.
- [ ] Xác nhận PostgreSQL credentials và TLS/network policy của nền tảng.
- [ ] Chạy `php artisan migrate --force`; xác nhận migration Category Active và Store Settings đã Ran.
- [ ] Kiểm tra `db:seed --force` idempotent trước khi để Docker chạy seeder mỗi startup.

### Admin access và cấu hình

- [ ] Tạo admin đầu tiên bằng quy trình bảo mật; không dùng factory/default password ở production.
- [ ] Xác nhận danh sách user role `admin`/`staff`; vô hiệu hóa tài khoản không cần thiết.
- [ ] Quyết định staff có được truy cập Bank/Settings hay không.
- [ ] Đăng nhập Admin và smoke-test 401/403 bằng customer account.
- [ ] Lưu và kiểm tra Shop, Bank, Shipping, Social và SEO settings.
- [ ] Tạo thử bank-transfer order mới và xác nhận metadata dùng Bank Settings hiện tại.

### Build, verification và vận hành

- [ ] Chạy `php artisan test`, `npm ci`, `npm run lint`, `npm run build` trên artifact/commit triển khai.
- [ ] Kiểm tra `/up`, `/api/health`, SPA rewrite và tất cả Admin routes sau deploy.
- [ ] Thử CRUD đại diện: product, category, order status, coupon, banner/policy và settings.
- [ ] Kiểm tra desktop/tablet/mobile, keyboard-only, screen reader và axe/Lighthouse.
- [ ] Thiết lập log/alert không chứa token, password hoặc bank secrets.
- [ ] Thiết lập database backup, token revocation, incident response và rollback migration.

## 9. Quyết định bàn giao

- Staging: **Go**, với lưu ý browser/accessibility manual QA chưa chạy.
- Production: **No-Go** cho tới khi ADM-SEC-01 được xử lý và smoke-test qua restart/redeploy.
- Sau blocker: production có thể cân nhắc Go nếu access matrix, environment, migration, backup và manual QA trong checklist đều đạt.

## 10. Post-audit update – Admin Access UX

Ngày 16/07/2026, luồng chuyển từ storefront sang Admin được cải thiện mà không thay đổi login/customer contract:

- Thêm `GET /api/admin/access`, được bảo vệ bằng `auth:sanctum` và `EnsureAdmin`; endpoint chỉ xác nhận `{ allowed: true }`, không tải Dashboard statistics.
- Customer nhận 403, unauthenticated nhận 401, admin và staff nhận 200; đã có backend tests cho bốn trường hợp.
- Header desktop và mobile chỉ hiển thị `Vào quản trị` sau khi backend access probe thành công.
- Login/register cập nhật Auth Context ngay lập tức; reload trang khôi phục session qua `/api/me`.
- Profile logout dùng cùng Auth Context nên nút Admin biến mất ngay khi token bị thu hồi.
- Frontend không lưu role hoặc kết quả quyền vào localStorage; DevTools không vượt được middleware backend.
- Verification sau thay đổi: backend 60/60 tests, 408 assertions; Pint, frontend lint và build passed; build 104 modules.

Production decision và storage blocker ADM-SEC-01 không thay đổi.
