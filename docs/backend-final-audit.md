# Final Backend Audit – Daisy Handmade Store

Ngày audit: 11/07/2026  
Phạm vi: Laravel backend sau Phase 1–11. Audit read-only; không sửa frontend, không thay đổi source nghiệp vụ, không tạo migration và không bổ sung tính năng.

## 1. Kết luận tổng quan

Backend đã có nền tảng tốt cho catalog, authentication, cart, checkout preview, coupon, order, COD/bank transfer và admin. Feature tests, Laravel runtime, Composer và code style đều đạt.

Tuy nhiên, hệ thống **chưa nên phát hành production ngay** vì:

1. Hai migration nghiệp vụ chính vẫn `Pending` trên database ứng dụng hiện tại.
2. Admin update có thể chuyển order trực tiếp sang `cancelled`/`returned` mà không chạy logic hoàn stock và coupon usage.
3. Token Sanctum không có expiration và nhiều endpoint thay đổi trạng thái chưa có rate limit.
4. Chưa có static analysis, concurrency test trên database production hoặc audit/status history.

Không phát hiện route public nào cho phép trực tiếp tạo/sửa order, payment, product, coupon hoặc dữ liệu admin mà không qua authentication/authorization.

## 2. Phạm vi kiểm tra

Đã đọc và đối chiếu:

- Toàn bộ `app/Models`, controllers, middleware, policies, requests, resources và services.
- `routes/api.php`, `routes/web.php`, `bootstrap/app.php`.
- Toàn bộ migrations, seeders và tests.
- Authentication/Sanctum, filesystem upload, queue/cache/session config.
- `composer.json`, `composer.lock`, `.env.example`, payment config và PHPUnit config.
- Các báo cáo/kế hoạch backend từ Phase 1–11.

Đã kiểm tra theo các nhóm: security, authorization, validation, query performance, N+1, API consistency, rate limiting, mass assignment, sensitive data exposure và error handling.

## 3. Kết quả lệnh kiểm tra

### PHPUnit

```text
php artisan test
49 tests passed
259 assertions
Exit code: 0
```

Test sử dụng SQLite `:memory:` và `RefreshDatabase`.

### Routes

```text
php artisan route:list
60 routes
Exit code: 0
```

Bao gồm public catalog/content, Sanctum auth/customer routes, 23 admin routes, health routes và framework storage/Sanctum routes.

### Composer

```text
composer validate --no-check-publish
./composer.json is valid
Exit code: 0
```

### Laravel Pint

```text
vendor/bin/pint --test
Result: passed
Exit code: 0
```

### PHPStan

```text
PHPStan: not installed
```

PHPStan/Larastan không có trong `require-dev`, không có executable và không có `phpstan.neon`. Không tự cài dependency trong final audit.

### Migration status

```text
2026_07_11_000001_add_phase_two_commerce_tables  Pending
2026_07_11_000002_create_cart_items_table         Pending
```

Các migration users/categories/products/Sanctum cũ đã `Ran`. Database ứng dụng hiện tại chưa có đầy đủ schema mà backend Phase 2–11 yêu cầu.

## 4. Security findings

### Critical – Deployment schema chưa đồng bộ

Hai migration tạo role, order, payment, coupon, address, shipping, admin-supporting fields và cart vẫn chưa chạy trên database ứng dụng. Nếu deploy code hiện tại lên database này, phần lớn endpoint nghiệp vụ sẽ lỗi SQL.

Khuyến nghị:

- Backup database và xác nhận đúng environment/connection.
- Chạy thử migrations trên bản sao dữ liệu.
- Kiểm tra thời gian lock, rollback và foreign keys.
- Chỉ chạy production migration trong maintenance/deployment window có giám sát.

### High – Admin cancellation/return bypass business service

`AdminController::updateOrder()` cho phép đặt trực tiếp mọi `Order::STATUSES`, gồm `cancelled` và `returned`. Luồng này chỉ update row order/payment; không gọi `OrderService::cancel()`, vì vậy có thể không hoàn stock và không release coupon usage.

