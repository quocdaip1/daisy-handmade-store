# Backend Improvement Report – Phase 1

Ngày thực hiện: 11/07/2026

## Phạm vi

Chỉ sửa lỗi backend hiện có theo Phase 1. Không sửa frontend, không tạo tính năng nghiệp vụ mới, không tạo migration và không thay đổi database schema. API success response hiện tại được giữ nguyên.

## Các lỗi đã sửa

### 1. Sanctum token runtime

**Lỗi:** `AuthController` gọi `$user->createToken()` nhưng `User` chưa dùng `Laravel\Sanctum\HasApiTokens`. Trait bị import nhầm trong controller và không có tác dụng.

**Sửa:**

- Thêm `HasApiTokens` vào model `User`.
- Xóa import trait không dùng khỏi `AuthController`.

**Kết quả:** register/login có thể phát hành personal access token; `/api/me` xác thực Bearer token hoạt động trong feature test.

### 2. Order trừ kho một phần

**Lỗi:** controller trừ stock ngay trong lúc duyệt từng item. Nếu item sau không đủ tồn, item trước đã bị trừ dù request trả 422.

**Sửa:**

- Bọc xử lý trong `DB::transaction`.
- Tải toàn bộ product một lần và dùng `lockForUpdate`.
- Kiểm tra stock của toàn bộ items trước khi decrement bất kỳ product nào.
- Chỉ bắt đầu trừ stock sau khi tất cả item hợp lệ.

**Kết quả:** test xác nhận item không đủ tồn không làm thay đổi stock của bất kỳ item nào.

### 3. Race condition tồn kho

**Lỗi:** luồng cũ đọc stock rồi decrement không khóa row, tạo nguy cơ oversell khi có request đồng thời.

**Sửa:** khóa các product row liên quan trong transaction bằng `lockForUpdate`.

**Giới hạn:** SQLite có cơ chế lock khác MySQL/PostgreSQL. Cần có concurrency integration test trên database production trước khi phát hành tải cao.

### 4. Validation order chưa đủ

Đã bổ sung mà không đổi payload:

- `items`: tối đa 50 dòng.
- `product_id`: integer, `distinct`, `exists:products,id`.
- `quantity`: từ 1 đến 1000.
- Giới hạn độ dài name, email, phone và shipping address.

Điều này ngăn product trùng, product không tồn tại và payload quá lớn trước khi vào transaction.

### 5. Dependency không tương thích PHP

**Lỗi:** `composer.json` cho phép PHP `^8.3`, nhưng lockfile/vendor đang chứa Symfony 8 yêu cầu PHP ≥8.4. Artisan không thể khởi động trên PHP 8.3.30.

**Sửa:** chạy Composer update theo constraint hiện có. Các package Symfony được đưa về nhánh 7.4 tương thích PHP 8.3; thêm polyfill PHP 8.3. Không thay đổi constraint ứng dụng hoặc database.

Kết quả môi trường sau đồng bộ:

- PHP 8.3.30.
- Laravel 13.19.0 theo constraint `^13.8`.
- Symfony components 7.4 thay cho 8.0.
- Không có security vulnerability advisory từ Composer.

### 6. Code style tồn tại trước đó

Xóa import `Category` không dùng trong `ProductController`, giúp Pint đạt.

## Test đã bổ sung

### `AuthApiTest`

- Register tạo user và token.
- Login và gọi `/api/me` bằng token.
- Sai thông tin đăng nhập trả 401.
- `/api/me` không xác thực trả 401.

### `OrderApiTest`

- `/api/orders` yêu cầu authentication.
- Order hợp lệ tính đúng tổng và trừ đúng stock.
- Item không đủ stock không làm giảm stock item khác.
- Product trùng bị từ chối.
- Product không tồn tại bị từ chối.

## Kết quả kiểm tra

### PHPUnit

```text
11 tests passed
44 assertions
Exit code: 0
```

### Laravel Pint

```text
Result: passed
Exit code: 0
```

### Composer

```text
composer.json is valid
No security vulnerability advisories found
```

### Laravel runtime

- Artisan khởi động thành công với PHP 8.3.30.
- `artisan route:list` nạp thành công 13 route framework/application.
- Environment hiện tại: local, SQLite, database cache/session/queue, mail log.

## API compatibility

- Không đổi route.
- Không đổi request field hiện có.
- Không đổi cấu trúc success response của register, login, me hoặc order.
- Validation product không tồn tại nay trả 422 thay vì lỗi `findOrFail` trong quá trình xử lý; đây là sửa lỗi validation có chủ đích.
- Message thiếu stock vẫn giữ nội dung và status 422.

## Database

- Không tạo migration.
- Không đổi schema.
- Test dùng database test thông qua `RefreshDatabase`; không reset database ứng dụng.
- Order vẫn chưa persistence vì việc này bắt buộc thiết kế bảng/migration và nằm ngoài giới hạn sửa lỗi hiện tại.

## File đã sửa

- `backend/app/Models/User.php`
- `backend/app/Http/Controllers/Api/AuthController.php`
- `backend/app/Http/Controllers/Api/OrderController.php`
- `backend/app/Http/Controllers/Api/ProductController.php`
- `backend/composer.lock`
- `backend/tests/Feature/AuthApiTest.php`
- `backend/tests/Feature/OrderApiTest.php`
- `docs/backend-improvement-report.md`

Composer cũng đồng bộ thư mục `backend/vendor` cục bộ theo lockfile; vendor không phải source ứng dụng.

## Các mục Phase 1 chưa thực hiện do giới hạn yêu cầu

Các mục sau là tính năng hoặc cần đổi schema/API nên chưa làm:

- Logout/revoke token, token expiry và abilities.
- Rate limit riêng cho auth/order.
- Thống nhất guest checkout với frontend.
- Order/order item persistence.
- Idempotency key.
- Form Request/API Resource và chuẩn hóa error envelope.
- Sửa media pipeline/seeder path.
- Đổi APP_NAME, locale, timezone.

