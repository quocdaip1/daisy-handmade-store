# Backend Audit – Daisy Handmade Store

Ngày audit: 11/07/2026  
Phạm vi: backend Laravel hiện tại, đối chiếu frontend, logo Daisy Handmade Store và `Checklist_Yeu_Cau_Website_Ban_Hang_1.xlsx`. Audit read-only; không chạy migration, không sửa database và không thay đổi code backend.

## 1. Kiến trúc hiện tại

Backend là Laravel 13.8, PHP yêu cầu `^8.3`, cung cấp JSON API cho frontend React. Sanctum 4.3 được cài để phát hành personal access token.

Luồng hiện tại:

```text
React frontend
  ├─ GET /api/products, /api/products/{slug}, /api/categories
  ├─ POST /api/register, /api/login
  └─ Bearer token → GET /api/me, POST /api/orders

Laravel routes → API Controllers → Eloquent Models → SQLite mặc định
```

Tổ chức code còn ở mức tối giản:

- Controller trực tiếp validate, query model, tính tổng và cập nhật tồn kho.
- Chưa có Form Request, Service, Repository, Policy, custom Middleware hoặc API Resource.
- Chưa có module admin.
- Queue được cấu hình và có bảng hệ thống nhưng chưa có Job nghiệp vụ.
- Filesystem dùng cấu hình Laravel mặc định; chưa có upload ảnh.

## 2. Các module đã hoàn thành

| Module | Trạng thái | Ghi chú |
|---|---|---|
| Authentication | Một phần, có lỗi tiềm ẩn | Có register/login/me và Sanctum route protection; thiếu trait token ở User, logout, reset password, verify email, throttle rõ ràng. |
| Product | Một phần | Có model, migration, seeder, list/detail API; chỉ read-only. |
| Category | Một phần | Có model, migration, seeder, list API; chỉ read-only. |
| Cart | Chỉ frontend | Cart lưu `localStorage`; backend không có cart/session cart API. |
| Order | Prototype, chưa hoàn chỉnh | Có POST `/api/orders`, kiểm tra tồn và tính tổng nhưng không lưu order/order items. |
| Customer Account | Rất hạn chế | Chỉ có `/api/me`; chưa có profile, địa chỉ, lịch sử đơn. |
| Queue infrastructure | Khung Laravel | Có config và bảng jobs; không có Job nghiệp vụ. |
| Cache/session infrastructure | Khung Laravel | Có migration và config database mặc định. |

## 3. Các module còn thiếu

### Hoàn toàn chưa có

- Coupon/Voucher.
- Shipping, bảng phí, khu vực giao hàng, tích hợp GHN/GHTK/Viettel Post.
- Admin Dashboard và phân quyền admin.
- Product Management CRUD, upload/gallery ảnh.
- Order Management, trạng thái và tracking.
- Customer Management.
- Contact/inquiry.
- Policy Management.
- Payment/Bank Transfer/COD persistence.
- Customer addresses.
- Order history.
- Revenue statistics.
- Banner/content management.
- Facebook Pixel/Google Analytics management.
- Messenger integration ở backend.

### Có giao diện frontend nhưng chưa có backend tương ứng

- Voucher `DAISY10` chỉ là UI.
- Phí vận chuyển và ngưỡng miễn phí chỉ tính ở frontend.
- COD/chuyển khoản/QR chỉ là UI; payload order không có `payment_method`.
- Checkout note được nhập nhưng không gửi backend.
- Cart không đồng bộ tài khoản/server.

## 4. Các API hiện có

| Method | Endpoint | Auth | Controller | Chức năng |
|---|---|---:|---|---|
| GET | `/api/health` | Không | Closure | Health response `{status: ok}`. |
| GET | `/api/products` | Không | `ProductController@index` | Trả toàn bộ sản phẩm kèm category. |
| GET | `/api/products/{slug}` | Không | `ProductController@show` | Chi tiết sản phẩm theo slug. |
| GET | `/api/categories` | Không | `CategoryController@index` | Trả toàn bộ danh mục. |
| POST | `/api/register` | Không | `AuthController@register` | Tạo user và token. |
| POST | `/api/login` | Không | `AuthController@login` | Xác thực và tạo token mới. |
| GET | `/api/me` | Sanctum | `AuthController@me` | Thông tin user hiện tại. |
| POST | `/api/orders` | Sanctum | `OrderController@store` | Validate, trừ stock, tính tổng và trả order tạm trong response. |

