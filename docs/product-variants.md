# Màu, tồn kho và gallery sản phẩm

Cập nhật: 12/10/2026. Đã triển khai trong working tree, chưa commit/push/deploy hoặc migrate production.

## Quy tắc dữ liệu

- Migration `backend/database/migrations/2026_10_12_000001_add_product_color_inventory.php` thêm `product_variants`, `products.inventory_mode/cover_image`, `cart_items.variant_id`, `order_items.variant_id/color_name/inventory_source`.
- Sản phẩm cũ mặc định `shared`, giữ nguyên tồn, màu mô tả và URL/thứ tự ảnh. Không tách chuỗi màu, không tự phân bổ tồn.
- Trong `shared`, `products.stock` là nguồn tồn. Chọn màu có thể đổi gallery nhưng UI ghi rõ tồn chung, chưa phân bổ theo màu; số tồn riêng đã nhập chỉ được dùng sau khi chuyển chế độ.
- Trong `variant`, `products.stock` được đặt về 0, không được dùng làm tổng hoặc nguồn tồn thứ hai. API tính tổng từ các màu `active`; từng màu có nguồn tồn riêng.
- `stock = null` nghĩa là chưa nhập, `0` là hết hàng. Chuyển sang `variant` yêu cầu có ít nhất một màu đang bán và tất cả màu đang bán đã nhập tồn.
- Tổng mới khác tổng hiện tại khi chuyển chế độ phải có `confirm_stock_adjustment = true`. Phải xử lý hết đơn `pending/confirmed` trước khi đổi chế độ, kể cả đổi ngược, để đơn cũ luôn hoàn về đúng nguồn.
- Màu đã lưu chỉ ngừng bán (`active = false`), không xóa vật lý. Khóa ngoại restrict giữ tham chiếu; đơn lưu tên màu tại thời điểm mua. Hủy hoàn theo `inventory_source`, không theo chế độ sản phẩm hiện tại.
- Unique giỏ hàng dùng hai partial index cho dòng không chọn màu và dòng có màu. Migration này nhắm SQLite/PostgreSQL, không phải MySQL.
- Gallery chung vẫn là `products.images` JSON có thứ tự. Gallery màu là `product_variants.images` JSON, chỉ được chọn ảnh nằm trong gallery chung. `product_images` tiếp tục là kho file dùng chung; không thay đổi cơ chế upload/lưu/phục vụ file.
- Tối đa 8 ảnh chung/sản phẩm, 5 MB/file, JPG/PNG/WebP. Backend kiểm tra tổng ảnh bên trong transaction với khóa sản phẩm, không chỉ số file của request.
- `cover_image` nullable: không chọn riêng thì frontend dùng ảnh đầu; gỡ cover thì xóa lựa chọn. Có thể chọn đại diện chung là một ảnh của bất kỳ màu nào trong gallery.

## Thao tác quản trị

1. Tạo/lưu sản phẩm; chọn nhiều file một lần hoặc nhiều lần. Các lần chọn được cộng dồn; có nút bỏ file và đổi thứ tự file chờ upload.
2. Upload bổ sung nối vào gallery hiện có. Lưu thông tin và upload vẫn là hai request; nếu upload lỗi, phần thông tin đã lưu có thể đã thành công. Thông báo lỗi và form vẫn cho sửa tiếp, không tạo thêm sản phẩm lần nữa.
3. Sau upload, mở lại chỉnh sửa để đổi thứ tự ảnh đã lưu, chọn cover và gắn ảnh mới cho từng màu. Các ảnh của một màu có thể sắp xếp riêng.
4. Nhập màu và tồn đã kiểm kê. Không biết tồn thì để trống, không thay bằng 0. Trong chế độ tồn chung, trường tồn chung vẫn là nguồn chính.
5. Xử lý đơn còn có thể hủy, rồi chuyển sang tồn theo màu. Xác nhận điều chỉnh nếu tổng khác. Không nhân tồn chung sang từng màu.
6. Có thể ngừng bán màu để giữ lịch sử. Khi ngừng bán, màu không tính vào tổng tồn đang bán; quản trị cần kiểm kê/điều chỉnh số tồn của màu đó trước khi ngừng hoặc mở bán lại.

## API và trách nhiệm code