Các mục này nên được xác nhận phạm vi riêng trước khi triển khai tiếp.

# Phase 2

## 1. Hạng mục đã thực hiện

- Catalog query: search, category, min/max price, featured, is_new, sort và pagination tùy chọn.
- Giữ backward compatibility: không gửi `page/per_page` vẫn nhận `{data: [...]}` như API cũ.
- Order persistence với orders, order_items, payment snapshot và snapshot sản phẩm.
- Lịch sử/chi tiết order của customer có ownership policy.
- Customer address CRUD và kiểm tra ownership.
- Coupon validation và áp dụng server-side khi tạo order.
- Shipping quote từ shipping method trong database.
- COD/bank transfer persistence ở order/payment.
- Contact submission có throttle.
- Public policy và banner APIs.
- Role customer/staff/admin, admin middleware và dashboard cơ bản.
- Admin product/category CRUD, product image upload, order/customer list và update order status.

## 2. API đã thêm hoặc hoàn thiện

- Hoàn thiện `GET /api/products` với filter/sort/pagination tùy chọn.
- `GET /api/orders`, `GET /api/orders/{order}`.
- `GET|POST|PUT|PATCH|DELETE /api/addresses` theo apiResource (không có show riêng).
- `POST /api/coupons/validate`.
- `POST /api/shipping/quote`.
- `POST /api/contacts`.
- `GET /api/policies`, `GET /api/policies/{slug}`.
- `GET /api/banners`.
- Admin: dashboard, customers, orders, update order, product/category CRUD chính và upload ảnh.

## 3. Route thay đổi

- Không xóa hoặc đổi tên route cũ.
- Tổng route Laravel hiện tại: **35**.
- Các route customer/admin mới được bảo vệ bởi `auth:sanctum`; admin thêm middleware `admin`.

## 4. Controller đã chỉnh sửa/tạo

- Chỉnh sửa `ProductController`, `OrderController`.
- Tạo `AddressController`, `CommerceController`, `AdminController`.

## 5. Form Request

- Tạo `StoreOrderRequest` cho payload order, payment, coupon và shipping.
- Các CRUD đơn giản hiện vẫn validate tại controller; nên tách tiếp thành Form Requests khi hoàn thiện admin CRUD.

## 6. API Resource

- Tạo `OrderResource` cho history/detail order.
- Response endpoint cũ `POST /orders` được giữ cấu trúc cũ để tương thích frontend.

## 7. Service

- Tạo `OrderService`: transaction, row lock, stock validation, coupon, shipping, order/items/payment persistence và stock decrement.

## 8. Policy và middleware

- Tạo `OrderPolicy` chống IDOR cho order detail.
- Tạo `EnsureAdmin`, đăng ký alias `admin` trong `bootstrap/app.php`.

## 9. Migration

- Tạo một migration additive: `2026_07_11_000001_add_phase_two_commerce_tables.php`.
- Bổ sung `users.role`; `products.sku/status` và index catalog.
- Tạo addresses, shipping_methods, coupons, orders, order_items, coupon_usages, payments, contacts, policies, banners.
- Migration có `up/down`, không xóa dữ liệu cũ và hiện **Pending**.
- Không chạy migration trên database ứng dụng vì chưa xác nhận backup/môi trường an toàn; không dùng `migrate:fresh`.

## 10. Test đã thêm/cập nhật

- Tạo `PhaseTwoApiTest` gồm catalog filter/pagination, address ownership, order persistence, payment/items, coupon, shipping, contact, policy và admin authorization.
- Test Phase 1 tiếp tục đạt, không bị bỏ qua hoặc xóa.

## 11. Kết quả test

```text
16 tests passed
73 assertions
Exit code: 0
```

## 12. Kết quả Pint

```text
Laravel Pint --test: passed
Exit code: 0
```

## 13. Kiểm tra khác

- `artisan route:list`: 35 routes, thành công.
- `artisan migrate:status`: migration Phase 2 Pending; các migration cũ Ran.
- `artisan config:clear`: thành công.
- `artisan cache:clear`: thành công.
- `composer validate --no-check-publish`: composer.json hợp lệ.

## 14. Hạng mục chưa hoàn thành và lý do

- Chưa chạy migration application: cần xác nhận backup và database target.
- Chưa có adapter GHN/GHTK/Viettel Post hoặc webhook tracking: cần credentials/spec nhà cung cấp.
- Chưa có payment gateway/webhook/reconciliation thực: cần ngân hàng/cổng thanh toán và secret.
- Chưa có admin CRUD đầy đủ cho coupon, shipping, contact, policy, banner; hiện có schema/public APIs và phần admin lõi. Cần UI/workflow phê duyệt trước khi mở endpoint quản trị.
- Chưa có delete category để tránh cascade xóa product hiện có.
- Chưa có media delete/reorder; chỉ upload append.
- Chưa có status history table cho order/shipment.
- Chưa enforce coupon `per_user_limit`; cần quyết định counting/cancel/refund semantics.
- Chưa queue contact notification; cần mail transport/recipient thật.
- Chưa thêm API versioning để không phá frontend hiện tại.

## 15. Rủi ro còn lại

- Migration lớn nên phải chạy thử trên bản sao database trước production.
- SQLite test không mô phỏng hoàn toàn row locking của MySQL/PostgreSQL.
- Admin dùng role string đơn giản, chưa có permission matrix chi tiết.
- Order number dùng timestamp + random suffix; unique constraint bảo vệ nhưng retry collision hiếm vẫn có thể phát sinh exception.
- Product upload cần chạy `storage:link` ở deployment và cấu hình URL/disk đúng.
- Public contact mới throttle theo IP mặc định, chưa có CAPTCHA/spam scoring.

## 16. Đề xuất Phase 3

- Không tự chuyển Phase 3 trong lần này.
- Khi được duyệt: tối ưu index theo query production, cache catalog/policy, queue email/media, observability và đo p95 trước khi tối ưu thêm.

# Phase 3 – Authentication & Authorization

## 1. Audit auth hiện tại