Web route `/` chỉ trả Laravel welcome view. Laravel cũng cấu hình health route framework `/up`.

Không có versioning (`/api/v1`), pagination, search/filter/sort server-side, API Resource hoặc OpenAPI documentation.

## 5. Các bảng hiện có

| Bảng | Nguồn | Vai trò |
|---|---|---|
| `users` | Laravel default | Tài khoản. |
| `password_reset_tokens` | Laravel default | Token reset password; chưa có API sử dụng. |
| `sessions` | Laravel default | Session database. |
| `personal_access_tokens` | Sanctum | Bearer token. |
| `categories` | Project | Danh mục sản phẩm. |
| `products` | Project | Sản phẩm, tồn kho, giá và images JSON. |
| `cache` | Laravel default | Cache database. |
| `cache_locks` | Laravel default | Distributed cache locks. |
| `jobs` | Laravel default | Queue pending jobs. |
| `job_batches` | Laravel default | Queue batches. |
| `failed_jobs` | Laravel default | Queue failures. |

Không có `orders`, `order_items`, `addresses`, `coupons`, `coupon_usages`, `shipping_methods`, `payments`, `contacts`, `policies`, roles/permissions hoặc audit logs.

## 6. Quan hệ dữ liệu hiện có

```text
categories (1) ──────< (N) products
    Category::products()   Product::category()

users (1) ──────< personal_access_tokens
    Quan hệ polymorphic do Sanctum quản lý, nhưng User hiện chưa gắn HasApiTokens.
```

Chưa có quan hệ User–Order, Order–OrderItem, Product–OrderItem, User–Address, Coupon–Order hoặc Shipping–Order.

Foreign key duy nhất của nghiệp vụ là `products.category_id → categories.id`, dùng `cascadeOnDelete`. Xóa category sẽ xóa toàn bộ product thuộc category; đây là quyết định có rủi ro với dữ liệu lịch sử nếu sau này có order.

## 7. Những điểm tốt

- Dự án dùng Laravel/Sanctum phiên bản mới và cấu trúc framework chuẩn.
- Route public/protected được phân nhóm rõ.
- API exception được ép render JSON cho `/api/*`.
- Product có casts hợp lý cho giá, stock, rating, boolean và images.
- Slug category/product có unique index.
- Product API eager-load category, tránh N+1 ở response hiện tại.
- Giá và tồn kho dùng integer, phù hợp VND và số lượng nguyên.
- Seeder dùng `firstOrCreate`, giảm trùng lặp khi seed lại.
- Order lấy giá từ database thay vì tin giá do client gửi.
- Order kiểm tra stock trước khi decrement từng item.
- Có test cơ bản cho products endpoint.
- Có sẵn database queue/cache/session infrastructure.

## 8. Những điểm cần cải thiện

### Kiến trúc

- Tách validation sang Form Request.
- Tách checkout/order transaction sang Service; Repository chỉ nên thêm khi có nhu cầu thay nguồn dữ liệu hoặc query phức tạp.
- Dùng API Resource để chuẩn hóa response Product/Category/Order.
- Bổ sung policy và role/permission trước khi làm admin CRUD.
- Version API và chuẩn hóa error envelope.

### Dữ liệu

- Thiết kế và lưu orders/order_items, snapshot giá/tên sản phẩm, payment/shipping status.
- Thêm địa chỉ khách hàng, coupon và usage tracking.
- Cân nhắc decimal cho rating; thêm check constraint giá/stock không âm.
- Không cascade xóa product khi category bị xóa nếu cần bảo toàn lịch sử; ưu tiên restrict/nullable/soft delete.

