# Backend Improvement Plan – Daisy Handmade Store

Kế hoạch này dựa trên audit ngày 11/07/2026. Chưa thực thi code, chưa tạo migration và chưa thay đổi database. Mỗi phase nên được triển khai bằng PR nhỏ, có migration forward-only, test và kế hoạch rollback.

## Nguyên tắc triển khai

- Giữ Laravel hiện tại; không tạo project mới.
- Ưu tiên tính đúng đắn của authentication, order và stock trước khi thêm tính năng.
- Backend là nguồn sự thật cho giá, giảm giá, phí ship, tồn kho và trạng thái thanh toán.
- Không đưa toàn bộ logic vào controller; dùng Form Request, Service và API Resource có chủ đích.
- Không thêm Repository nếu Eloquent đã đủ; chỉ thêm khi có query/data-source boundary thực sự.
- Mọi thay đổi database phải bảo toàn dữ liệu hiện có và có kiểm tra rollback trên bản sao.

## Phase 1 – Lỗi cần sửa ngay

### P0: Authentication

1. Gắn `Laravel\Sanctum\HasApiTokens` vào `User`; xóa import trait sai chỗ ở controller.
2. Thêm feature test cho register, login, `/me`, invalid credentials và unauthenticated response.
3. Thêm logout/revoke current token; xác định token expiry và cleanup policy.
4. Throttle login/register; cân nhắc token abilities.
5. Thống nhất guest checkout hay bắt buộc đăng nhập với frontend. Nếu bắt buộc, frontend phải chặn/redirect rõ; nếu guest, order route và dữ liệu phải hỗ trợ guest an toàn.

### P0: Order và tồn kho

1. Trước khi mở checkout production, thiết kế persistence tối thiểu cho order và order items; không tiếp tục dùng response-only order.
2. Bọc toàn bộ checkout trong `DB::transaction`.
3. Query products một lần, khóa bằng `lockForUpdate`, xác thực toàn bộ items trước khi decrement.
4. Chống product trùng trong payload; giới hạn số dòng và quantity.
5. Thêm idempotency key để retry không tạo/trừ kho hai lần.
6. Lưu snapshot product name/SKU/price trong order item.
7. Chỉ clear cart frontend sau response order đã persist thành công.

### P1: Validation và contract

1. Tạo Form Requests cho auth/order.
2. Chuẩn hóa response/error JSON và mã lỗi máy đọc được.
3. Dùng API Resources cho Product/Category/User/Order.
4. Sửa asset seed path; xác định URL ảnh public ổn định.
5. Cập nhật APP_NAME, locale, timezone và production-safe `.env.example`.

### Test bắt buộc Phase 1

- Auth success/failure/throttle/logout.
- Order 401, validation 422, product missing, insufficient stock.
- Hai request đồng thời không oversell.
- Failure ở item thứ N không trừ stock item trước.
- Retry cùng idempotency key chỉ tạo một order.

## Phase 2 – API cần bổ sung

### Catalog

- `GET /api/products` hỗ trợ page/per_page, search, category, min/max price, featured, is_new, sort.
- Admin CRUD Product/Category với policy và API Resource.
- Media upload/delete/reorder cho product gallery.
- Trạng thái draft/published/active; SKU nếu cần quản lý kho.

### Order và customer

- `GET /api/orders` cho lịch sử đơn của user.
- `GET /api/orders/{order}` với ownership policy.
- Admin list/detail/update status/cancel/refund notes.
- Customer profile update và address CRUD/default address.
- Order status history và shipment tracking.

### Payment

- Lưu `payment_method`, `payment_status`, transaction reference.
- COD workflow.
- Bank transfer instruction và reconciliation; QR phải sinh từ dữ liệu đã xác nhận.
- Webhook idempotent nếu tích hợp cổng thanh toán sau này.

### Coupon/Voucher

- Coupon rules: code, type, value, min order, start/end, total/user usage limit, active.
- API validate coupon và áp dụng server-side trong transaction.
- Lưu discount snapshot và coupon usage cùng order.

### Shipping