- Hệ thống dùng Laravel Sanctum personal access token, không dùng JWT.
- `User` đã có `HasApiTokens`; token lưu trong `personal_access_tokens` và password dùng cast `hashed`.
- `auth:sanctum` bảo vệ profile, logout, order, address và toàn bộ admin routes.
- Role hiện là string `customer`, `staff`, `admin`; `EnsureAdmin` cho phép staff/admin và trả 403 cho customer.
- `OrderPolicy` cho phép owner hoặc admin/staff xem order, chống IDOR.
- Response register/login/me đang được frontend sử dụng và được giữ nguyên.
- Trước Phase 3 chưa có logout, auth validation nằm trực tiếp trong controller và chưa có throttle riêng cho login/register.

## 2. Hạng mục đã thực hiện

- Tạo `LoginRequest`, `RegisterRequest`.
- Normalize email: trim và lowercase trước validation/query.
- Trim name khi register.
- Giới hạn email 255, password 6–72 ký tự để giữ tương thích frontend hiện tại.
- Giữ nguyên exact response `user: {id,name,email}` và token của register/login.
- Giữ nguyên exact response `/api/me`.
- Thêm `POST /api/logout`; chỉ revoke current access token, không đăng xuất thiết bị khác.
- Thêm throttle `5 requests/minute` cho login và register.
- Kiểm tra lại admin middleware và OrderPolicy bằng feature tests.

## 3. Authorization

- Customer gọi admin route: 403.
- Admin gọi admin route: thành công.
- Customer xem order của customer khác: 403.
- Admin/staff có thể xem order customer thông qua `OrderPolicy`.
- Route auth không có token: 401.
- Không thay đổi schema hoặc permission architecture trong Phase 3.

## 4. Route thay đổi

- Thêm `POST /api/logout` trong group `auth:sanctum`.
- `POST /api/login` và `POST /api/register` thêm middleware `throttle:5,1`.
- Không xóa, đổi tên hoặc đổi response route cũ.

## 5. File đã sửa/tạo

- `backend/app/Http/Controllers/Api/AuthController.php`
- `backend/app/Http/Requests/LoginRequest.php`
- `backend/app/Http/Requests/RegisterRequest.php`
- `backend/routes/api.php`
- `backend/tests/Feature/AuthApiTest.php`
- `backend/tests/Feature/PhaseTwoApiTest.php`
- `docs/backend-improvement-report.md`

## 6. Test đã bổ sung

- Login success và truy cập profile bằng bearer token.
- Login fail trả 401.
- Profile giữ exact response contract.
- Auth validation và normalize email/name.
- Logout revoke đúng current token, giữ token thiết bị khác.
- Unauthorized profile/logout trả 401.
- Customer vào admin route trả 403; admin được phép.
- Customer xem order người khác trả 403; admin được phép.

## 7. Kết quả kiểm tra

```text
php artisan test
20 tests passed
91 assertions
Exit code: 0
```

```text
vendor/bin/pint --test
Result: passed
Exit code: 0
```

- `artisan route:list --path=api`: 31 API routes, thành công.
- `artisan config:clear`: thành công.
- `composer validate`: hợp lệ (đã chạy trong chuỗi kiểm tra trước final test).
- PHP 8.3.30, Laravel 13.19.0, SQLite local.

## 8. Database và compatibility

- Không tạo migration mới trong Phase 3.
- Không thay đổi database schema.
- Không sửa frontend.
- Register/login/me response giữ nguyên.
- Logout là endpoint mới, không ảnh hưởng client hiện tại.
- Migration role từ Phase 2 vẫn phải được review/chạy an toàn trước khi role admin hoạt động trên database ứng dụng.

## 9. Rủi ro và việc còn lại

- `sanctum.expiration` vẫn `null`; cần quyết định token lifetime theo chính sách vận hành trước production.
- Chưa có email verification/password reset vì ngoài mục tiêu đăng nhập/đăng xuất/profile hiện tại.
- Role string đơn giản, chưa có permission matrix chi tiết; phù hợp phạm vi customer/admin hiện tại.
- Throttle dùng limiter mặc định; production nhiều proxy cần cấu hình trusted proxy/IP đúng.
- Frontend hiện chưa gọi logout endpoint; không sửa do yêu cầu cấm sửa frontend.
- Nên bổ sung scheduled cleanup token hết hạn sau khi xác định expiration.

# Phase 4 – Product & Category

## 1. Phạm vi đã hoàn thành

- Audit model, controller, route và contract API Product/Category hiện có.
- Chuẩn hóa response sản phẩm qua `ProductResource` và danh mục qua `CategoryResource`; giữ nguyên các field sản phẩm mà frontend hiện có thể sử dụng.
- Hoàn thiện danh sách và chi tiết sản phẩm published; sản phẩm draft không xuất hiện ở public API.
- Hoàn thiện tìm kiếm theo tên, mô tả, mô tả ngắn và SKU.
- Hoàn thiện lọc theo category ID, khoảng giá, `featured`, `is_new`.
- Hoàn thiện sort theo nổi bật, giá tăng/giảm, mới nhất, rating và tên.
- Giữ cách hoạt động tương thích: danh sách không truyền `page`/`per_page` trả collection; khi có pagination trả thêm metadata chuẩn của Laravel.
- Bổ sung danh sách/chi tiết danh mục, related products, new arrivals và best sellers.
- Không sửa frontend, không tạo migration và không thay đổi database schema.

## 2. Endpoint Product & Category

| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `/api/products` | List, search, filter, sort, pagination tùy chọn |
| GET | `/api/products/{slug}` | Chi tiết sản phẩm published |
| GET | `/api/products/{slug}/related` | Sản phẩm liên quan cùng danh mục |
| GET | `/api/products/new-arrivals` | Sản phẩm mới, có pagination |
| GET | `/api/products/best-sellers` | Sản phẩm nổi bật xếp theo rating, có pagination |
| GET | `/api/categories` | Danh sách danh mục |
| GET | `/api/categories/{slug}` | Chi tiết danh mục |