### API và hiệu năng

- Pagination, search, category/price filter và sort server-side cho 100–150 sản phẩm ban đầu và khả năng mở rộng.
- Chỉ select field cần thiết; cache category và danh sách nổi bật.
- Index cho `featured`, `is_new`, `category_id`, giá và các trường thường filter.
- Không map collection toàn bộ bằng PHP khi có thể dùng Resource collection/paginator.

### Vận hành

- Đổi APP_NAME/locale/timezone sang Daisy, `vi`, `Asia/Ho_Chi_Minh` theo môi trường production.
- Thiết lập mail thật cho order confirmation/reset password.
- Backup database/media, retention và restore drill.
- Logging có correlation/order ID; monitoring queue/failed jobs.

## 9. Những lỗi tiềm ẩn

### Critical

1. **Sanctum token có thể không hoạt động:** `User` không `use HasApiTokens`, trong khi controller gọi `$user->createToken()`. `HasApiTokens` bị import nhầm trong `AuthController` nhưng import không gắn trait vào model.
2. **Order không được lưu:** API trả cấu trúc order trong response nhưng không tạo bản ghi. Không thể xem lịch sử, quản trị, tracking, thống kê hoặc audit.
3. **Trừ kho không atomic:** `DB` được import nhưng không dùng transaction. Nếu item sau thất bại, stock item trước đã bị trừ; request trả lỗi nhưng dữ liệu đã thay đổi một phần.
4. **Race condition/overselling:** đọc stock rồi decrement không có `lockForUpdate` hoặc atomic conditional update.

### High

5. `/api/orders` bắt buộc token nhưng frontend có thể gọi với token rỗng; guest checkout sẽ nhận 401.
6. Login tạo token mới mỗi lần, không có logout/revoke/expiration mặc định (`sanctum.expiration = null`), dẫn đến token tích lũy lâu dài.
7. Không có rate limit cụ thể cho login/register/order; dễ brute force và abuse.
8. Validation order chưa dùng `exists:products,id`, chưa giới hạn max quantity/items/string length, chưa normalize phone/address.
9. Thông tin payment, shipping, voucher, note từ frontend không được lưu/gửi; UI và backend có thể hiển thị tổng khác nhau.
10. Seeder ảnh dùng `/src/assets/...`, phụ thuộc cấu trúc frontend dev và không phải URL media do backend quản lý.

### Medium

11. `ProductController@index` trả toàn bộ catalog không pagination.
12. Rating là float và do database lưu trực tiếp, chưa có review model/nguồn tính rating.
13. Category API trả model trực tiếp trong khi Product API map thủ công; contract thiếu nhất quán.
14. Không có soft delete/audit columns cho dữ liệu kinh doanh.
15. APP locale/timezone/name vẫn mặc định Laravel/English/UTC trong `.env.example` và config.
16. `password_reset_tokens` có bảng nhưng không có flow API; email verification bị comment.
17. Không có CORS cấu hình riêng được kiểm chứng cho deployment tách domain.
18. Không có security headers/CSP và chưa có upload validation vì upload chưa triển khai.

## 10. Khác biệt với yêu cầu trong Excel

Checklist xác định shop Daisy Handmade Store, màu vàng–trắng–đen, ngành trang sức cổ phục, khoảng 100–150 sản phẩm, website responsive và các nhóm yêu cầu sau.