- `ProductGalleryService`: metadata cover/gallery, upload bổ sung và giới hạn tổng; tiếp tục gọi `ProductImageStorage` cũ.
- `ProductAdminService`: transaction lưu sản phẩm/màu, validation nghiệp vụ đổi chế độ và bảo vệ lịch sử.
- `ProductInventoryService`: chọn nguồn tồn, xác thực màu thuộc sản phẩm, kiểm tra/trừ/hoàn tồn. Conditional decrement `stock >= quantity` là lớp bảo vệ bổ sung ngoài khóa dòng.
- `CheckoutPreviewService`: kiểm tra trùng sản phẩm–màu, cộng lượng yêu cầu trên cùng pool tồn, đưa variant vào hash/snapshot. `OrderService`: transaction, kiểm tra lại tồn, trừ tồn và hoàn một lần khi hủy.
- `ProductResource/AdminProductResource/ProductVariantResource`: trả tổng tồn, `inventory_mode`, cover và variants; API admin có cả màu đã ngừng bán. Public API chỉ trả màu đang bán.
- Endpoint admin sản phẩm và upload giữ nguyên URL. Payload sản phẩm bổ sung `inventory_mode`, `cover_image`, `variants`, `confirm_stock_adjustment`.
- Cart/checkout/order item bổ sung `variant_id` nullable. Backend sinh `color_name`, client không quyết định nhãn lịch sử hoặc tồn kho.
- `ProductGalleryEditor`, `ProductVariantEditor`, `ProductColorSelector`: component tách riêng; `adminProductForm.ts` chứa initial values/validation; `productSelection.ts` chứa khóa dòng, ảnh và giới hạn hiển thị.
- `ProductForm`, `ProductManagementPage`, `services/admin/products.ts`, `types/admin-product.ts`: ghép quản trị và API.
- `ProductDetailPage`, `ProductCard`, `ProductTable`, `CartContext`, `CartPage`, `CheckoutPage`, `OrderHistoryPage`, `admin/OrderDetailPage`: dùng cover/chọn màu và hiển thị màu đã chọn.
- Type/service liên quan: `types/product.ts`, `types/cart.ts`, `types/admin-order.ts`, `services/productVariants.ts`, `services/api.ts`, `services/orders.ts`, `services/account.ts`, `services/admin/orders.ts`.
- Backend liên quan khác: model Product/ProductVariant/CartItem/OrderItem; controller Admin/Product/Cart/Order; request AdminProduct/StoreCartItem/StoreOrder/CheckoutPreview; CartResource; CartService. Dashboard low stock đã dùng tổng tồn đúng chế độ.
- CSS liên quan: `frontend/src/index.css`, `frontend/src/pages/admin/product-management.css`. Test frontend dùng Vitest/jsdom, cấu hình `vitest.config.ts`, dependencies trong package/package-lock.

## Kiểm tra đã thực hiện

- SQLite in-memory riêng cho PHPUnit; không dùng database local hoặc production để chạy test ghi dữ liệu.
- Migration thực tế trên bản sao `D:/Project/tmp/variant-development.sqlite` của database local. Ba sản phẩm cũ giữ nguyên mọi cột cũ, tồn 8/6/10; chế độ `shared`, cover null, 0 biến thể tự tạo. Database gốc không có migration mới.
- Test upgrade có sản phẩm và đơn tồn tại từ schema cũ: giữ nguyên tồn 50, chuỗi màu, URL ảnh; đơn mặc định nguồn shared, variant null.
- 84 backend tests / 678 assertions đạt, gồm cả bộ test cũ. Không có lỗi test cũ còn lại; lỗi contract validation `quantity` phát hiện trong triển khai đã được sửa tương thích.
- 4 frontend DOM tests đạt: tổng/chọn màu/ảnh/giới hạn số lượng/hết hàng; hai màu và localStorage sau remount; sản phẩm cũ; tích lũy file/thứ tự/gỡ cover; cover/fallback ở danh sách.
- `npm run typecheck`, `npm run build`, `npm run lint` đạt.
- Luồng API end-to-end: tạo sản phẩm, upload và đọc file HTTP 200, lưu cover/ảnh màu, GET mở lại admin, mua hai màu, chặn đổi chế độ khi có đơn pending, hủy và kiểm tra tổng/tồn từng màu phục hồi.
- Preview đổi variant bị từ chối, màu sai sản phẩm bị từ chối, cập nhật admin bằng ID màu sản phẩm khác rollback. Hủy lần hai không hoàn thêm; đổi tên/ngừng màu không làm mất tên màu của đơn.
- Test hai preview tranh cùng tồn chạy tuần tự: đơn sau bị từ chối sau khi đơn trước dùng hết tồn. Đây không phải test hai transaction PostgreSQL đồng thời.
- npm audit có 8 mục cảnh báo, cùng danh sách đã tồn tại trong package-lock trước thay đổi; không tự nâng cấp dependency ngoài phạm vi.

## Giới hạn chưa xác minh