Query hỗ trợ: `search`, `category`, `min_price`, `max_price`, `featured`, `is_new`, `sort`, `page`, `per_page`. Related products hỗ trợ `limit` (tối đa 20).

> Database hiện chưa có dữ liệu doanh số theo sản phẩm, vì vậy “best sellers” dùng `featured` + `rating` làm tiêu chí đại diện. Không bổ sung schema ngoài phạm vi Phase 4.

## 3. Hiệu năng và validation

- Product list/detail/related/new/best seller đều eager load `category`, tránh N+1 khi serialize.
- Bộ lọc được gom thành query scopes tái sử dụng trên `Product`.
- `ProductIndexRequest` giới hạn độ dài search, kiểm tra category tồn tại, giá không âm, `max_price >= min_price`, sort whitelist, page hợp lệ và `per_page <= 50`.
- Route tĩnh new arrivals/best sellers và route related được khai báo trước route `{slug}`, tránh bị nhận nhầm thành slug sản phẩm.

## 4. Test đã bổ sung

- List chỉ trả sản phẩm published và đúng cấu trúc Resource.
- Detail trả category đã eager load và ẩn draft.
- Search.
- Filter category/khoảng giá và sort.
- Pagination metadata và validation đầu vào.
- Related products, new arrivals, best sellers, category list/detail.
- Toàn bộ test của Phase 1–3 tiếp tục chạy thành công.

## 5. File đã sửa/tạo

- `backend/app/Models/Product.php`
- `backend/app/Http/Controllers/Api/ProductController.php`
- `backend/app/Http/Controllers/Api/CategoryController.php`
- `backend/app/Http/Requests/ProductIndexRequest.php`
- `backend/app/Http/Resources/ProductResource.php`
- `backend/app/Http/Resources/CategoryResource.php`
- `backend/routes/api.php`
- `backend/tests/Feature/ProductApiTest.php`
- `docs/backend-improvement-report.md`

## 6. Kết quả kiểm tra

```text
php artisan test
25 tests passed
110 assertions
Exit code: 0
```

```text
vendor/bin/pint
Result: passed
Exit code: 0
```

- `artisan route:list --path=api/products`: 5 product routes, thành công.
- `artisan config:cache`: thành công.
- `artisan config:clear`: thành công; không để lại config cache sau kiểm tra.

## 7. Giới hạn Phase 4

- Không chuyển sang Phase 5.
- Không sửa frontend hoặc API quản trị ngoài các route có sẵn.
- Không bổ sung bảng sales aggregate; best seller chính xác theo số lượng bán cần dữ liệu order đã hoàn tất và là hạng mục tiếp theo khi được phê duyệt.

# Phase 5 – Cart System

## 1. Kết quả audit

- Trước Phase 5, backend không có model, bảng hoặc API giỏ hàng; cart chỉ được frontend lưu trong `localStorage`.
- Product là nguồn dữ liệu giá và tồn kho phù hợp; `price`, `stock`, `status` đã có cast/trường cần thiết.
- Cart API được bảo vệ bằng Sanctum và gắn trực tiếp với user đăng nhập để cô lập dữ liệu giữa các tài khoản.

## 2. API đã hoàn thiện

| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `/api/cart` | Lấy giỏ hàng hiện tại |
| POST | `/api/cart/items` | Thêm sản phẩm; cộng dồn nếu đã có |
| PATCH | `/api/cart/items/{cartItem}` | Cập nhật số lượng |
| DELETE | `/api/cart/items/{cartItem}` | Xóa một sản phẩm |
| DELETE | `/api/cart` | Xóa toàn bộ giỏ hàng |

Tất cả endpoint yêu cầu `auth:sanctum`. Item thuộc user khác không thể đọc/sửa/xóa qua route cart.

## 3. Tính đúng đắn và bảo mật nghiệp vụ

- Request add chỉ nhận `product_id` và `quantity`; mọi field giá gửi thêm từ client bị bỏ qua.
- `unit_price`, `line_total` và `subtotal` được tính từ `products.price` tại backend.
- Add/update kiểm tra sản phẩm đang `published` và số lượng không vượt `stock`.
- Quantity phải là số nguyên từ 1 đến 1000; product phải tồn tại.
- Add/update chạy trong transaction và khóa product bằng `lockForUpdate` trước khi kiểm tra tồn kho.
- Unique key `(user_id, product_id)` ngăn một sản phẩm xuất hiện thành nhiều dòng trong cùng giỏ.
- GET cart eager load `product.category`, tránh N+1 khi serialize Product Resource.
- Add vào cart không trừ tồn kho; tồn kho chỉ được xác nhận lại và trừ trong checkout/order transaction.

## 4. Database

- Thêm migration additive `2026_07_11_000002_create_cart_items_table.php`.
- Bảng `cart_items`: `user_id`, `product_id`, `quantity`, timestamps và unique composite.
- Foreign key cascade khi user/product bị xóa; migration có `down()`.
- Không chạy migration trên database ứng dụng. Migration Phase 2 và Phase 5 hiện vẫn `Pending`; test dùng `RefreshDatabase` trên database test.

## 5. Test Phase 5

- Add success, xác nhận backend bỏ qua giá client và tính subtotal đúng.
- Add out of stock trả 422 và không tạo cart item.
- Update quantity thành công; update vượt stock trả 422 và giữ quantity trước đó.
- Remove item và chống truy cập item của user khác.
- Clear cart chỉ xóa item của user hiện tại.
- Cart không xác thực trả 401.

## 6. File đã sửa/tạo

- `backend/database/migrations/2026_07_11_000002_create_cart_items_table.php`
- `backend/app/Models/CartItem.php`
- `backend/app/Models/User.php`
- `backend/app/Http/Requests/StoreCartItemRequest.php`
- `backend/app/Http/Requests/UpdateCartItemRequest.php`
- `backend/app/Http/Resources/CartResource.php`
- `backend/app/Services/CartService.php`
- `backend/app/Http/Controllers/Api/CartController.php`
- `backend/routes/api.php`
- `backend/tests/Feature/CartApiTest.php`
- `docs/backend-improvement-report.md`