- Shipping zones/methods/rates và free-shipping threshold server-side.
- API quote theo địa chỉ/cart.
- Adapter cho GHN/GHTK/Viettel Post; webhook cập nhật tracking.

### Contact, policy, CMS

- Contact submission có rate limit, spam protection và notification queue.
- Policy CRUD/version/publish cho đổi trả, bảo mật, vận chuyển.
- Banner/content CRUD nếu thực sự cần admin quản lý.

### Admin

- Role/permission rõ ràng: customer, staff, admin.
- Dashboard revenue/orders/customers chỉ dựa trên persisted orders.
- Product, order, customer, coupon, shipping, contact, policy management.

## Phase 3 – Tối ưu hiệu năng

1. Pagination bắt buộc; giới hạn `per_page` tối đa.
2. Index theo query thật: category/status/featured/is_new/price, order user/status/created_at, coupon code.
3. Eager loading có kiểm soát; select field cần thiết; tránh map toàn catalog trong PHP.
4. Cache category, product featured/new và policy published; invalidation khi admin update.
5. Queue email xác nhận đơn, contact notification, resize ảnh và sync vận chuyển.
6. Chuyển media sang WebP/AVIF thumbnail variants, CDN/object storage khi cần.
7. Theo dõi slow query, queue latency, cache hit rate và API p95.
8. Dùng aggregate/report table hoặc scheduled summary khi dashboard lớn; không tối ưu sớm trước khi có dữ liệu thật.

## Phase 4 – Tối ưu bảo mật

1. Sanctum token lifecycle, abilities, expiration và revoke.
2. Rate limiting phân theo endpoint/user/IP; lockout/backoff cho login.
3. Email verification, password reset và password policy.
4. Policies cho mọi admin/customer resource; chống IDOR ở order/address.
5. Transaction, row locks và idempotency cho order/payment/webhook.
6. CORS allowlist production, trusted proxies/hosts, HTTPS-only cookie và secure headers/CSP.
7. Upload allowlist MIME, kiểm tra nội dung, kích thước/dimension, tên file ngẫu nhiên; không cho thực thi file.
8. Audit log immutable cho admin, stock, order, coupon và payment.
9. Mask PII/log, secret rotation, least-privilege DB/storage credentials.
10. Backup tự động có encryption, retention và thử restore định kỳ.
11. Dependency audit Composer trong CI, SAST và secret scanning.
12. Quy trình incident response và giám sát lỗi 401/403/422/429/5xx.

## Phase 5 – Tính năng mở rộng

1. Wishlist/favorites và saved cart đa thiết bị.
2. Product reviews đã mua hàng; rating tính từ review thay vì field nhập tay.
3. Inventory movement ledger, low-stock alert và reservation timeout.
4. Đa kho/chi nhánh nếu phát sinh nhu cầu.
5. Loyalty points, customer segments và voucher cá nhân hóa.
6. Google Analytics/Facebook Pixel consent configuration.
7. Messenger/Zalo integration theo consent và chính sách dữ liệu.
8. SEO content API, sitemap, structured product data và canonical management.
9. Notification center: email/SMS/order status.
10. Reporting/export doanh thu, sản phẩm bán chạy, tồn kho và cohort khách hàng.
11. Affiliate chỉ triển khai khi có yêu cầu kinh doanh rõ, attribution và fraud controls.

## Thứ tự bàn giao đề xuất

```text
Auth runtime fix
  → Order persistence + atomic stock
  → Contract/validation/tests
  → Customer orders/addresses
  → Admin + catalog CRUD/media
  → Coupon + shipping + payment
  → Performance/security hardening
  → Optional growth features
```

## Definition of Done cho mỗi phase

- Feature test và authorization test đạt.
- API contract được tài liệu hóa.
- Migration được thử trên bản sao dữ liệu, có rollback plan.
- Không log secret/PII ngoài chính sách.
- Observability và failure path được kiểm tra.
- Frontend/backend thống nhất nguồn sự thật cho giá, discount, shipping và payment.
- `composer test`, formatter và static analysis đạt trong CI.