| Yêu cầu checklist | Backend hiện tại | Khoảng cách |
|---|---|---|
| Hiển thị sản phẩm, ảnh, giá, mô tả, tồn kho | Có read API | Ảnh chưa có media pipeline; list chưa pagination/filter/search. |
| Danh mục | Có read API | Thiếu CRUD/admin. |
| Tìm kiếm và lọc | Frontend client-side | Thiếu API query/filter/sort. |
| Giỏ hàng | Frontend localStorage | Thiếu server cart/account sync. |
| Checkout | Prototype | Không lưu order; auth/guest flow chưa thống nhất. |
| Đăng ký/đăng nhập | Có controller/routes | Có lỗi trait Sanctum; thiếu logout/reset/verify/rate limit. |
| Khách xem lịch sử đơn | Chưa có | Thiếu toàn bộ order persistence/API. |
| Lưu địa chỉ giao hàng | Chưa có | Thiếu address model/API. |
| COD | Chỉ frontend UI | Backend không có payment method/status. |
| Chuyển khoản | Chỉ frontend UI | Backend không có payment record/reconciliation. |
| Tính phí ship tự động | Chỉ frontend ước tính | Thiếu shipping rules/API. |
| Kết nối đơn vị vận chuyển | Chưa có | Thiếu integration/webhook/tracking. |
| Theo dõi trạng thái đơn | Chưa có | Thiếu order/shipment status. |
| Admin sản phẩm | Chưa có | Thiếu admin auth/policy/CRUD/upload. |
| Admin đơn hàng | Chưa có | Thiếu persistence/CRUD/status workflow. |
| Admin khách hàng | Chưa có | Thiếu role/policy/customer APIs. |
| Thống kê doanh thu | Chưa có | Không có order data để thống kê. |
| Quản lý banner/nội dung | Chưa có | Thiếu CMS module. |
| SSL | Hạ tầng triển khai | Chưa có cấu hình production trong repo. |
| Backup | Chưa có | Thiếu lịch backup/restore. |
| SEO cơ bản | Chủ yếu frontend | Backend chưa có sitemap/content metadata. |
| Facebook Pixel/Google Analytics | Chưa có backend | Có thể triển khai frontend/config sau. |
| Messenger | Chưa có | Chưa có integration/config. |
| Voucher | Chỉ UI | Thiếu model/rules/API/usage. |
| Contact | Frontend tĩnh | Thiếu lưu contact/notification API. |
| Policy pages | Link/UI chưa có backend quản lý | Thiếu policy model/API/versioning. |

## Đánh giá module theo danh sách yêu cầu

| Module | Kết luận |
|---|---|
| Authentication | **Có một phần, chưa production-ready** |
| Product | **Có read-only** |
| Category | **Có read-only** |
| Cart | **Không có backend** |
| Order | **Prototype, chưa lưu dữ liệu** |
| Coupon | **Thiếu** |
| Shipping | **Thiếu** |
| Customer Account | **Chỉ có `/me`** |
| Admin Dashboard | **Thiếu** |
| Product Management | **Thiếu** |
| Order Management | **Thiếu** |
| Customer Management | **Thiếu** |
| Voucher | **Thiếu** |
| Contact | **Thiếu** |
| Policy Management | **Thiếu** |

## Validation còn thiếu

- Form Request riêng cho register/login/order và các CRUD tương lai.
- `confirmed` và tiêu chuẩn password mạnh hơn khi register.
- Giới hạn độ dài name, phone, address; normalize email/phone.
- `exists:products,id`, `distinct` cho product IDs, max items, max quantity.
- Kiểm tra product active/published và giá/tồn kho trong transaction.
- Validation MIME/dimension/size và giới hạn số file khi triển khai upload.
- Validation coupon theo thời hạn, minimum amount, usage/user limit.

## Security còn thiếu

- Gắn đúng `HasApiTokens`; logout/revoke/token expiry/abilities.
- Throttle cho login, register, order và contact.
- Email verification, password reset API.
- Role/permission và Policies cho admin.
- Transaction + row lock/idempotency key cho checkout.
- Security headers, CSP, trusted proxies/hosts và CORS production.
- Sanitization/escaping cho nội dung CMS; upload vào storage ngoài public executable path.
- Audit log cho admin, order status, stock và payment.
- Không log token/PII; chính sách retention và encryption phù hợp.

## Giới hạn xác minh

Không chạy migration/test và không truy cập database theo yêu cầu. CLI `php` và `composer` cũng không có trong PATH của môi trường, nên route/test được audit từ source thay vì thực thi Artisan/PHPUnit. Không đọc giá trị `.env` thật để tránh lộ secret; chỉ đọc `.env.example` và config source.