## 7. Kết quả kiểm tra

```text
php artisan test
31 tests passed
136 assertions
Exit code: 0
```

```text
vendor/bin/pint --test
Result: passed
Exit code: 0
```

- `artisan route:list --path=api/cart`: 5 cart routes, thành công.
- `artisan migrate:status`: migration mới được nhận diện và đang Pending.
- `artisan config:cache`: thành công.
- `artisan config:clear`: thành công; không để lại config cache sau kiểm tra.

## 8. Giới hạn Phase 5

- Không sửa frontend; frontend localStorage chưa được chuyển sang các endpoint mới.
- Không tự động merge cart khách chưa đăng nhập vào cart tài khoản.
- Không giữ chỗ tồn kho khi add cart; checkout vẫn là điểm quyết định tồn kho cuối cùng.
- Không chuyển sang Phase 6.

# Phase 6 – Voucher System

## 1. Kết quả audit

- Schema Phase 2 đã có `coupons`, `coupon_usages`, `orders.coupon_id`, `used_count`, global/per-user limit và thời gian hiệu lực.
- Trước Phase 6, `Coupon::isAvailable()` đã kiểm tra active, minimum amount, ngày và global limit nhưng chưa kiểm tra `per_user_limit`.
- Endpoint validate và checkout tự triển khai logic riêng; public validation không biết lịch sử user.
- Checkout đã ghi usage và tăng `used_count`, nhưng dùng insert trực tiếp và chưa có model/relationship cho lịch sử coupon.
- Validation `exists` trong order còn phân biệt hoa/thường và chạy trước bước normalize code.

## 2. Hạng mục đã hoàn thiện

- Tạo `CouponService` làm nguồn business rule chung cho API validate và checkout.
- Tạo `CouponController` riêng; giữ nguyên `POST /api/coupons/validate` và contract response cũ.
- Tạo `ValidateCouponRequest`, normalize mã bằng trim + uppercase và giới hạn độ dài 50 ký tự.
- Normalize `coupon_code` trong `StoreOrderRequest`; coupon không tồn tại được xử lý thống nhất ở service.
- Tạo `CouponUsage` model cùng quan hệ `Coupon::usages()`.
- Checkout tiếp tục khóa coupon bằng `lockForUpdate` trong order transaction trước khi kiểm tra và ghi usage.
- Tracking tạo `coupon_usages` và tăng `used_count` trong cùng transaction với order.

## 3. Business rules

- `percent`: phần trăm được giới hạn tối đa 100%, tính bằng số nguyên VND.
- `fixed`: giảm số tiền cố định.
- Discount không bao giờ vượt subtotal.
- Coupon phải active.
- `starts_at`: coupon chỉ hợp lệ từ thời điểm bắt đầu.
- `expires_at`: coupon hết hiệu lực sau thời điểm kết thúc.
- Subtotal phải đạt `minimum_amount`.
- `used_count` phải nhỏ hơn `usage_limit` nếu có giới hạn toàn hệ thống.
- Số bản ghi usage của user phải nhỏ hơn `per_user_limit` nếu có giới hạn theo user.
- API public vẫn dùng được không cần đăng nhập; khi request có Sanctum user, per-user limit cũng được kiểm tra.

## 4. Tương thích API

- Không đổi route `POST /api/coupons/validate`.
- Success response giữ nguyên: `{data: {code, discount}}`.
- Coupon không hợp lệ giữ status 422 và message cũ: `{message: "Mã giảm giá không hợp lệ."}`.
- Không sửa frontend.
- Không tạo migration hoặc thay đổi database schema trong Phase 6.

## 5. Test Phase 6

- Valid percentage coupon và normalize code.
- Valid fixed coupon; discount được cap theo subtotal.
- Expired coupon.
- Coupon chưa đến ngày bắt đầu.
- Minimum order fail.
- Global usage limit exceeded.
- Checkout ghi coupon usage, tăng `used_count`, tính total đúng.
- Per-user limit từ chối lần dùng tiếp theo.
- Toàn bộ test Phase 1–5 tiếp tục đạt.

## 6. File đã sửa/tạo

- `backend/app/Models/Coupon.php`
- `backend/app/Models/CouponUsage.php`
- `backend/app/Http/Controllers/Api/CouponController.php`
- `backend/app/Http/Controllers/Api/CommerceController.php`
- `backend/app/Http/Requests/ValidateCouponRequest.php`
- `backend/app/Http/Requests/StoreOrderRequest.php`
- `backend/app/Services/CouponService.php`
- `backend/app/Services/OrderService.php`
- `backend/routes/api.php`
- `backend/tests/Feature/CouponApiTest.php`
- `docs/backend-improvement-report.md`

## 7. Kết quả kiểm tra

```text
php artisan test
36 tests passed
153 assertions
Exit code: 0
```

```text
vendor/bin/pint --test
Result: passed
Exit code: 0
```

- `artisan route:list --path=api/coupons`: route validate được nhận diện thành công.
- `artisan config:cache`: thành công.
- `artisan config:clear`: thành công; không để lại config cache sau kiểm tra.

## 8. Giới hạn Phase 6

- Chưa thêm admin CRUD voucher vì ngoài mục tiêu Phase 6.
- Chưa thay đổi quy tắc hoàn usage khi hủy/refund order; cần workflow trạng thái đơn thống nhất trước khi triển khai.
- Không chuyển sang Phase 7.

# Phase 8 – Checkout Preview

## 1. Phạm vi đã hoàn thành

- Thêm preview checkout cho user đã đăng nhập dựa trên cart server-side.
- Preview chỉ tính toán và trả kết quả; không tạo order, order item, payment hoặc coupon usage, không trừ stock và không clear cart.
- Không sửa frontend, API cũ hoặc database schema.

## 2. API

| Method | Endpoint | Auth | Chức năng |
|---|---|---:|---|
| POST | `/api/checkout/preview` | Sanctum | Validate checkout và trả bản tính subtotal/discount/shipping/grand total |