Customer cancel route an toàn hơn: có policy, transaction, row locks, hoàn stock và coupon usage.

Khuyến nghị: dùng một state transition service duy nhất cho cả customer/admin; cấm update thẳng các trạng thái có side effect.

### High – Token không hết hạn

Sanctum `expiration` là `null`. Login phát hành token mới mỗi lần; logout chỉ revoke current token. Token bị lộ có hiệu lực vô thời hạn cho đến khi bị xóa.

Khuyến nghị: đặt token lifetime, cleanup command định kỳ, hỗ trợ revoke all sessions và cân nhắc token abilities cho admin.

### High – Rate limiting chưa phủ endpoint nhạy cảm

Đã có `throttle:5,1` cho login, register và contact. Chưa có limiter riêng cho:

- Create/cancel order.
- Checkout preview.
- Cart mutations.
- Coupon validation và shipping quote.
- Admin mutations và upload ảnh.

Rủi ro gồm abuse, brute-force voucher, spam order và tài nguyên upload/query bị tiêu thụ quá mức.

Khuyến nghị: named rate limiters theo user ID + IP, ngưỡng riêng cho read/write/upload và trả `Retry-After` chuẩn.

### Medium – Password/auth lifecycle chưa production-complete

- Password đăng ký tối thiểu 6 ký tự.
- Chưa có email verification.
- Chưa có password reset API dù schema mặc định tồn tại.
- Chưa có MFA/step-up authentication cho admin.
- `staff` được `isAdmin()` cho toàn quyền tương đương `admin`; chưa có permission matrix.

Khuyến nghị: password policy mạnh hơn, compromised-password check khi có network policy phù hợp, verify/reset flow và phân quyền granular.

### Medium – IDOR/error semantics chưa nhất quán

- Order dùng policy đúng; customer khác nhận 403.
- Cart item của user khác trả 404, giảm khả năng enumerate.
- Address update/delete của user khác trả 403, qua đó xác nhận ID tồn tại.
- Checkout saved address dùng generic 422 cho địa chỉ không thuộc user.

Khuyến nghị: thống nhất ownership lookup scoped theo user và trả 404 cho resource không thuộc quyền sở hữu.

### Medium – Upload/media lifecycle

Upload product giới hạn image MIME, jpg/jpeg/png/webp, 5 MB/file và 8 file/request; SVG/executable không được phép. Đây là điểm tốt.

Rủi ro còn lại:

- Giới hạn 8 chỉ áp dụng mỗi request, không giới hạn tổng gallery.
- Không có delete/reorder và cleanup file orphan.
- Chưa có malware scanning hoặc re-encode ảnh.
- Public URL phụ thuộc `APP_URL`/`storage:link` deployment.

### Medium – Production environment template không an toàn mặc định

`.env.example` dùng `APP_ENV=local`, `APP_DEBUG=true`, `APP_URL=http://localhost`, locale English và app name Laravel. Nếu sao chép nguyên trạng sang production, exception có thể lộ stack/config và URL media sai.

Khuyến nghị: production deployment template riêng với `APP_DEBUG=false`, HTTPS URL, key/secret rotation, trusted proxy/host và logging phù hợp.

### Low – Bank account config trong source defaults

Thông tin nhận chuyển khoản không phải credential bí mật và đã hiển thị công khai ở frontend, nhưng hard-coded default có rủi ro vận hành khi đổi tài khoản. Payment metadata snapshot là điểm tốt.

Khuyến nghị: production bắt buộc inject qua secret/config management; có quy trình xác minh QR và số tài khoản trước release.

## 5. Authorization findings

### Điểm tốt

