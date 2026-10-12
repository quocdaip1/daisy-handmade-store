# Project Context – Daisy Handmade Store

Cập nhật: 15/07/2026

Tài liệu này là nguồn tham chiếu nhanh trước khi thực hiện các phase tiếp theo. Khi tài liệu khác mâu thuẫn với source hoặc kết quả chạy mới, ưu tiên source hiện tại và kết quả kiểm tra mới nhất.

## 1. Tổng quan dự án

Product colors/inventory implementation (2026-10-12): working-tree-only additive migration and variants/gallery/inventory services, admin editors, customer color selection and variant-aware cart/checkout/cancellation. Existing products/orders keep shared inventory; migration tested only on isolated SQLite and local DB copy, not production. See `docs/product-variants.md` for rules, tests and rollout limits. No production deployment authorized or performed.

Image upload shared-link fix (2026-10-11): public disk defaults to `/storage` via `PUBLIC_STORAGE_URL`; Vite proxies `/api` and `/storage` via server-side `API_PROXY_TARGET`; product image URLs resolve against frontend API configuration and legacy loopback URLs are normalized in API responses. `storage:link` is still required. Lint/build and 72 backend tests passed; external browser verification remains unavailable. See `docs/image-storage.md` for sharing modes and verification limits.

Confirmed hosting follow-up: shared frontend is `https://frontend-jade-zeta-89.vercel.app`, deployed API base is `https://daisy-api-quocdai.onrender.com/api`. Public API returns ten correctly formed HTTPS upload URLs, all HTTP 404; upload CORS preflight works. Docker startup now creates the storage link and Docker context excludes local storage junction/uploads. Render authentication expired, so live file existence, persistent disk, deployment and new remote upload remain unverified. See `docs/image-storage.md` for exact environment values and recovery steps.

Final hosted repair: Render login renewed; Free Docker plan has no SSH/Shell or persistent disk. Image backend commit `6ba1ba6` deployed live (`dep-db5ksm8ae00c739phgl0`). Default `PRODUCT_IMAGE_STORAGE=database` stores encoded image bytes in PostgreSQL and serves immutable public HTTPS URLs through `/storage/products/{filename}`; the public disk implementation remains optional. 73 tests/570 assertions and lint passed. Real hosted upload (2.18 MB), fresh product API read, repeated image download and a confirmed new instance after Render restart returned 200 with matching SHA-256. Previous broken images still require original-file re-upload; no live browser/F5 verification available. See `docs/image-storage.md` for verification details.

Daisy Handmade Store là website bán trang sức thủ công lấy cảm hứng từ cổ phục và văn hóa Việt Nam.

- Frontend: React 19, TypeScript, Vite, React Router.
- Backend: Laravel, Eloquent, Laravel Sanctum.
- Database local hiện tại: SQLite tại `backend/database/database.sqlite`.
- Frontend: `D:/Project/frontend`.
- Backend: `D:/Project/backend`.
- Tài liệu: `D:/Project/docs`.
- Không tạo lại project, không dùng `migrate:fresh`, không đổi API/schema tùy tiện.

## 2. Nguồn tham chiếu chính

- `docs/codex-rules.md`: quy tắc tối ưu token, giới hạn phạm vi và quy trình kiểm tra cho các lượt Codex.
- `docs/website-improvement-report.md`: lịch sử cải tiến frontend.
- `docs/backend-improvement-report.md`: lịch sử cải tiến backend Phase 1–11.
- `docs/frontend-backend-integration-plan.md`: mapping Checkout, Order và Account.
- `docs/backend-final-audit.md`: security/performance findings backend.
- `docs/final-audit.md`: kết quả kiểm tra tích hợp gần nhất.
- Logo: `frontend/src/assets/daisy-logo.webp`.
- Checklist gốc: `Checklist_Yeu_Cau_Website_Ban_Hang_1.xlsx` trong thư mục Downloads của người dùng.

## 3. Frontend routes