Payload nhận một trong hai dạng địa chỉ:

- `address_id`: địa chỉ đã lưu và phải thuộc user hiện tại.
- `address`: object gồm `name`, `phone`, `city`, `district`, `address`.

Ngoài ra nhận `shipping_method_id` bắt buộc và `coupon_code` tùy chọn. Các field subtotal/discount/shipping fee/total gửi thêm từ frontend không được dùng.

## 3. Tính toán backend

- Tải cart items của user và eager load Product.
- Từ chối cart trống.
- Kiểm tra lại trạng thái published và tồn kho của từng sản phẩm.
- `subtotal = sum(product.price × cart_item.quantity)` từ database.
- Coupon dùng chung `CouponService`, bao gồm ngày hiệu lực, minimum amount, global/per-user limit.
- Shipping method phải tồn tại và active; phí dùng `ShippingMethod::quote(subtotal - discount)`.
- `grand_total = subtotal - discount + shipping_fee`.
- Preview không nhận hoặc tin bất kỳ giá/tổng tiền nào từ frontend.

## 4. Validation địa chỉ

- Address đã lưu được kiểm tra ownership; ID của user khác trả 422 và không làm lộ dữ liệu địa chỉ.
- Địa chỉ nhập trực tiếp yêu cầu đầy đủ họ tên, số điện thoại, tỉnh/thành phố, quận/huyện và địa chỉ chi tiết.
- Giới hạn độ dài field và kiểm tra định dạng số điện thoại 8–20 ký tự hợp lệ.

## 5. Test Phase 8

- Checkout preview success và tính đúng subtotal, discount, shipping fee, grand total từ backend.
- Xác nhận total giả do frontend gửi không ảnh hưởng kết quả.
- Xác nhận preview không tạo order/coupon usage.
- Invalid/unowned address.
- Invalid coupon.
- Empty cart.
- Toàn bộ test các phase trước tiếp tục đạt.

## 6. File đã sửa/tạo

- `backend/app/Http/Requests/CheckoutPreviewRequest.php`
- `backend/app/Services/CheckoutPreviewService.php`
- `backend/app/Http/Controllers/Api/CheckoutController.php`
- `backend/routes/api.php`
- `backend/tests/Feature/CheckoutPreviewApiTest.php`
- `docs/backend-improvement-report.md`

## 7. Kết quả kiểm tra

```text
php artisan test
40 tests passed
170 assertions
Exit code: 0
```

```text
vendor/bin/pint --test
Result: passed
Exit code: 0
```

- `artisan route:list --path=api/checkout`: endpoint preview được nhận diện thành công.
- `artisan config:cache`: thành công.
- `artisan config:clear`: thành công; không để lại config cache sau kiểm tra.

## 8. Giới hạn Phase 8

- Preview không giữ chỗ tồn kho; order thật phải kiểm tra và khóa stock lại trong transaction.
- Preview không ghi nhận lượt dùng coupon.
- Không triển khai submit checkout/tạo order trong phase này.
- Không chuyển sang Phase 9.

# Phase 9 – Order Management

## 1. Phạm vi đã hoàn thành

- Hoàn thiện create order trên service transaction hiện có.
- Hoàn thiện order list với validation, pagination và filter theo status.
- Giữ order detail cùng ownership policy chống IDOR.
- Bổ sung customer/admin cancel order với policy và business rule trạng thái.
- Không sửa frontend, không tạo migration và không thay đổi response create order cũ.

## 2. API Order

| Method | Endpoint | Chức năng |
|---|---|---|
| POST | `/api/orders` | Tạo đơn hàng |
| GET | `/api/orders` | Danh sách đơn của user, hỗ trợ `status`, `page`, `per_page` |
| GET | `/api/orders/{order}` | Chi tiết đơn theo ownership policy |
| POST | `/api/orders/{order}/cancel` | Hủy đơn hợp lệ |

Tất cả route yêu cầu `auth:sanctum`. Customer chỉ xem/hủy đơn của mình; admin/staff vẫn được policy cho phép.

## 3. Create order

- Toàn bộ product validation, coupon, order/items/payment, trừ kho, coupon usage và cart cleanup chạy trong một database transaction.
- Product rows được khóa bằng `lockForUpdate` trước khi kiểm tra và trừ stock.
- Chỉ chấp nhận sản phẩm `published` và đủ tồn kho.
- Giá, subtotal, discount, shipping fee và total lấy/tính từ backend.
- Coupon được khóa và kiểm tra lại bằng `CouponService`, sau đó ghi usage trong cùng transaction.
- Cart server-side của user chỉ được clear sau khi order/items/payment và tracking coupon đã tạo thành công.
- Nếu bất kỳ bước nào lỗi, order không được tạo, stock/coupon/cart được rollback.

## 4. Cancel order

- Chỉ order ở trạng thái `pending` hoặc `confirmed` được hủy.
- Order và các product liên quan được khóa trong transaction.
- Tồn kho của từng order item được hoàn lại.
- Coupon usage của order được xóa và `used_count` giảm an toàn.
- Status chuyển sang `cancelled`; hủy lặp hoặc hủy ở trạng thái muộn bị từ chối.
- Snapshot order item vẫn được giữ nguyên phục vụ lịch sử/audit.

## 5. Status chuẩn hóa

Order statuses:

- `pending`
- `confirmed`
- `preparing`
- `shipping`
- `completed`
- `cancelled`
- `returned`

Payment statuses:

- `unpaid`
- `pending_verification`
- `paid`
- `failed`
- `refunded`

Đơn COD mới có payment status `unpaid`; bank transfer có `pending_verification`. Admin update validation dùng chung constants trên model để tránh lệch danh sách trạng thái.

## 6. Test Phase 9

- Create order success, trừ đúng stock, persist status/payment status và clear cart.
- Out of stock không trừ bất kỳ stock nào.
- Invalid coupon không tạo order hoặc trừ stock.
- Cancel order hoàn stock và coupon usage; không cho hủy lặp.
- Owner list/view order; customer khác bị 403.
- Các test coupon tracking, authorization và phase trước tiếp tục đạt.