- Customer routes dùng `auth:sanctum`.
- Admin routes dùng cả `auth:sanctum` và `EnsureAdmin`.
- Admin mutation Form Requests kiểm tra lại `user()->isAdmin()`.
- `OrderPolicy` bảo vệ view/cancel và chống customer xem đơn của người khác.
- Admin customer update không cho đổi password/role, hạn chế privilege escalation.
- Product delete chuyển inactive; coupon đã dùng chuyển inactive; customer không bị xóa, bảo toàn dữ liệu lịch sử.

### Khoảng trống

- Chỉ Order có Policy; Address/Cart dựa vào kiểm tra ownership trong controller/service.
- Admin/staff chia sẻ toàn quyền; không có quyền theo module/action.
- Không có audit log cho admin product/category/coupon/order/customer changes.
- Admin order state transition chưa enforce transition graph.

## 6. Validation findings

### Điểm tốt

- Auth, catalog filter, cart, checkout, order và admin mutations đã có validation rõ.
- Product ID/quantity/order item được giới hạn và distinct.
- Backend không tin price/subtotal/discount/shipping/total từ frontend khi tạo order.
- Coupon code normalize, ngày/limit/type/value được kiểm tra.
- Upload kiểm tra loại và kích thước.
- Pagination phần lớn giới hạn tối đa 50.

### Khoảng trống

- `AddressController` vẫn dùng rules nội tuyến; phone chỉ là string max 20, yếu hơn checkout phone regex.
- Public shipping/coupon quote nhận subtotal từ client. Điều này chấp nhận được cho preview, nhưng response không được coi là cam kết; order service đã tính lại đúng.
- Order `shipping_method_id` là nullable nên order có thể có shipping fee 0 nếu client bỏ qua, dù checkout preview bắt buộc shipping method.
- Chưa validate transition hợp lệ giữa các order/payment statuses.
- Admin order update có thể đánh dấu `paid` mà không có reconciliation evidence/reference.

## 7. Mass assignment findings

Không phát hiện endpoint nào truyền trực tiếp toàn bộ request vào `create()`/`update()` mà không validate.

Điểm cần lưu ý:

- `User` fillable chứa `role`. Register hiện chỉ dùng `RegisterRequest::validated()` nên client không thể tự cấp role, nhưng fillable này làm tăng rủi ro nếu code tương lai dùng `$request->all()`.
- `Order` fillable chứa user ID, totals và statuses; hiện OrderService truyền mảng backend tự dựng.
- Các model khác có fillable giới hạn hợp lý.

Khuyến nghị: bỏ `role` khỏi general user fillable hoặc dùng method/admin DTO riêng; tiếp tục cấm request mass assignment trực tiếp.

## 8. Sensitive data exposure

### Điểm tốt

- `User` ẩn password và remember token.
- Auth response chỉ trả id/name/email; không trả role/token hash.
- Payment response không trả credential bí mật; bank account là thông tin nhận tiền công khai.
- Public product/category Resources không trả field quản trị nhạy cảm ngoài dữ liệu catalog cần thiết.
- Order detail được policy bảo vệ.

### Rủi ro còn lại

- Order/customer admin responses chứa PII đầy đủ; đúng mục đích quản trị nhưng chưa có audit log, retention/masking hoặc field-level permission.
- `showCustomer` tải toàn bộ order của customer không pagination, tăng phạm vi PII response.
- Contact submissions chứa PII nhưng chưa có retention/access workflow.
- Log policy chưa chứng minh việc redaction token, email, phone, address và payment metadata.

## 9. Performance and query findings

### N+1 đã được kiểm soát

- Product list/detail/related/new/best eager load category.
- Cart eager load product.category.
- Checkout preview eager load product.
- Customer order list eager load items/payment.
- Admin orders eager load items/payment/user.
- Admin products eager load category.
- Category admin list dùng `withCount`.

Không thấy N+1 rõ ràng trong các collection response chính.

### Điểm cần cải thiện