- Không có PostgreSQL phát triển/psql/docker khả dụng được tìm thấy trong môi trường hiện tại. Chưa chạy migration hoặc test khóa/cạnh tranh trên PostgreSQL. Không coi SQLite là chứng minh an toàn cạnh tranh trên production.
- Trình duyệt CUA không có browser/app kết nối. Chưa kiểm tra trực quan desktop/mobile, Network/Console trong browser, F5 trên website thật hoặc thao tác upload từ điện thoại. DOM test/jsdom không đo bố cục CSS và không tải ảnh thực.
- Chưa thay đổi production. Website đang chia sẻ vẫn chạy phiên bản trước chức năng này.

## Chạy lại test

Frontend, trong `D:/Project/frontend`:

```powershell
npm.cmd ci
npm.cmd run test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Backend, trong `D:/Project/backend`, dùng PHP phù hợp. Trong môi trường hiện tại PHP với ini mặc định bị treo; lệnh đã xác minh:

```powershell
& 'C:/laragon/bin/php/php-8.3.30-Win32-vs16-x64/php.exe' -n -d extension_dir=C:/laragon/bin/php/php-8.3.30-Win32-vs16-x64/ext -d extension=mbstring -d extension=pdo_sqlite -d extension=fileinfo -d extension=openssl vendor/phpunit/phpunit/phpunit
```

## Hướng dẫn staging và triển khai sau khi được cho phép

Để kiểm tra giao diện local mà không migrate database gốc, dùng database bản sao đã tạo. Trong terminal backend riêng, đặt `DB_CONNECTION=sqlite`, `DB_DATABASE=D:/Project/tmp/variant-development.sqlite`, `DB_URL` rỗng, `APP_URL=http://127.0.0.1:8001`; dùng PHP hoạt động để chạy `artisan serve --host=127.0.0.1 --port=8001`. Trong terminal frontend riêng, đặt `VITE_API_BASE_URL=/api`, `API_PROXY_TARGET=http://127.0.0.1:8001`, rồi chạy `npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort`. URL dự kiến là `http://127.0.0.1:5174/admin/products` và `/san-pham`. Các server trên chưa được khởi động trong lượt triển khai này; thực hiện checklist browser ở bước 6 trên dữ liệu bản sao.

1. Sao lưu PostgreSQL đầy đủ, bao gồm `product_images.image_data`; kiểm tra khôi phục trên database staging riêng. Đối chiếu schema/migration production thực tế trước khi áp dụng.
2. Tạm dừng đặt hàng và tránh frontend mới gọi backend cũ trong cửa sổ nâng cấp. Backend mới truy vấn bảng variants ngay cả cho sản phẩm shared, nên schema phải có trước khi bật ứng dụng mới.
3. Trên staging, chạy `php artisan migrate --force` bằng PHP có driver PostgreSQL. Không chạy migrate:fresh hoặc db:seed để triển khai chức năng này.
4. Kiểm tra sản phẩm/đơn cũ, khóa ngoại, cả hai unique partial index. Không viết script tự chia màu/tồn. Chờ hoặc tính lại các checkout preview cũ do hash/snapshot bổ sung variant.
5. Chạy test/API flows trên staging. Test PostgreSQL đồng thời: tạo màu tồn 1, hai người dùng lấy preview số lượng 1 trước; gửi hai POST order đồng thời qua hai worker/kết nối DB độc lập. Phải có đúng một đơn thành công, một request bị từ chối và tồn cuối 0. Hủy đồng thời/lặp cùng đơn: tồn cuối chỉ trở lại 1. Kiểm tra rollback nếu một dòng của đơn nhiều màu hết tồn.
6. Kiểm tra browser trên desktop và điện thoại: upload nhiều lần trước lưu; thêm ảnh sau lưu; đổi thứ tự/cover/ảnh màu rồi F5 và mở lại admin; chọn màu đổi ảnh/tồn; màu hết hàng; thêm hai màu; sửa/xóa riêng dòng; checkout/chi tiết đơn có màu; hủy hoàn đúng; sản phẩm shared cũ mua như trước.
7. Chỉ khi các kiểm tra đạt và được phép triển khai: áp dụng migration production rồi backend/frontend tương ứng trong cùng cửa sổ bảo trì; dùng cấu hình API/storage HTTPS hiện có. Không đổi nơi lưu ảnh.
8. Giữ toàn bộ sản phẩm cũ shared ban đầu. Chuyển từng sản phẩm sau kiểm kê thực tế và xử lý hết đơn có thể hủy. Nếu frontend cũ còn dùng trong thời gian chuyển tiếp, backend sẽ từ chối mua sản phẩm variant thiếu màu.
9. Rollback: migration down chủ động từ chối khi có cart/order tham chiếu variant. Không bỏ tham chiếu hoặc gộp dòng để ép rollback. Sau phát sinh giao dịch màu, ưu tiên sửa tiến hoặc khôi phục backup đã xác minh cùng ứng dụng tương ứng.

Không có mật khẩu, token hoặc chuỗi kết nối trong tài liệu này.