## 7. File đã sửa/tạo

- `backend/app/Models/Order.php`
- `backend/app/Policies/OrderPolicy.php`
- `backend/app/Services/OrderService.php`
- `backend/app/Services/CouponService.php`
- `backend/app/Http/Requests/OrderIndexRequest.php`
- `backend/app/Http/Controllers/Api/OrderController.php`
- `backend/app/Http/Controllers/Api/AdminController.php`
- `backend/routes/api.php`
- `backend/tests/Feature/OrderApiTest.php`
- `docs/backend-improvement-report.md`

## 8. Kết quả kiểm tra

```text
php artisan test
43 tests passed
190 assertions
Exit code: 0
```

```text
vendor/bin/pint --test
Result: passed
Exit code: 0
```

- `artisan route:list --path=api/orders`: 4 customer order routes, thành công.
- `artisan config:cache`: thành công.
- `artisan config:clear`: thành công; không để lại config cache sau kiểm tra.

## 9. Giới hạn Phase 9

- Chưa thêm order status history/audit table vì cần migration và workflow riêng.
- Chưa triển khai return workflow hoặc logic hoàn kho/payment cho `returned`; phase này chỉ chuẩn hóa status cho quản trị.
- Cancel chưa gửi notification vì mail/queue workflow nằm ngoài Phase 9.
- Không chuyển sang Phase 10.

# Phase 10 – Payment

## 1. Phạm vi đã hoàn thành

- Hoàn thiện hai phương thức thanh toán hiện có: COD và chuyển khoản ngân hàng thủ công.
- Không tích hợp cổng thanh toán online, webhook hoặc tự động xác nhận giao dịch.
- Không sửa frontend, route hoặc database schema.
- Response create order cũ được giữ nguyên và bổ sung field `payment` theo hướng additive.

## 2. COD

- Request dùng `payment_method: cod` hoặc bỏ trống để dùng mặc định COD.
- Order và payment được lưu với status `unpaid`.
- Response payment gồm `method`, `status`, `amount`.
- COD không lưu metadata ngân hàng.

## 3. Bank Transfer

- Request dùng `payment_method: bank_transfer`.
- Order và payment được lưu với status `pending_verification`.
- Backend tạo nội dung chuyển khoản duy nhất theo format `{prefix} {order_number}`.
- Response trả:
  - `bank_name`
  - `account_number`
  - `account_owner`
  - `transfer_content`
  - `qr_image_url` (nullable nếu chưa cấu hình)
- Toàn bộ hướng dẫn chuyển khoản được snapshot trong `payments.metadata`, giúp order detail giữ đúng thông tin tại thời điểm đặt hàng.
- Nếu cấu hình ngân hàng bắt buộc bị thiếu, transaction bị từ chối và rollback thay vì tạo đơn không có hướng dẫn thanh toán.

## 4. Cấu hình

Thêm `config/payments.php` và các biến môi trường:

```text
BANK_TRANSFER_BANK_NAME
BANK_TRANSFER_ACCOUNT_NUMBER
BANK_TRANSFER_ACCOUNT_OWNER
BANK_TRANSFER_CONTENT_PREFIX
BANK_TRANSFER_QR_IMAGE_URL
```

Giá trị mặc định trong `.env.example` đồng bộ thông tin chuyển khoản đang hiển thị trên checkout hiện tại: MB Bank, tài khoản Daisy Handmade Store. QR URL để trống và chỉ trả URL khi deployment cấu hình ảnh QR thật.

## 5. API response

Create order bổ sung top-level `payment` mà không xóa/thay đổi `message` hoặc `order` cũ. Order list/detail eager load payment và `OrderResource` trả cùng cấu trúc payment, bao gồm snapshot bank transfer.

Ví dụ bank transfer:

```json
{
  "payment": {
    "method": "bank_transfer",
    "status": "pending_verification",
    "amount": 350000,
    "bank_name": "MB Bank",
    "account_number": "0349671134",
    "account_owner": "DAISY HANDMADE STORE",
    "transfer_content": "DAISY DS20260711...",
    "qr_image_url": null
  }
}
```

## 6. Test Phase 10

- COD order tạo payment `unpaid`, đúng amount và không có metadata ngân hàng.
- Bank transfer order tạo payment `pending_verification`.
- Response bank transfer có đủ ngân hàng, tài khoản, chủ tài khoản, nội dung và QR URL.
- Payment metadata snapshot đúng nội dung chuyển khoản theo mã order.
- Order detail trả lại đúng hướng dẫn chuyển khoản.
- Toàn bộ test Phase 1–9 tiếp tục đạt.

## 7. File đã sửa/tạo

- `backend/config/payments.php`
- `backend/.env.example`
- `backend/app/Services/PaymentService.php`
- `backend/app/Services/OrderService.php`
- `backend/app/Http/Controllers/Api/OrderController.php`
- `backend/app/Http/Resources/OrderResource.php`
- `backend/tests/Feature/PaymentApiTest.php`
- `docs/backend-improvement-report.md`

## 8. Kết quả kiểm tra

```text
php artisan test
45 tests passed
208 assertions
Exit code: 0
```

```text
vendor/bin/pint --test
Result: passed
Exit code: 0
```

- `artisan config:cache`: thành công với cấu hình payment mới.
- `artisan route:list --path=api/orders`: 4 order routes hoạt động bình thường.
- `artisan config:clear`: thành công; không để lại config cache sau kiểm tra.

## 9. Giới hạn Phase 10

- Xác minh chuyển khoản vẫn là thao tác thủ công của admin.
- Không có webhook, reconciliation tự động, payment gateway hoặc sinh QR động theo amount/content.
- QR URL chỉ là ảnh được cấu hình; cần bảo đảm ảnh QR deployment khớp đúng tài khoản ngân hàng.
- Không chuyển sang Phase 11.

# Phase 11 – Admin System

## 1. Kết quả audit