- Public `GET /api/products` không truyền page/per_page sẽ trả toàn bộ catalog để giữ compatibility. Khi catalog tăng, memory/response time sẽ tăng tuyến tính.
- Public category/policy/banner list không pagination/cache; hiện dữ liệu dự kiến nhỏ.
- `showCustomer` tải toàn bộ addresses và orders không pagination.
- Dashboard chạy nhiều aggregate query mỗi request và chưa cache.
- Search dùng `%term%` trên name/description/SKU; B-tree index không tối ưu leading wildcard/full-text search.
- Coupon per-user limit gọi `count()` mỗi validation; có thể cần composite index `(coupon_id,user_id)` khi usage lớn.
- `coupon_usages` chưa có unique `order_id` hoặc composite indexes phục vụ per-user count.
- Orders có index `(user_id,created_at)`, status và payment status; đây là điểm tốt.
- Product có index category/price, featured/is_new và status; đây là điểm tốt.

### Concurrency

- Order create/cancel và coupon use dùng transaction/row lock.
- Cart add/update khóa product, nhưng hai request add đồng thời cho cart item chưa tồn tại vẫn có thể đụng unique `(user_id,product_id)` và trả database exception thay vì retry/upsert có kiểm soát.
- SQLite test không mô phỏng đầy đủ MySQL/PostgreSQL row locking/deadlocks.
- Order number dùng timestamp + 3 chữ số random, có unique constraint nhưng không retry collision.

## 10. API consistency findings

API đang hoạt động nhưng contract chưa thống nhất hoàn toàn:

- Một số endpoint dùng API Resource (`Product`, `Order`, `Cart`), số khác trả model/paginator trực tiếp (`Admin`, `Address`, content APIs).
- Success envelope có dạng `{data: ...}`, `{user,token}`, `{message,order,payment}` hoặc raw Laravel paginator.
- Create status code có nơi 200, có nơi 201; delete có nơi 200, nơi 204.
- Invalid coupon public giữ message-only 422 để tương thích, trong khi validation khác trả `message + errors`.
- Chưa có API versioning hoặc OpenAPI schema.
- Timestamp/date serialization chưa được chuẩn hóa rõ timezone; app timezone hiện UTC trong khi nghiệp vụ Việt Nam.

Khuyến nghị: tài liệu hóa contract hiện có trước, sau đó version `/api/v1` nếu chuẩn hóa breaking changes.

## 11. Error handling findings

### Điểm tốt

- `bootstrap/app.php` ép JSON cho `api/*`.
- Laravel validation trả 422 có errors; auth/authorization trả 401/403.
- Order/cart/coupon business errors dùng `ValidationException` và transaction rollback.
- Ownership/routing failures dùng 403/404 thay vì exception nội bộ.

### Khoảng trống

- Chưa có machine-readable error code/envelope thống nhất.
- Chưa có correlation/request ID trong response/log.
- Chưa có handler riêng cho unique collision/deadlock/order-number collision.
- Khi `APP_DEBUG=true`, lỗi bất ngờ có thể lộ stack trace.
- Một số business error gắn vào field tổng quát (`items`, `cart`, `status`) và chưa có error taxonomy.

## 12. Rate limiting matrix

| Nhóm | Hiện tại | Đánh giá |
|---|---|---|
| Login/Register | 5 request/phút | Có, cần limiter theo IP + identity và trusted proxy |
| Contact | 5 request/phút | Có, vẫn nên thêm CAPTCHA/spam scoring |
| Catalog/content | Không limiter riêng | Chấp nhận khi có CDN/cache; cần chống scraping/abuse ở edge |
| Coupon/Shipping quote | Không | Nên thêm |
| Cart/Checkout | Không | Nên thêm theo user |
| Create/Cancel order | Không | Ưu tiên cao |
| Admin CRUD/upload | Không | Ưu tiên cao, đặc biệt upload |

## 13. Technical debt