| Route | Chức năng |
|---|---|
| `/` | Trang chủ |
| `/san-pham` | Danh sách sản phẩm |
| `/san-pham/:slug` | Chi tiết sản phẩm |
| `/gio-hang` | Giỏ hàng |
| `/thanh-toan` | Checkout preview và tạo order |
| `/gioi-thieu` | Giới thiệu |
| `/lien-he` | Liên hệ |
| `/dang-nhap` | Đăng nhập |
| `/dang-ky` | Đăng ký |
| `/tai-khoan` | Profile |
| `/don-hang` | Lịch sử đơn hàng |
| `/don-hang/:orderId` | Chi tiết đơn hàng |
| `/chinh-sach/:policySlug` | Policy pages |
| `/admin` | Admin Foundation, yêu cầu token và role `admin`/`staff` |
| `/404` | Không tìm thấy trang |

Các page được lazy-load tại `frontend/src/routes/AppRoutes.tsx`.

## 4. API contract chính

Base path backend: `/api`.

### Authentication

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/register` | Public, throttle 5/phút |
| POST | `/api/login` | Public, throttle 5/phút |
| GET | `/api/me` | Bearer token |
| POST | `/api/logout` | Bearer token |

- Mechanism: Laravel Sanctum personal access token dạng Bearer.
- Frontend token key: `viet-ngoc-auth-token`.
- Login/Register response: `{ user: { id, name, email }, token }`.
- Profile response: `{ user: { id, name, email } }`.
- Validation đăng ký: name tối thiểu 2 ký tự, email hợp lệ/unique, password 6–72 ký tự.
- Không tự chuyển cơ chế này sang session cookie hoặc JWT nếu chưa thay đổi đồng bộ contract.

### Product và Category

| Method | Endpoint |
|---|---|
| GET | `/api/products` |
| GET | `/api/products/{slug}` |
| GET | `/api/products/{slug}/related` |
| GET | `/api/products/new-arrivals` |
| GET | `/api/products/best-sellers` |
| GET | `/api/categories` |
| GET | `/api/categories/{slug}` |

Product list hỗ trợ search, category, price, sort và pagination. Frontend phải sử dụng wrapper/pagination thực tế từ service hiện có, không giả định response chung cho mọi API.

Customer Category API chỉ trả danh mục `active` và vẫn giữ nguyên các field `id`, `name`, `slug`, `description`; trạng thái quản trị không được đưa vào customer contract.

### Cart

Backend cart yêu cầu Bearer token:

| Method | Endpoint |
|---|---|
| GET | `/api/cart` |
| POST | `/api/cart/items` |
| PATCH | `/api/cart/items/{cartItem}` |
| DELETE | `/api/cart/items/{cartItem}` |
| DELETE | `/api/cart` |

Frontend hiện dùng `CartContext` + localStorage. Checkout gửi `product_id` và `quantity` để backend xác minh. Không dùng giá/subtotal local làm kết quả cuối và không tạo nguồn cart thứ ba.

### Checkout, Coupon và Shipping

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/checkout/preview` | Bearer token |
| POST | `/api/coupons/validate` | Public/token optional theo service |
| POST | `/api/shipping/quote` | Public |

Preview nhận item identifiers/quantity, address, shipping method và coupon code. Backend tự tính:

- `subtotal`
- `discount`
- `shipping_fee`
- `grand_total`

Preview không tạo order, không trừ stock, không ghi coupon usage và không clear cart.