- Admin routes đã được bảo vệ bởi `auth:sanctum` và middleware `admin`; role `admin`/`staff` được phép, customer nhận 403.
- Trước Phase 11 chỉ có dashboard cơ bản, customer/order list, order update, product create/update/deactivate/upload và category create/update.
- Thiếu product/category list-detail, category delete an toàn, coupon management, order detail, customer detail/update và validation Form Request riêng.
- Dashboard chưa có breakdown trạng thái, low stock, published product hoặc active coupon.

## 2. Authorization và validation

- Giữ lớp bảo vệ route `auth:sanctum` + `admin` cho toàn bộ `/api/admin/*`.
- Các mutation Product, Category, Coupon, Order và Customer dùng Form Request riêng; `authorize()` kiểm tra lại quyền admin/staff.
- Product validation gồm unique slug/SKU, category tồn tại, giá/tồn kho không âm, original price, giới hạn ảnh, rating và status whitelist.
- Category validation gồm unique slug và giới hạn nội dung.
- Coupon validation gồm unique normalized code, percent/fixed, percent tối đa 100, amount/limit dương và end date sau start date.
- Order/payment status dùng constants thống nhất trên `Order`.
- Customer update chỉ cho phép name/email; không cho admin tùy ý đổi password/role qua endpoint customer.
- List query giới hạn `per_page <= 50` và whitelist filter status.

## 3. Product Management

- List, search, filter status và pagination.
- Detail có category.
- Create/update với validation đầy đủ.
- Delete theo hướng bảo toàn dữ liệu: chuyển `status = inactive`, không xóa row có thể được order item tham chiếu.
- Upload gallery giữ validation ảnh, MIME, size và tối đa 8 ảnh mỗi request.
- `AdminProductResource` bổ sung SKU, status và timestamps ngoài contract public product.

## 4. Category Management

- List kèm `products_count`, detail, create, update và delete.
- Category đang có product không được xóa để tránh cascade mất catalog; API trả 422.
- Category trống được phép xóa.

## 5. Order Management

- List với filter order/payment status, pagination và eager loading items/payment/user.
- Detail order.
- Update status, payment status và tracking number.
- Khi admin đổi payment status, `orders.payment_status` và `payments.status` được đồng bộ trong transaction.

## 6. Customer Management

- List customer với search, pagination và `orders_count`.
- Detail customer kèm addresses, orders và order count.
- Update name/email với unique email validation.
- Không delete customer để bảo toàn order history và tránh foreign key restrict.

## 7. Coupon Management

- List/detail/create/update/delete voucher.
- Code được trim và uppercase trước validation/persistence.
- Voucher chưa sử dụng có thể xóa.
- Voucher đã có usage được chuyển `active = false` thay vì xóa lịch sử.

## 8. Dashboard Statistics

Dashboard trả:

- Doanh thu từ order đã paid.
- Tổng order và breakdown theo status.
- Tổng customer.
- Tổng product và published product.
- Số product published có stock <= 5.
- Số coupon active.

## 9. Admin routes

- Tổng cộng **23 routes** dưới `/api/admin`.
- Bao phủ dashboard; product, category, coupon CRUD; order list/detail/update; customer list/detail/update; product image upload.
- Các route cũ được giữ nguyên.

## 10. Test Phase 11

- Customer bị 403 ở toàn bộ nhóm admin chính; admin truy cập thành công.
- Product/category create, read, update, deactivate/delete và validation failure.
- Không cho xóa category đang có product.
- Coupon create/read/update/delete, normalize code và percent validation.
- Order detail/update và đồng bộ payment status.
- Customer detail/update.
- Dashboard structure đầy đủ.
- Toàn bộ test Phase 1–10 tiếp tục đạt.

## 11. File đã sửa/tạo

- `backend/app/Http/Controllers/Api/AdminController.php`
- `backend/app/Http/Requests/AdminProductRequest.php`
- `backend/app/Http/Requests/AdminCategoryRequest.php`
- `backend/app/Http/Requests/AdminCouponRequest.php`
- `backend/app/Http/Requests/AdminOrderUpdateRequest.php`
- `backend/app/Http/Requests/AdminCustomerUpdateRequest.php`
- `backend/app/Http/Resources/AdminProductResource.php`
- `backend/routes/api.php`
- `backend/tests/Feature/AdminSystemApiTest.php`
- `docs/backend-improvement-report.md`

## 12. Kết quả kiểm tra

```text
php artisan test
49 tests passed
259 assertions
Exit code: 0
```

```text
vendor/bin/pint --test
Result: passed
Exit code: 0
```

- `artisan route:list --path=api/admin`: 23 admin routes, thành công.
- `artisan config:cache`: thành công.
- `artisan config:clear`: thành công; không để lại config cache sau kiểm tra.

## 13. Giới hạn Phase 11

- Chưa thêm audit log/status history vì cần schema và workflow riêng.
- Chưa có bulk operations/import/export.
- Chưa có delete/reorder product media.
- Customer không bị xóa hoặc đổi role qua customer management để bảo toàn lịch sử và giới hạn privilege escalation.
- Không chuyển sang Phase 12.

# Frontend Integration Phase 6 – Checkout Preview Compatibility

- Mở rộng additive `CheckoutPreviewRequest` với optional `items[].product_id` và `items[].quantity`.
- Contract cũ giữ nguyên: không gửi items thì preview tiếp tục đọc backend cart.
- Khi frontend local cart gửi items, backend query Product theo ID, tự lấy price/status/stock và tự tính toàn bộ totals.
- Không nhận hoặc tin price/subtotal/discount/shipping fee/grand total frontend.
- Không tạo order, payment, coupon usage, không trừ stock và không clear cart.
- Không đổi route hoặc database schema.

Kiểm tra:

```text
CheckoutPreviewApiTest: 5 passed, 23 assertions
Laravel Pint related files: passed
```

File backend sửa:

- `app/Http/Requests/CheckoutPreviewRequest.php`
- `app/Services/CheckoutPreviewService.php`
- `tests/Feature/CheckoutPreviewApiTest.php`