- `AdminController` đang gom dashboard và 5 module, kích thước lớn; nên tách theo bounded controller/service.
- `AddressController` và `CommerceController` còn inline validation/response mapping.
- Chưa có OrderTransitionService/status history.
- Chưa có API versioning/OpenAPI/contract tests.
- Chưa có PHPStan/Larastan.
- Chưa có coverage threshold, mutation testing hoặc query-count assertions.
- Chưa có MySQL/PostgreSQL integration/concurrency tests.
- Chưa có idempotency key cho create order.
- Chưa có queue notification, reconciliation, backup/restore automation hoặc observability metrics.
- APP name/locale/timezone vẫn mang default Laravel/English/UTC trong template/config.
- Một migration Phase 2 tạo nhiều bảng/module trong một file, làm rollout/rollback và lock analysis khó hơn.

## 14. Remaining risks theo mức độ

### Critical

1. Migration Phase 2 và Cart vẫn Pending trên database ứng dụng.

### High

1. Admin status update có thể bypass stock/coupon side effects của cancel/return.
2. Sanctum token không hết hạn.
3. Chưa rate-limit order/cart/checkout/admin mutations.
4. Chưa concurrency-test trên database production.

### Medium

1. Staff có toàn quyền admin, chưa permission matrix/MFA/audit log.
2. Order create chưa có idempotency key.
3. API/error contract chưa thống nhất/versioned.
4. Public unpaginated product compatibility path.
5. PII retention/log redaction chưa được chứng minh.
6. Production environment/trusted proxy/CORS/security headers chưa được harden trong repo.
7. Cart concurrent first-add và order-number collision chưa có retry strategy.

### Low

1. App locale/timezone/name chưa theo Daisy/Việt Nam.
2. Dashboard chưa cache.
3. Media cleanup/reorder chưa có.

## 15. Recommendations ưu tiên

### Trước production

1. Backup và dry-run hai migration Pending trên bản sao production; xác nhận rollback/restore.
2. Buộc mọi order transition có side effect đi qua một service; không update thẳng `cancelled/returned`.
3. Thiết lập Sanctum expiration, revoke strategy và admin MFA/least privilege.
4. Thêm named rate limiters cho order/cart/checkout/coupon/admin/upload.
5. Đặt production env: debug off, HTTPS URL, trusted proxies/hosts, CORS allowlist, secure session/cookie settings.
6. Chạy integration test trên DB production engine, gồm concurrent checkout/coupon/cart và deadlock retry.
7. Thêm idempotency key cho create order.

### Ngắn hạn

1. Cài Larastan/PHPStan, bắt đầu level vừa phải và tăng dần trong CI.
2. Thêm indexes cho coupon usage queries sau khi đo query plan.
3. Pagination bắt buộc ở API version mới; pagination customer detail orders.
4. Chuẩn hóa error codes/API Resources và xuất OpenAPI.
5. Thêm audit log immutable cho admin/order/payment/stock/coupon.
6. Thêm query-count/performance tests cho catalog, cart, orders và admin.

### Vận hành

1. Monitoring p95/p99 latency, 4xx/5xx, failed login, stock conflict, deadlock và queue failures.
2. Redact token/PII trong log; xác định retention cho orders, contacts và customer data.
3. Backup database/media và diễn tập restore.
4. Xác minh định kỳ thông tin ngân hàng/QR và quy trình đối soát thủ công.

## 16. Final status

| Hạng mục | Kết quả |
|---|---|
| Feature tests | Pass – 49 tests, 259 assertions |
| Route loading | Pass – 60 routes |
| Composer validation | Pass |
| Laravel Pint | Pass |
| PHPStan | Chưa cài |
| N+1 review | Không thấy N+1 rõ ràng ở collection chính |
| Authorization | Cơ bản tốt; còn staff/admin granularity và transition bypass |
| Production readiness | Chưa đạt do pending migrations và các High findings |

Phase 12 kết thúc tại audit này. Không chuyển sang Phase 13 và không thực hiện thay đổi tính năng.