### Order và Payment

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/orders` | Bearer token |
| GET | `/api/orders` | Bearer token |
| GET | `/api/orders/{order}` | Bearer token + ownership |
| POST | `/api/orders/{order}/cancel` | Bearer token + policy |

Frontend chỉ gửi item identifier/quantity, customer/address, shipping method, coupon code, payment method và note. Backend tự tính totals, kiểm tra/khóa stock và chạy transaction.

- Payment methods: `cod`, `bank_transfer`.
- COD status ban đầu: `unpaid`.
- Bank transfer status ban đầu: `pending_verification`.
- Chỉ clear local cart sau khi create order trả thành công.
- Bank transfer response có bank name, account number, account owner, transfer content và QR URL nullable.

### Contact và Policy

| Method | Endpoint |
|---|---|
| POST | `/api/contacts` |
| GET | `/api/policies` |
| GET | `/api/policies/{slug}` |

Contact API có validation và throttle 5/phút. Admin Phase 7 đọc danh sách/chi tiết lời nhắn, không tạo CRM workflow. Backend Policy/Banner records có Admin API cấu trúc cố định; customer `PolicyPage` hiện vẫn dùng nội dung tĩnh frontend và Homepage chưa consume Banner API.

### Admin

Toàn bộ `/api/admin/*` dùng `auth:sanctum` và middleware `admin`. Customer phải nhận 403. Backend có quản lý Product, Category, Order, Customer, Coupon và Dashboard Statistics.

Frontend Admin hiện có foundation tại `/admin`, Product Management tại `/admin/products`, Category Management tại `/admin/categories`, Order Management tại `/admin/orders`, Customer Management tại `/admin/customers`, Coupon Management tại `/admin/coupons` và Content Management tại `/admin/content/*`:

- `AuthProvider` đọc token hiện có, lấy user qua `/api/me` và giữ nguyên auth contract.
- Customer Header đồng bộ Auth Context sau login/register hoặc reload; chỉ hiển thị nút `Vào quản trị` sau khi `/api/admin/access` xác nhận role admin/staff ở backend.
- `ProtectedAdminRoute` kiểm tra authentication và xác minh quyền bằng middleware admin hiện có; 401 chuyển `/dang-nhap`, 403 chuyển `/`.
- `AdminLayout` gồm Sidebar, Header, logout và vùng `Outlet` responsive.
- Product Management hỗ trợ list/search/status filter/pagination, create/edit, chuyển `inactive` và quản lý ảnh theo upload flow hiện có.
- Category Management hỗ trợ list, create/edit, Active/Inactive và xóa danh mục rỗng; danh mục có sản phẩm không được xóa.
- Order Management hỗ trợ list/search/status filter/pagination, detail, cập nhật status và tracking number; chỉ dùng `Order::STATUSES` hiện có.
- Customer Management hỗ trợ list/search, profile read-only, addresses và customer order history; không có password editing hoặc CRM features.
- Coupon Management hỗ trợ create/edit, enable/disable và usage statistics; chỉ dùng `percent`/`fixed` cùng limits/date rules của backend hiện có.
- Content Management hỗ trợ hai Banner slots hiện có, đọc contact submissions và create/edit/publish Policy records bằng form cấu trúc cố định; không có Page Builder.
- Dashboard tại `/admin` hiển thị Revenue, Orders, Customers, Products và tối đa 5 Best Sellers từ Statistics API; không query dữ liệu trực tiếp ở frontend và không có biểu đồ.
- Settings tại `/admin/settings` quản lý Shop Information, Bank Account, Shipping Methods, Social Links và SEO Defaults qua `/api/admin/settings`; frontend không chứa giá trị cấu hình cửa hàng.

## 5. Validation và error handling

- Laravel validation trả HTTP 422 với `message` và `errors` theo field.
- Frontend phải map đúng lỗi field, giữ dữ liệu form và không thay bằng thông báo chung nếu backend đã trả chi tiết.
- HTTP 401: chưa đăng nhập/token không hợp lệ.
- HTTP 403: đã đăng nhập nhưng không có quyền.
- HTTP 404: resource/route không tồn tại.
- HTTP 429: vượt rate limit; login/register/contact hiện giới hạn 5 request/phút.
- Không log token, password, bank secret hoặc stack trace cho người dùng.

## 6. Cấu hình chạy local

Backend PHP hiện được tìm thấy tại:

```text
C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe
```

Ví dụ chạy backend:

```powershell
cd D:\Project\backend
& 'C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe' artisan serve
```

Frontend:

```powershell
cd D:\Project\frontend
npm.cmd run dev
```

### Lưu ý quan trọng về API local

`frontend/src/services` gọi URL tương đối `/api/...`; `frontend/vite.config.ts` đã proxy `/api` sang Laravel tại `http://localhost:8000` khi chạy development.

Trước khi kiểm thử đăng ký/đăng nhập trên Vite dev server, cần cấu hình một trong hai cách nhất quán:

Hiện tại project dùng Vite proxy `/api` → Laravel local. Nếu chuyển sang base API URL từ environment, phải cập nhật service tập trung.

Không hard-code URL rải rác trong từng page/service.

## 7. Lệnh kiểm tra chuẩn

Frontend:

```powershell
cd D:\Project\frontend
npm.cmd run lint
npm.cmd run build
```

Backend:

```powershell
cd D:\Project\backend
& 'C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe' artisan test
& 'C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe' artisan route:list
vendor\bin\pint --test
```

Kết quả xác minh mới nhất ngày 15/07/2026:

- Frontend lint: passed.
- Frontend build: passed với Vite 8.1.4, 73 modules transformed.
- Backend: 60/60 tests passed, 408 assertions sau Admin Access UX.
- Admin Final Audit: staging Go; production No-Go cho tới khi product upload có public storage link và persistent storage/object storage.
- Backend auth scope sau Admin Phase 1: `AuthApiTest` passed 7/7 tests, 29 assertions.

## 8. Trạng thái database

- User xác nhận đã chạy `php artisan migrate` sau backend audit cũ.
- Database local đang cấu hình `DB_CONNECTION=sqlite` và có file `backend/database/database.sqlite`.
- Migration Admin Phase 3 `2026_07_15_000001_add_active_to_categories_table.php` đã chạy thành công trên database local ngày 15/07/2026; môi trường khác vẫn phải chạy `php artisan migrate` khi triển khai.
- Migration Admin Phase 9 `2026_07_15_000002_create_store_settings_table.php` đã chạy thành công trên database local ngày 15/07/2026; môi trường khác vẫn phải chạy `php artisan migrate`.
- Không dựa vào migration status cũ trong `backend-final-audit.md`; phải chạy `artisan migrate:status` trước deployment để xác nhận trạng thái hiện tại.
- Không chạy `migrate:fresh` và không xóa dữ liệu.

## 9. Giới hạn và rủi ro còn lại

- Vite dev đã proxy `/api` sang Laravel port 8000; cần khởi động lại Vite sau khi đổi cấu hình.
- Auth Context đã đồng bộ với Customer Header, login/register và Profile logout; các Customer page còn lại vẫn có thể đọc token trực tiếp cho tới khi được chuẩn hóa ở phase riêng.
- Cart frontend localStorage và backend cart cùng tồn tại; cần giữ chiến lược đồng bộ hiện tại, không rewrite tùy tiện.
- Profile API hiện read-only.
- Token Sanctum chưa có expiration policy.
- Một số endpoint mutation chưa có rate limiter riêng.
- Admin order update đã đi qua `OrderService`, nhưng backend chưa có transition matrix, status history hoặc return workflow đầy đủ; không tự suy diễn side effects khi mở rộng workflow.
- Bank transfer xác minh thủ công; chưa có webhook/reconciliation/QR động.
- Chưa có order status history, audit log, return workflow hoàn chỉnh hoặc notification queue.
- Policy tĩnh chưa có version/published date/quy trình duyệt pháp lý.
- Contact chưa có CAPTCHA/spam scoring.
- SEO route metadata là client-rendered SPA; chưa có SSR/prerender.
- Chưa có browser E2E hoặc Lighthouse automation.

## 10. Quy tắc cho phase tiếp theo

1. Chỉ mở tài liệu và file trực tiếp liên quan đến module đang sửa.
2. Kiểm tra route, request body/query, response JSON, validation errors, TypeScript type và service trước khi code.
3. Nếu backend đúng/frontend sai, chỉ sửa frontend.
4. Nếu frontend đúng/backend sai, chỉ sửa backend tối thiểu và giữ tương thích ngược.
5. Không đổi API contract hoặc database schema nếu không bắt buộc.
6. Không tin giá, stock, discount, shipping fee hoặc totals từ frontend.
7. Không clear cart trước khi backend xác nhận order thành công.
8. Chạy lint/build/test liên quan và cập nhật report sau mỗi phase.

## 11. Cập nhật giao diện gần nhất

- Trang đăng nhập/đăng ký dùng auth card responsive; khoảng cách tiêu đề, mô tả và form được tách rõ; nút submit full-width trên mobile.
- Các ô mật khẩu đăng nhập/đăng ký chỉ hiện nút hiện/ẩn sau khi có nội dung và có nhãn hỗ trợ accessibility.
- Typography toàn trang dùng system font `Segoe UI` với fallback Tahoma/Arial để dấu và khoảng cách tiếng Việt đồng đều, kể cả tiêu đề.
- Project đã có cấu hình deploy Render: `render.yaml`, Docker Laravel, PostgreSQL, CORS theo `FRONTEND_URL` và frontend API URL theo `VITE_API_BASE_URL`.
- Render Free không dùng pre-deploy command; Docker backend chạy migration an toàn trước khi khởi động Apache.
- Docker production chạy seeder idempotent sau migration để PostgreSQL mới có danh mục và sản phẩm mẫu mà không tạo bản ghi trùng khi restart.
- Ảnh sản phẩm seed dùng đường dẫn public `/products/*.svg`; seeder dùng `updateOrCreate` để sửa dữ liệu đã tồn tại trên production.
- Trang Liên hệ có layout responsive hai panel: thông tin cửa hàng nổi bật và form hai cột trên desktop, một cột trên mobile; giữ nguyên Contact API.
- Trang Giới thiệu đã thay dữ liệu cũ “Việt Ngọc” bằng câu chuyện Daisy Handmade Store, giá trị thương hiệu và thông tin liên hệ hiện tại.
- “Sản phẩm nổi bật” trên mobile dùng carousel ngang scroll-snap với thẻ 82vw; danh mục và trang sản phẩm giữ layout riêng hiện có.
- Danh mục nổi bật dùng grid cân đối 3×2 desktop, 2 cột tablet, 1 cột mobile; mỗi thẻ mở `/san-pham?category={id}` và trang sản phẩm khởi tạo đúng bộ lọc URL.
- Danh mục nổi bật dùng cùng chiều rộng section trang chủ: grid 3/2/1 cột theo desktop/tablet/mobile, ảnh `contain` đồng đều và nội dung/CTA thẳng hàng.
- Sáu danh mục nổi bật dùng bộ ảnh JPG 768×768 riêng tại `frontend/public/categories`; không còn lấy ảnh sản phẩm seed hoặc hiển thị fallback hoa.
- Hướng dẫn triển khai nằm tại `docs/deployment-guide.md`.
- Admin Foundation có route `/admin` được bảo vệ theo role backend, Sidebar/Header responsive và logout.
- Admin Phase 2 có route `/admin/products`, Product Form/Table, validation frontend/backend và image upload.
- Admin Phase 3 có route `/admin/categories`; customer Category contract giữ nguyên và chỉ hiển thị danh mục active. Migration `2026_07_15_000001_add_active_to_categories_table.php` đã chạy local và cần được chạy ở các môi trường triển khai khác.
- Admin Phase 4 có route `/admin/orders` và `/admin/orders/:orderId`; search/filter/detail/update dùng đúng 7 status trong `Order::STATUSES`, không tạo status mới.
- Admin Phase 5 có route `/admin/customers` và `/admin/customers/:customerId`; profile chỉ đọc, hiển thị addresses/order history và backend cấm field `password` trong admin customer update.
- Admin Phase 6 có route `/admin/coupons`; create/edit/toggle và usage statistics tái sử dụng Coupon APIs/engine hiện có, không thêm discount rule mới.
- Admin Phase 7 có routes `/admin/content/banners`, `/admin/content/contacts`, `/admin/content/policies`; dùng models/schema hiện có và không tạo CMS/Page Builder tổng quát.
- Admin Phase 8 dùng `/admin` làm Dashboard; doanh thu và Best Sellers chỉ tính đơn có `payment_status=paid`, giữ nguyên các statistics fields cũ và bổ sung `best_sellers`.
- Admin Phase 9 có route `/admin/settings`; cấu hình Shop/Bank/Social/SEO lưu trong `store_settings`, cấu hình vận chuyển tái sử dụng `shipping_methods`, và Bank Settings được Payment Service dùng cho các đơn chuyển khoản mới.
