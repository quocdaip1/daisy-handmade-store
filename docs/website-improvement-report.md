# Báo cáo cải tiến website Daisy Handmade Store

## Phạm vi thực hiện

Đợt cải tiến này tiếp tục trên project hiện có và tập trung vào trải nghiệm Trang Chủ. Không thay đổi backend, route, API, schema dữ liệu hoặc logic giỏ hàng. Ngoài `HomePage`, chỉ cập nhật `Footer` dùng chung theo yêu cầu trực tiếp và bổ sung CSS cho các section mới.

## Hạng mục đã hoàn thành

### Featured Categories

- Hiển thị tối đa bốn danh mục lấy từ API hiện có.
- Card danh mục có phân cấp nội dung, màu sắc và họa tiết hoa cúc đồng bộ nhận diện Daisy.
- Tất cả CTA sử dụng route `/san-pham` hiện có.

### New Arrivals

- Lọc sản phẩm bằng thuộc tính `isNew` hiện có.
- Tái sử dụng `ProductGrid` và `ProductCard`, giữ nguyên hành vi thêm vào giỏ hàng.

### Best Seller

- Xếp ưu tiên theo `featured` và `rating`, không thêm trường dữ liệu hoặc API mới.
- Hiển thị tối đa bốn sản phẩm bằng component hiện có.

### Collection

- Bổ sung khu vực Bộ sưu tập Liên Hoa theo cảm hứng hoa sen và cổ phục triều Nguyễn.
- Minh họa được dựng bằng CSS, không phát sinh ảnh tải ngoài.

### Brand Story

- Cập nhật nội dung câu chuyện thương hiệu Daisy và định vị thủ công – cổ phục – văn hóa Việt.
- CTA dùng route `/gioi-thieu` hiện có.

### Promotion/Voucher

- Bổ sung banner ưu đãi `DAISY10` và CTA đến trang sản phẩm.
- Đây là nội dung trình bày; không thay đổi logic checkout hoặc tự động áp mã.

### Customer Review

- Bổ sung ba review, đánh giá sao và thông tin người dùng mẫu.
- Card responsive và có nhãn hỗ trợ accessibility.

### Footer

- Đồng bộ logo, màu sắc, typography và nội dung Daisy Handmade Store.
- Bổ sung liên kết điều hướng, hỗ trợ, thông tin cửa hàng và social link.
- Chỉ sử dụng các route nội bộ đang tồn tại.

## File đã thay đổi

- `frontend/src/pages/HomePage.tsx`
- `frontend/src/components/Footer.tsx`
- `frontend/src/index.css`
- `docs/website-improvement-report.md`

## Kết quả kiểm tra

- ESLint riêng các file thay đổi TypeScript (`HomePage.tsx`, `Footer.tsx`): **Đạt, không có lỗi hoặc cảnh báo**.
- ESLint toàn frontend: **chưa đạt do lỗi có sẵn ngoài phạm vi**:
  - `src/pages/LoginPage.tsx`: biến `error` không được dùng.
  - `src/pages/ProductsPage.tsx`: thiếu dependency `products` trong `useMemo`.
  - `src/services/api.ts`: năm vị trí đang dùng kiểu `any`.
- Production build: **dừng tại lỗi có sẵn trong `LoginPage.tsx`** (`TS6133`). Compiler không báo lỗi mới tại các file được sửa trong đợt này.

Các lỗi tồn tại trên không được sửa trong đợt này để tuân thủ yêu cầu không chỉnh trang khác ngoài Homepage và không thay đổi lớp API.

---

## Product Listing Page

### Phạm vi

Đợt này chỉ cải tiến trang danh sách sản phẩm và các component trực tiếp phục vụ trang. Không thay đổi API, dữ liệu sản phẩm, route, backend hoặc hành vi thêm sản phẩm vào giỏ hàng.

### Hạng mục đã hoàn thành

- **Product Grid:** bố cục ba cột desktop, hai cột tablet và một cột mobile trong khu vực catalog; tiếp tục tái sử dụng `ProductGrid` và `ProductCard` hiện có.
- **Filter Sidebar:** bộ lọc danh mục và khoảng giá dạng radio, hiển thị rõ trạng thái đang chọn, có nút đặt lại và sticky sidebar trên desktop.
- **Search UI:** ô tìm kiếm dạng pill, icon tìm kiếm, placeholder theo ngữ cảnh và nút xóa nhanh.
- **Sort UI:** tách khỏi bộ lọc, giữ nguyên bốn cách sắp xếp hiện có.
- **Mobile Filter Drawer:** drawer phủ màn hình ở tablet/mobile, có số lượng filter đang áp dụng, đóng bằng overlay hoặc nút đóng và CTA hiển thị số kết quả.
- **Loading State:** skeleton grid có animation trong thời gian tải dữ liệu.
- **Error State:** thông báo thân thiện và nút thử lại nếu promise tải catalog reject. API hiện tại vẫn giữ cơ chế fallback dữ liệu cục bộ.
- **Empty State:** hướng dẫn thay từ khóa hoặc xóa toàn bộ bộ lọc.
- **Pagination:** phân trang client-side sau bước lọc/sắp xếp, 8 sản phẩm mỗi trang; không bổ sung query hoặc thay đổi API.
- Bổ sung `products` vào dependency của `useMemo`, khắc phục cảnh báo hook có sẵn tại trang này.

### File đã thay đổi trong đợt Product Listing

- `frontend/src/pages/ProductsPage.tsx`
- `frontend/src/components/ProductFilter.tsx`
- `frontend/src/components/SearchBar.tsx`
- `frontend/src/index.css`
- `docs/website-improvement-report.md`

### Kiểm tra

- ESLint riêng `ProductsPage.tsx`, `ProductFilter.tsx`, `SearchBar.tsx`, `ProductGrid.tsx`: **Đạt, không có lỗi hoặc cảnh báo**.
- Production build: compiler đi qua các file Product Listing đã sửa và vẫn dừng tại lỗi tồn tại trước đó ở `src/pages/LoginPage.tsx` (`TS6133`: biến `error` không được sử dụng).
- Lint toàn frontend vẫn còn lỗi `LoginPage.tsx` và các kiểu `any` trong `src/services/api.ts`. Các file này không được sửa để tuân thủ phạm vi “chỉ Product Listing Page” và yêu cầu “không thay đổi API”.

---

## Xác nhận lại Trang Chủ

Đã đọc lại kế hoạch, báo cáo và đối chiếu source hiện tại. Các hạng mục được yêu cầu cho Trang Chủ đều đã được triển khai đầy đủ nên không viết lại code hoặc thay đổi hành vi đang hoạt động:

- Featured Categories lấy danh mục từ nguồn dữ liệu hiện có.
- New Arrivals lọc theo `isNew`.
- Best Seller ưu tiên `featured` và `rating`.
- Collection Liên Hoa.
- Brand Story Daisy.
- Promotion/Voucher `DAISY10` ở lớp trình bày.
- Customer Review.
- Footer đồng bộ Daisy Handmade Store.

Toàn bộ CTA tiếp tục dùng route hiện có; dữ liệu, API, backend và logic giỏ hàng không thay đổi.

### Kết quả kiểm tra lại

- ESLint riêng `src/pages/HomePage.tsx` và `src/components/Footer.tsx`: **Đạt, không có lỗi hoặc cảnh báo**.
- ESLint toàn frontend: còn 6 lỗi tồn tại ngoài phạm vi, gồm một lỗi unused variable ở `src/pages/LoginPage.tsx` và năm lỗi `no-explicit-any` ở `src/services/api.ts`. Cảnh báo cũ tại `ProductsPage.tsx` không còn.
- Production build: vẫn dừng tại `src/pages/LoginPage.tsx` với `TS6133` (`error` không được sử dụng). Không có lỗi mới được báo từ Trang Chủ hoặc Footer.

Không sửa `LoginPage.tsx` hoặc `services/api.ts` vì yêu cầu của đợt này giới hạn ở Homepage và không sửa API.

---

## Product Detail Page

### Phạm vi

Đợt này chỉ cải tiến `ProductDetailPage` và CSS trực tiếp phục vụ trang. Không thay đổi API, route, kiểu dữ liệu sản phẩm hoặc logic Cart Context.

### Hạng mục đã hoàn thành

- **Product Gallery:** vùng ảnh chính có tỉ lệ ổn định và fallback theo nhận diện Daisy.
- **Thumbnail Gallery:** hiển thị toàn bộ `product.images`, cho phép chọn ảnh và thể hiện thumbnail đang active.
- **Zoom Image:** nhấn ảnh chính để mở overlay phóng to; đóng bằng overlay hoặc nút đóng.
- **Product Information:** bố cục hai cột desktop, chuyển một cột trên tablet/mobile; bổ sung breadcrumb sử dụng route hiện có.
- **Price Section:** làm rõ giá bán, giá gốc và phần trăm tiết kiệm tính từ dữ liệu hiện có.
- **Inventory Status:** trạng thái còn hàng/hết hàng, số lượng tồn và thông tin sẵn sàng giao.
- **Quantity Selector:** stepper tăng/giảm, input trực tiếp và giới hạn từ 1 đến tồn kho.
- **Add To Cart:** tiếp tục gọi `addToCart(product, quantity)` hiện có.
- **Buy Now:** tái sử dụng `addToCart`, sau đó điều hướng đến `/thanh-toan` hiện có; không thêm route hoặc logic checkout mới.
- **Related Products:** giữ cách lọc cùng danh mục và tái sử dụng `ProductGrid`/`ProductCard`.
- **Mobile Responsive:** thumbnail ngang, action xếp dọc, thông số và related products tối ưu cho màn hình nhỏ.
- Bổ sung loading skeleton khi chuyển slug và trạng thái không tìm thấy sản phẩm.

### File đã thay đổi

- `frontend/src/pages/ProductDetailPage.tsx`
- `frontend/src/index.css`
- `docs/website-improvement-report.md`

### Kết quả kiểm tra

- ESLint riêng `src/pages/ProductDetailPage.tsx`: **Đạt, không có lỗi hoặc cảnh báo**.
- Production build: compiler không báo lỗi từ Product Detail Page và vẫn dừng tại lỗi tồn tại trước đó trong `src/pages/LoginPage.tsx` (`TS6133`: biến `error` không được sử dụng).
- Full lint vẫn còn lỗi ngoài phạm vi tại `LoginPage.tsx` và các kiểu `any` trong `services/api.ts`. Không sửa các file này vì đợt hiện tại giới hạn ở Product Detail Page và yêu cầu không thay đổi API.

---

## Cart và Checkout

### Phạm vi

Đợt này chỉ cải tiến `CartPage`, `CheckoutPage` và CSS trực tiếp liên quan. Không thay đổi backend, API đặt hàng, route, Cart Context hoặc payload gửi đến `/api/orders`.

### Cart

- Giao diện hiện đại, đồng bộ màu vàng – trắng – than và typography Daisy.
- Giữ nguyên thao tác tăng/giảm, xóa từng sản phẩm, xóa toàn bộ và liên kết chi tiết sản phẩm.
- Thanh tiến trình miễn phí vận chuyển dựa trên ngưỡng trình bày 2.000.000₫.
- Hiển thị phí vận chuyển dự kiến 30.000₫ hoặc miễn phí khi đạt ngưỡng.
- Voucher input có trạng thái hợp lệ/không hợp lệ; mã `DAISY10` chỉ được xác nhận ở lớp UI và không tự thay đổi tổng tiền backend.
- Order Summary thể hiện tạm tính, phí ship dự kiến, tổng dự kiến và các cam kết mua hàng.
- Trạng thái giỏ hàng trống được đồng bộ nhận diện Daisy.

### Checkout

- Tách form thành ba khu vực: thông tin khách hàng, địa chỉ giao hàng và phương thức thanh toán.
- Giữ nguyên validation bắt buộc cho họ tên, điện thoại, email, tỉnh/thành, quận/huyện và địa chỉ.
- Bổ sung `autocomplete`, `aria-invalid`, thông báo lỗi theo trường và xóa lỗi khi người dùng nhập lại.
- Hỗ trợ chọn COD hoặc chuyển khoản ngân hàng trong UI.
- QR Transfer Layout gồm QR minh họa, ngân hàng, số tài khoản, chủ tài khoản và nội dung chuyển khoản.
- Phần tóm tắt hiển thị ảnh, số lượng, giá từng sản phẩm, phí vận chuyển và tổng dự kiến.
- Nút submit thay đổi nhãn theo phương thức thanh toán nhưng vẫn gọi đúng `submitOrder` với payload cũ.
- Responsive: checkout chuyển một cột, summary lên trước trên tablet/mobile, form và QR tự co theo màn hình.

### Lưu ý logic

- Backend hiện không nhận voucher, phí vận chuyển hoặc phương thức thanh toán. Các thành phần này chỉ là UI/dự kiến để không thay đổi logic xử lý đơn hàng hiện tại.
- Payload vẫn chỉ gồm `items`, `customer_name`, `customer_email`, `customer_phone`, `shipping_address`.

### File đã thay đổi

- `frontend/src/pages/CartPage.tsx`
- `frontend/src/pages/CheckoutPage.tsx`
- `frontend/src/index.css`
- `docs/website-improvement-report.md`

### Kết quả kiểm tra

- ESLint riêng `CartPage.tsx` và `CheckoutPage.tsx`: **Đạt, không có lỗi hoặc cảnh báo**.
- Full lint còn 6 lỗi tồn tại ngoài phạm vi: một lỗi unused variable tại `LoginPage.tsx` và năm lỗi `no-explicit-any` tại `services/api.ts`.
- Production build không báo lỗi từ Cart/Checkout và vẫn dừng tại lỗi cũ `TS6133` trong `LoginPage.tsx`.

# Frontend Phase 2

## Phạm vi

Tiếp tục cải tiến trực tiếp Homepage và Footer hiện tại. Không tạo project mới, không sửa backend, API, route, dữ liệu sản phẩm, Product Card hoặc logic Cart Context.

## Các section đã cải tiến

### Footer

- Hiển thị logo có alt text, tên Daisy Handmade Store và mô tả trang sức cổ phục Việt Nam.
- Chuẩn hóa địa chỉ: Khu phố Hương Phước, phường Phước Tân, thành phố Đồng Nai.
- Hiển thị số điện thoại `0349671134` bằng liên kết `tel:`.
- Menu nhanh chỉ dùng route đang tồn tại: trang chủ, sản phẩm, giới thiệu và liên hệ.
- Hiển thị hướng dẫn mua hàng qua route liên hệ hiện có.
- Các chính sách vận chuyển, đổi trả, bảo mật và thanh toán được hiển thị dạng thông tin, không tạo link giả vì frontend chưa có route tương ứng.
- Facebook và Messenger được hiển thị với trạng thái đang cập nhật đường dẫn chính thức; đã loại bỏ các link generic Facebook/Instagram/TikTok không thuộc Daisy.
- Bố cục footer chuyển 4 cột → 3/2 cột → 1 cột theo kích thước màn hình, không tràn ngang.

### Danh mục nổi bật

- Chỉ render category thực tế trả về từ `/api/categories`.
- Hiển thị tối đa 6 danh mục.
- Ảnh card lấy từ sản phẩm thực tế cùng category; nếu category chưa có ảnh, dùng flower fallback có kiểm soát.
- Ảnh dùng `object-fit: cover`, lazy loading và alt text theo tên danh mục.
- CTA tiếp tục dùng route `/san-pham` hiện có; không tạo query/route lọc mới mà trang danh sách chưa hỗ trợ.
- Card đồng đều chiều cao, hover nhẹ và responsive 4/2/1 cột.

### Sản phẩm mới

- Dùng endpoint hiện có `/api/products/new-arrivals?per_page=4`.
- Tái sử dụng `ProductGrid`, `ProductCard` và `addToCart` hiện tại.
- Có skeleton, empty state, error state và retry.

### Sản phẩm nổi bật / Best Seller

- Dùng endpoint hiện có `/api/products/best-sellers?per_page=4`.
- Không tự giả lập sold count hoặc doanh số ở frontend.
- Đổi nhãn hiển thị thành “Sản phẩm nổi bật” để phản ánh đúng dữ liệu backend hiện dùng `featured + rating` làm đại diện.
- Có skeleton, empty state, error state và retry.

### Bộ sưu tập nổi bật

- Cấu trúc nội dung được chuyển khỏi JSX sang `src/data/homepage.ts` để tái sử dụng.
- Dùng asset SVG có sẵn trong project, không tải ảnh ngoài.
- Bổ sung ảnh lớn có alt text; giữ CTA `/san-pham`.
- Đây là dữ liệu trình bày frontend tạm thời vì backend chưa có collection model/API riêng.

### Promotion/Voucher

- Loại bỏ mã `DAISY10` khỏi Homepage vì Homepage chưa gọi API xác nhận voucher đang hoạt động.
- Section chỉ giới thiệu ưu đãi và ghi rõ điều kiện sẽ được xác nhận khi mua hàng.
- Không thêm logic giảm giá hoặc voucher giả.

### Customer Review

- Không triển khai trong bản giao diện cuối của Phase 2.
- Đã gỡ ba review tên người/rating mẫu trước đó vì project không có Review API, Review model hoặc nguồn testimonial có thể xác minh.
- Không hiển thị rating giả dưới danh nghĩa khách hàng thật.

### Loading, empty và error state

- Tạo ba component dùng chung có phạm vi vừa đủ: `LoadingSkeleton`, `EmptyState`, `ErrorState`.
- Skeleton có kích thước ổn định để hạn chế layout shift và tôn trọng `prefers-reduced-motion` từ design system hiện tại.
- Error state dùng thông báo thân thiện, không lộ stack trace, có nút thử lại.
- Empty state có nội dung theo từng section và CTA tới route sản phẩm hiện có.

## Design system

- Tiếp tục dùng Georgia cho heading và Segoe UI/Arial cho body.
- Chuẩn hóa `--primary` về brand yellow `#F4B400` và bổ sung alias `--surface: #FFFFFF`.
- Các style mới dùng CSS variables hiện có: `--primary`, `--accent-soft`, `--text`, `--cream`, `--surface`, `--border`.
- Không tải font hoặc cài icon library mới.

## Component được tái sử dụng

- `ProductGrid`
- `ProductCard`
- `SupportBar`
- `CartContext.addToCart`
- React Router `Link`

## Chức năng được giữ nguyên

- Toàn bộ route frontend.
- Contract và endpoint backend.
- Product data/type hiện có.
- Product Card và hành vi thêm vào giỏ.
- Cart Context/localStorage.
- Header, Hero, Product Listing, Product Detail, Cart và Checkout.

## File đã sửa

- `frontend/src/pages/HomePage.tsx`
- `frontend/src/components/Footer.tsx`
- `frontend/src/services/api.ts`
- `frontend/src/index.css`
- `docs/website-improvement-report.md`

## File đã tạo

- `frontend/src/components/HomeSectionState.tsx`
- `frontend/src/data/homepage.ts`

## Kết quả kiểm tra

```text
npm run lint
Result: passed
Exit code: 0
```

```text
npm run build
TypeScript project check: passed
Vite production build: passed
58 modules transformed
Exit code: 0
```

- Không dùng `any` trong các file Phase 2.
- Không tắt ESLint rule.
- Asset logo, collection SVG và imports được production build resolve thành công.
- Route CTA đã được đối chiếu với `AppRoutes`: `/`, `/san-pham`, `/gioi-thieu`, `/lien-he` đều tồn tại.
- Đã kiểm tra responsive bằng CSS tại desktop, tablet 900/768px và mobile 600/375px; grid/footer/CTA có breakpoint tương ứng và không tạo fixed width vượt viewport.
- Không thể chạy kiểm tra trực quan/console trong trình duyệt nội bộ vì phiên này không có browser khả dụng. Lint, TypeScript và production build không ghi nhận lỗi; visual smoke test ở 1440/1280/768/375px vẫn nên được thực hiện thủ công khi mở dev server.

## Lỗi còn lại

- Không còn lỗi lint hoặc build.
- Frontend hiện không có Review API/dữ liệu review hợp lệ nên Customer Review được chủ động bỏ qua.
- Backend chưa có Collection API; section Collection dùng dữ liệu trình bày tạm trong file data riêng.
- Chưa có route chính sách riêng hoặc URL Facebook/Messenger chính thức nên Footer không tạo liên kết giả.

## Đề xuất Frontend Phase 3

- Kết nối Cart Context hiện tại với cart API theo một phase riêng, có chiến lược merge local/server cart.
- Kết nối Checkout với preview/order/payment API mới mà không trộn vào phạm vi Homepage.
- Bổ sung trang chính sách khi route và nội dung backend được duyệt.
- Chỉ khôi phục Customer Review sau khi có nguồn dữ liệu thật và cơ chế moderation.
- Thực hiện visual regression test tự động tại 1440, 1280, 768 và 375px khi browser runner khả dụng.

Phase 2 kết thúc tại đây. Không chuyển sang Product Listing, Product Detail, Cart hoặc Checkout.

# Frontend Phase 3 – Product Listing

## Phạm vi

Chỉ cải tiến Product Listing Page, product service/type và các component trực tiếp phục vụ danh sách. Không audit lại project, không sửa backend, route, Product Card, Cart Context hoặc database schema.

`docs/project-context.md` chưa tồn tại tại thời điểm bắt đầu Phase 3; context được lấy từ `docs/website-improvement-report.md` và các file module được cho phép.

## Đối chiếu contract

Endpoint sử dụng:

```text
GET /api/products
```

Query parameters đã được backend xác nhận:

- `search`: string, tối đa 100 ký tự.
- `category`: category ID.
- `min_price`, `max_price`: integer không âm.
- `sort`: `featured`, `newest`, `price_asc`, `price_desc`.
- `page`: từ 1.
- `per_page`: từ 1 đến 50; frontend dùng 8.

Response pagination thực tế:

```text
data: Product[]
meta.current_page
meta.last_page
meta.per_page
meta.total
links
```

Validation error giữ nguyên contract Laravel 422. Phase này không thay đổi endpoint, request, response hoặc backend test.

## Thay đổi thực hiện

### Search

- Search server-side theo `search` thay vì lọc collection local.
- Debounce 300 ms, giảm request khi người dùng đang gõ.
- Trim từ khóa trước khi gửi.
- Khi đổi search, tự quay về trang 1.

### Filter

- Category gửi đúng `category` ID.
- Các khoảng giá frontend được ánh xạ sang `min_price`/`max_price`:
  - Dưới 1 triệu: `max_price=999999`.
  - 1–2 triệu: `min_price=1000000&max_price=2000000`.
  - Trên 2 triệu: `min_price=2000001`.
- Desktop sidebar và mobile drawer tiếp tục tái sử dụng `ProductFilter`.
- Nút reset xóa search/category/price và về trang 1.

### Sort

- Giá trị select được đồng bộ trực tiếp với whitelist backend.
- Hỗ trợ nổi bật, mới nhất, giá tăng và giá giảm.
- Không còn sort lại dữ liệu trang hiện tại ở frontend.

### Pagination

- Chuyển từ client-side pagination sang Laravel pagination.
- Tổng sản phẩm, trang hiện tại và tổng trang lấy từ `meta`.
- Mỗi trang tải 8 sản phẩm.
- Chuyển trang tạo request mới và cuộn lên đầu trang.

### Loading, Empty và Error

- Skeleton 8 card giữ nguyên kích thước grid.
- Empty state dựa trên `meta.total === 0`, có nút xóa bộ lọc.
- Error state phản ánh lỗi API thật và có nút retry.
- Product Listing không dùng fallback data, tránh che giấu backend/network error.
- Dùng sequence ID để response cũ không ghi đè kết quả khi filter/search thay đổi nhanh.

### Responsive và accessibility

- Giữ responsive grid/sidebar/drawer đã hoàn thành trước đó.
- Mobile filter button có accessible label kèm số filter đang áp dụng.
- Results region có `aria-busy`; error có `role=alert`; pagination giữ `aria-current`.
- Không thay đổi CSS/layout đã ổn định của Product Listing.

## Type frontend cập nhật

Thêm vào `src/types/product.ts`:

- `ProductSort`
- `ProductCatalogQuery`
- `ProductCatalog`

Không tạo field Product không tồn tại ở backend.

## Product service cập nhật

Thêm `fetchProductCatalog(query)`:

- Tạo URL bằng `URLSearchParams`.
- Mapping đúng `data` và `meta` Laravel.
- Trả type `ProductCatalog`.
- Không dùng `any`.

Các hàm service đang phục vụ module khác được giữ nguyên để tránh ảnh hưởng các phần đã hoàn thành.

## File frontend đã sửa

- `frontend/src/pages/ProductsPage.tsx`
- `frontend/src/services/api.ts`
- `frontend/src/types/product.ts`
- `docs/website-improvement-report.md`

## File backend đã sửa

- Không có.

## Component tái sử dụng

- `ProductFilter`
- `SearchBar`
- `ProductGrid`
- `ProductCard`
- `CartContext.addToCart`

## Kiểm tra

```text
eslint ProductsPage/Product Service/Product Types và component liên quan
Result: passed
Exit code: 0
```

```text
npm run build
TypeScript: passed
Vite production build: passed
58 modules transformed
Exit code: 0
```

## Rủi ro còn lại

- Search bắt đầu sau debounce 300 ms; đây là chủ đích để giảm tải API.
- Category API lỗi sẽ làm sidebar không có lựa chọn category, nhưng product list vẫn hoạt động và không bị thay bằng mock data.
- Pagination hiện render toàn bộ số trang; khi catalog tăng rất lớn nên bổ sung cửa sổ trang/ellipsis trong phase tối ưu riêng.
- Chưa thay đổi URL query của frontend route, nên filter chưa được giữ khi reload/chia sẻ link; không thực hiện vì phase này giữ nguyên route behavior.

Phase 3 kết thúc tại Product Listing. Không chuyển sang Product Detail, Cart hoặc Checkout.

# Frontend Phase 4 – Product Detail

## Phạm vi

Chỉ cải tiến Product Detail Page và product service liên quan. Không audit lại project, không sửa backend, API contract, route, Product type fields hoặc Cart Architecture.

`docs/project-context.md` vẫn chưa tồn tại; Phase 4 tái sử dụng context từ `docs/website-improvement-report.md` và chỉ đọc các file module được chỉ định.

## Contract đã đối chiếu

### Product Detail

```text
GET /api/products/{slug}
Response: { data: Product }
404: product không tồn tại hoặc không published
```

### Related Products

```text
GET /api/products/{slug}/related?limit=4
Response: { data: Product[] }
Validation: limit từ 1 đến 20
```

Product fields tiếp tục map đúng `ProductResource`: id, name, slug, category_id, description, short_description, price, original_price, material, color, stock, images, featured, is_new và rating.

## Thay đổi thực hiện

### Product Service

- Thêm `fetchProductDetail(slug)` dùng detail endpoint thật.
- Encode slug trước khi tạo URL.
- Phân biệt 404 và lỗi network/server: 404 trả `null`, lỗi khác được throw để UI hiển thị error state.
- Thêm `fetchRelatedProducts(slug, limit)` dùng related endpoint thật.
- Limit được giới hạn an toàn trong khoảng 1–20; Product Detail dùng 4.
- Giữ các hàm service cũ để không ảnh hưởng module đã hoàn thành.
- Không dùng `any` và không đổi response backend.

### Gallery và Thumbnail

- Giữ gallery chính và toàn bộ thumbnail từ `product.images`.
- Reset ảnh được chọn khi slug thay đổi.
- Thumbnail có lazy loading, `aria-pressed` và label vị trí ảnh.
- Ảnh fallback được giữ khi backend chưa có ảnh.
- Không mở zoom khi sản phẩm không có ảnh thật.

### Zoom

- Giữ overlay zoom hiện tại.
- Đóng bằng overlay, nút đóng hoặc phím Escape.
- Dialog có `aria-modal` và label theo tên sản phẩm.

### Product Information

- Hiển thị tên, material, mô tả, rating, giá, giá gốc hợp lệ, phần trăm tiết kiệm, màu sắc và tồn kho từ backend.
- Chỉ hiển thị original price khi lớn hơn giá bán.
- Nhãn rating đổi thành “Điểm đánh giá”, không tuyên bố review khách hàng khi chưa có Review API.
- Không tạo field hoặc dữ liệu sản phẩm mới.

### Quantity Selector

- Giới hạn từ 1 đến `product.stock`.
- Disable input/actions khi hết hàng.
- Nút tăng/giảm và input trực tiếp tiếp tục hoạt động.
- Khi đổi slug, quantity reset về 1.

### Add To Cart và Buy Now

- Add To Cart giữ nguyên `addToCart(product, quantity)` của Cart Context.
- Buy Now giữ nguyên flow: thêm vào Cart Context rồi điều hướng `/thanh-toan`.
- Không tạo server cart thứ hai và không thay đổi localStorage/cart architecture.

### Related Products

- Không tải toàn bộ `/api/products` rồi lọc ở frontend nữa.
- Dùng đúng related endpoint backend, tối đa 4 sản phẩm cùng category và loại sản phẩm hiện tại.
- Có loading state, empty state, error state riêng và nút retry.

### Loading, Not Found và Error

- Loading skeleton giữ bố cục gallery/info khi chuyển slug.
- 404 hiển thị trạng thái không tìm thấy và CTA quay lại cửa hàng.
- Network/server error hiển thị thông báo thân thiện và nút thử lại.
- Request cũ được hủy hiệu lực bằng cleanup flag khi slug thay đổi/unmount, tránh ghi state sai sản phẩm.

### Responsive

- Tiếp tục sử dụng responsive Product Detail đã hoàn thành: hai cột desktop, một cột tablet/mobile, thumbnail ngang trên màn hình nhỏ và action xếp dọc.
- Không thay đổi CSS/layout ổn định trong Phase 4.

## File frontend đã sửa

- `frontend/src/pages/ProductDetailPage.tsx`
- `frontend/src/services/api.ts`
- `docs/website-improvement-report.md`

## File backend đã sửa

- Không có.

## Product Types

- Không cần thay đổi; `Product` hiện đã khớp đầy đủ Product Resource.

## Kiểm tra

```text
eslint ProductDetailPage/Product Service/Product Types
Result: passed
Exit code: 0
```

```text
npm run build
TypeScript: passed
Vite production build: passed
58 modules transformed
Exit code: 0
```

## Rủi ro còn lại

- Product image URL vẫn phụ thuộc dữ liệu/storage URL backend; UI có fallback nếu array rỗng nhưng không tự thay ảnh khi URL trả 404.
- Buy Now tiếp tục dựa trên Cart Context/localStorage theo yêu cầu không đổi Cart Architecture; việc tích hợp server cart/checkout thuộc phase riêng.
- Related section không pagination vì endpoint chủ đích giới hạn tối đa 20 và UI chỉ lấy 4.

Phase 4 kết thúc tại Product Detail. Không chuyển sang Cart hoặc Checkout.

# Frontend Phase 5 – Cart

## Phạm vi

Chỉ kiểm tra Cart Context, Cart Page và Cart types. Không audit lại project, không mở/sửa backend Cart API, không thay đổi route, database hoặc Cart Architecture.

`docs/project-context.md` vẫn chưa tồn tại; Phase 5 sử dụng context từ report và các file cart được chỉ định.

## Nguồn dữ liệu Cart đã xác định

Cart hiện dùng:

```text
React Context + localStorage
Storage key: viet-ngoc-cart
```

Frontend **chưa sử dụng backend Cart API**. Vì vậy Phase 5 không kết nối backend cart để tránh tạo hai nguồn dữ liệu cạnh tranh nhau.

Cart Context hiện có:

- `addToCart(product, quantity)`.
- `updateQuantity(productId, quantity)`.
- `removeFromCart(productId)`.
- `clearCart()`.
- `totalItems` và `totalPrice` tính bằng `useMemo`.
- Giới hạn quantity theo `product.stock` snapshot hiện có.
- Khôi phục localStorage có kiểm tra cấu trúc, quantity dương và stock dương.

Không rewrite hoặc sửa Cart Context trong Phase 5.

## Cart UI

- Giữ bố cục Cart hiện đại, danh sách sản phẩm và order summary responsive đã có.
- Mỗi item hiển thị ảnh/fallback, material, tên, đơn giá, quantity và line subtotal.
- Ảnh cart dùng lazy loading và alt text theo sản phẩm.
- Bổ sung accessible label rõ cho remove và clear cart.
- Tổng số lượng dùng từ `totalItems`; subtotal dùng từ `totalPrice` của Context.

## Quantity Update

- Nút giảm gọi `updateQuantity(id, quantity - 1)`.
- Khi quantity về 0, Context loại item khỏi cart theo logic hiện có.
- Nút tăng gọi `updateQuantity(id, quantity + 1)`.
- Nút tăng disable khi đạt `product.stock` snapshot.
- Quantity có `aria-live` để trình đọc màn hình nhận cập nhật.

## Remove và Clear

- Remove item tiếp tục dùng `removeFromCart(productId)`.
- Clear toàn bộ tiếp tục dùng `clearCart()`.
- Mọi thay đổi được Context persist lại localStorage tự động.

## Empty Cart

- Giữ empty state Daisy với thông báo rõ ràng và CTA `/san-pham`.
- Empty state xuất hiện ngay khi cart không còn item sau remove/clear/update về 0.

## Cart Summary

- Loại bỏ validation voucher hard-code `DAISY10` khỏi Cart Page.
- Loại bỏ phí ship cố định 30.000₫ và ngưỡng miễn phí ship 2.000.000₫ khỏi Cart Page.
- Không cộng phí ship frontend vào total dự kiến.
- Summary chỉ hiển thị:
  - Tổng số món.
  - Subtotal local theo cart snapshot.
  - Ưu đãi: xác nhận ở bước sau.
  - Phí vận chuyển: xác nhận ở bước sau.
- Có ghi chú rõ backend sẽ kiểm tra lại giá, tồn kho, ưu đãi và phí vận chuyển trước khi xác nhận order.
- CTA checkout giữ nguyên route `/thanh-toan`.

## Responsive

- Tiếp tục tái sử dụng responsive Cart CSS đã hoàn thành trước đó.
- Không thay đổi CSS/layout ổn định trong Phase 5.
- Item, summary và CTA tiếp tục chuyển layout theo breakpoint tablet/mobile hiện có.

## File frontend đã sửa

- `frontend/src/pages/CartPage.tsx`
- `docs/website-improvement-report.md`

## File đã kiểm tra nhưng không sửa

- `frontend/src/context/CartContext.ts`
- `frontend/src/context/CartContext.tsx`
- `frontend/src/types/cart.ts`

## File backend đã sửa

- Không có.

## Cart flow đã kiểm tra

Các nhánh flow được đối chiếu trực tiếp với Cart Context và xác nhận qua TypeScript/build:

1. Add item mới → thêm `{product, quantity}`.
2. Add item đã tồn tại → cộng quantity và cap theo stock.
3. Increase/decrease → cập nhật quantity theo stock.
4. Quantity về 0 → remove item.
5. Remove item → lọc theo product ID.
6. Clear cart → state trở thành array rỗng và UI chuyển Empty Cart.
7. Mọi state update → persist vào `viet-ngoc-cart`.
8. Reload → parse localStorage, loại item hỏng/hết stock.
9. Checkout CTA → giữ `/thanh-toan`; Cart Page không clear cart trước khi order thành công.

Project hiện không có test runner/component testing dependency cho frontend, nên không thêm thư viện hoặc test architecture mới trong phase tối ưu này.

## Kiểm tra kỹ thuật

```text
eslint CartPage/Cart Context/Cart Types
Result: passed
Exit code: 0
```

```text
npm run build
TypeScript: passed
Vite production build: passed
58 modules transformed
Exit code: 0
```

## Rủi ro còn lại

- Product price/stock trong localStorage là snapshot và có thể cũ; Cart Page đã không coi subtotal này là tổng cuối cùng.
- Checkout hiện phải gọi backend preview/order để xác nhận lại dữ liệu trong phase tích hợp riêng.
- Backend có Cart API nhưng frontend chưa dùng; cần chiến lược merge guest/local cart với authenticated server cart trước khi chuyển đổi.
- Chưa có automated frontend cart test vì project chưa cấu hình test runner.

Phase 5 kết thúc tại Cart. Không chuyển sang Checkout.

# Frontend Phase 6 – Checkout Preview

## Phạm vi

Chỉ tích hợp Checkout Page/service với shipping, coupon và checkout preview. Không tạo order, không clear cart, không đổi route hoặc Cart Architecture.

`docs/project-context.md` vẫn chưa tồn tại; context lấy từ website/backend reports và các file Checkout được chỉ định.

## Contract sử dụng

- `POST /api/shipping/quote`: nhận `{subtotal}`, trả `{data: ShippingMethod[]}`. Subtotal local chỉ dùng để lấy phí tham khảo.
- `POST /api/coupons/validate`: nhận `{code, subtotal}`, trả `{data: {code, discount}}`; invalid trả 422 message.
- `POST /api/checkout/preview`: Sanctum Bearer token; nhận address, shipping method, coupon tùy chọn và local cart identifiers; trả backend-calculated items/subtotal/discount/shipping_fee/grand_total.

Checkout Preview được mở rộng tương thích ngược với optional:

```json
{"items":[{"product_id":1,"quantity":2}]}
```

Nếu không có `items`, backend vẫn dùng server cart như contract cũ. Frontend không gửi price/total.

## Hạng mục hoàn thành

- Customer form giữ dữ liệu khi lỗi; validation name/phone/email/address rõ ràng.
- Mapping validation 422 từ `address.name`, `address.phone`, `address.city`, `address.district`, `address.address`, `shipping_method_id`, `coupon_code` và `cart`.
- Shipping methods tải từ backend; người dùng chọn method active.
- Coupon được backend kiểm tra, hiển thị discount dự kiến; preview kiểm tra lại theo subtotal backend.
- COD/bank transfer UI được giữ, nhưng chưa gửi để tạo order.
- Gỡ QR/bank information hard-code; backend chỉ sinh transfer content sau order thật.
- Summary hiển thị local subtotal trước preview và dùng hoàn toàn totals backend sau preview.
- Nút submit đổi thành “Xem tổng thanh toán/kiểm tra lại”, không gọi `/api/orders`.
- Không gọi `clearCart()` trong Phase 6.
- Responsive Checkout hiện có được giữ nguyên.

## File frontend đã sửa

- `frontend/src/pages/CheckoutPage.tsx`
- `frontend/src/services/orders.ts`
- `docs/website-improvement-report.md`

## File backend đã sửa

- `backend/app/Http/Requests/CheckoutPreviewRequest.php`
- `backend/app/Services/CheckoutPreviewService.php`
- `backend/tests/Feature/CheckoutPreviewApiTest.php`

## Kiểm tra

```text
eslint CheckoutPage/Checkout Service: passed
npm run build: passed
TypeScript: passed
58 modules transformed
```

```text
php artisan test --filter=CheckoutPreviewApiTest
5 tests passed
23 assertions
Pint related files: passed
```

## Rủi ro còn lại

- Checkout Preview yêu cầu Bearer token; guest chưa đăng nhập nhận hướng dẫn đăng nhập.
- Shipping quote ban đầu dựa trên local subtotal chỉ là tham khảo; preview là nguồn phí cuối.
- Email, note và payment method chưa thuộc preview contract; được giữ trong form/UI cho phase tạo order sau.
- Local cart chưa đồng bộ backend cart; optional items bridge chỉ phục vụ preview và không tạo nguồn cart thứ hai.

Phase 6 dừng ở preview. Không tạo order.

# Frontend Phase 7 – Create Order

## Phạm vi

Chỉ hoàn thiện Checkout submit flow dựa trên Order Controller/Service hiện có. Không sửa backend, route, API contract, schema hoặc module ngoài Checkout.

`docs/project-context.md` vẫn chưa tồn tại; context được lấy từ backend report và các file submit/order được chỉ định.

## Contract Create Order

```text
POST /api/orders
Auth: Bearer Sanctum token
```

Frontend gửi:

- `items[].product_id`, `items[].quantity`.
- `customer_name`, `customer_email`, `customer_phone`.
- `shipping_address`.
- `shipping_method_id`.
- `coupon_code` nếu có.
- `payment_method`: `cod` hoặc `bank_transfer`.
- `note` nếu có.

Frontend không gửi product price, subtotal, discount, shipping fee hoặc total. Backend OrderService tự query/lock Product, kiểm tra stock, tính totals, áp coupon/shipping, trừ stock và persist order/items/payment trong transaction.

## Flow hoàn thành

1. Người dùng nhập form và chọn shipping/coupon/payment.
2. Frontend bắt buộc có Checkout Preview thành công.
3. Nút tạo order chỉ xuất hiện sau preview.
4. Create Order gửi lại identifiers/quantity và selections hiện tại.
5. Lỗi 401/422 được map về customer, email, phone, shipping, coupon hoặc item/general error.
6. Form và cart được giữ nguyên khi lỗi.
7. Chỉ sau response create order thành công mới gọi `clearCart()`.
8. Success state được lưu trước khi clear để không rơi vào Empty Cart.

## COD

- Gửi `payment_method: cod`.
- Success hiển thị total backend và xác nhận thanh toán khi nhận hàng.
- Backend payment status là `unpaid`.

## Bank Transfer

- Gửi `payment_method: bank_transfer`.
- Không hard-code thông tin ngân hàng ở frontend.
- Success dùng response backend: bank name, account number, account owner, transfer content và QR URL nếu có.
- Backend payment status là `pending_verification`.

## Error Handling

- 401: yêu cầu đăng nhập.
- `items`: stock/product error hiển thị ở vùng tổng quát.
- `customer_name`, `customer_email`, `customer_phone`: map đúng field.
- `shipping_method_id`, `coupon_code`: map đúng section.
- Không xóa form, preview hoặc cart khi request thất bại.
- Disable action khi đang tạo order để tránh double click phía UI.

## File frontend đã sửa

- `frontend/src/pages/CheckoutPage.tsx`
- `frontend/src/services/orders.ts`
- `docs/website-improvement-report.md`

## File backend đã sửa

- Không có.

## Kiểm tra

```text
OrderApiTest + PaymentApiTest
9 tests passed
48 assertions
```

```text
eslint CheckoutPage/Order Service: passed
npm run build: passed
TypeScript: passed
58 modules transformed
```

## Rủi ro còn lại

- Frontend chưa có idempotency key; backend cũng chưa hỗ trợ. Nút được disable khi request đang chạy nhưng retry sau mất response vẫn cần xử lý ở phase reliability.
- Auth token hết hạn trả 401 và giữ cart/form; chưa tự redirect login để tránh thay đổi route flow.
- Backend Order response cũ không trả order ID/number trực tiếp trong `order`; transfer content vẫn chứa number cho bank transfer.
- Backend server cart cũng được clear trong OrderService, còn frontend local cart clear sau success; hai thao tác không cạnh tranh vì frontend vẫn dùng local cart làm nguồn UI.

Phase 7 dừng sau Create Order. Không chuyển sang module khác.

# Frontend Phase 8 – Customer Account

## Phạm vi

Hoàn thiện Login, Register, Profile, Logout, Order History và Order Detail bằng API hiện có. Không sửa backend, auth mechanism, database hoặc API contract.

`docs/project-context.md` vẫn chưa tồn tại; Phase 8 chỉ dùng các file auth/account/order được chỉ định.

## Auth mechanism đã xác nhận

- Laravel Sanctum Personal Access Token.
- Frontend lưu token tại `viet-ngoc-auth-token` theo cơ chế hiện có.
- Protected request gửi `Authorization: Bearer {token}`.
- Không chuyển sang cookie/session/JWT và không log token.

## Login

- `POST /api/login` với email/password.
- Normalize/validation cuối do backend xử lý; frontend validation cơ bản giữ dữ liệu form.
- Mapping Laravel 422 cho email/password và 401 credentials message.
- Disable submit khi đang gửi.
- Success lưu token rồi chuyển `/tai-khoan`.
- Gỡ toàn bộ nội dung “demo/kết nối sau”.

## Register

- `POST /api/register` với name/email/password.
- Confirm password chỉ validate frontend, không tạo field backend mới.
- Mapping lỗi `name`, `email`, `password`.
- Success lưu Sanctum token và chuyển Profile.
- Không còn register demo.

## Profile và Logout

- Tạo route `/tai-khoan`.
- Profile gọi `GET /api/me`, hiển thị đúng `{user:{id,name,email}}`.
- Không có token thì chuyển login.
- Logout gọi `POST /api/logout`, backend revoke current token.
- Chỉ xóa local token sau logout success; logout lỗi giữ session/token và hiển thị lỗi.

## Order History

- Tạo route `/don-hang`.
- Gọi `GET /api/orders?page={page}&per_page=10`.
- Mapping đúng Laravel Resource pagination `data/meta`.
- Hiển thị order number, ngày tạo, status và backend total.
- Có empty, loading, error và pagination state.

## Order Detail

- Tạo route `/don-hang/:orderId`.
- Gọi `GET /api/orders/{id}`.
- Backend OrderPolicy bảo vệ ownership.
- Hiển thị status, payment status, address, ngày tạo, item snapshot, subtotal, discount, shipping và total.
- Không suy diễn product hiện tại; dùng snapshot order item backend.

## Validation/Error handling

- Auth service có typed `AuthRequestError` với status và field errors.
- 401 profile/order yêu cầu đăng nhập lại; form auth giữ dữ liệu khi 422/401.
- Loading/error/empty state không hiển thị stack trace.

## File frontend đã sửa

- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/RegisterPage.tsx`
- `frontend/src/services/auth.ts`
- `frontend/src/routes/AppRoutes.tsx`
- `docs/website-improvement-report.md`

## File frontend đã tạo

- `frontend/src/pages/ProfilePage.tsx`
- `frontend/src/pages/OrderHistoryPage.tsx`
- `frontend/src/services/account.ts`

## File backend đã sửa

- Không có.

## Kiểm tra

```text
AuthApiTest + OrderApiTest
14 tests passed
59 assertions
```

```text
eslint Login/Register/Profile/Order History/Auth services/Routes: passed
npm run build: passed
TypeScript: passed
61 modules transformed
```

## Rủi ro còn lại

- Chưa có global Auth Context; Header không tự phản ứng với token trong Phase 8 để tránh sửa module đã hoàn thành.
- Token Sanctum backend hiện chưa có expiration policy; đây là backend operational risk đã ghi trong audit.
- Profile API hiện read-only, chưa có endpoint update profile.
- Order statuses hiển thị raw backend value; nên bổ sung translation map trong phase UX riêng nếu được yêu cầu.
- Order history không có cancel action vì mục tiêu Phase 8 chỉ list/detail.

Phase 8 dừng tại Customer Account.

# Frontend Phase 9 – Contact & Policy Pages

## Phạm vi

Chỉ cải tiến Contact Page, tạo Policy Pages dùng chung và cập nhật Footer Links. Không tạo CMS, không sửa backend, database hoặc API contract.

`docs/project-context.md` vẫn chưa tồn tại tại thời điểm thực hiện.

## Contact

- Loại bỏ toàn bộ tên/email/điện thoại/địa chỉ “Việt Ngọc” giả.
- Dùng thông tin Daisy đã xác nhận:
  - Khu phố Hương Phước, phường Phước Tân, thành phố Đồng Nai.
  - Điện thoại `0349671134` với `tel:` link.
  - Thời gian hỗ trợ Thứ 2–Chủ nhật, 8:00–21:00.
- Facebook/Messenger chỉ hiển thị trạng thái đang cập nhật, không tạo URL giả.
- Thêm contact form gửi `POST /api/contacts` với name, email, phone, subject, message.
- Mapping Laravel 422 theo từng field; giữ dữ liệu form khi lỗi.
- Disable submit trong lúc gửi; success mới reset form.
- Không hiển thị stack trace hoặc lỗi kỹ thuật.

## Policy Pages

Tạo một `PolicyPage` tái sử dụng cho các route:

- `/chinh-sach/van-chuyen`
- `/chinh-sach/doi-tra`
- `/chinh-sach/bao-mat`
- `/chinh-sach/thanh-toan`
- `/chinh-sach/dieu-khoan`
- `/chinh-sach/huong-dan-mua-hang`

Nội dung gồm:

- Shipping Policy.
- Return Policy.
- Privacy Policy.
- Payment Policy.
- Terms of Use.
- Buying Guide.

Đây là nội dung frontend tĩnh, có cấu trúc trong component; không tạo CMS, model, migration hoặc endpoint mới. Nội dung tài chính/totals nhấn mạnh backend là nguồn xác nhận cuối.

## Footer Links

- Hướng dẫn mua hàng và Điều khoản trỏ tới route riêng.
- Bốn chính sách chuyển từ text sang React Router Link thật.
- Giữ logo, brand description, địa chỉ, điện thoại và copyright.
- Không còn link policy giả tới Contact.

## Responsive

- Contact form dùng layout form responsive hiện có.
- Policy content dùng `content-page`/`info-card`, tự chuyển một cột trên mobile.
- Footer tiếp tục dùng responsive grid Phase 2.
- Không thay đổi CSS hoặc design system.

## File frontend đã sửa

- `frontend/src/pages/ContactPage.tsx`
- `frontend/src/components/Footer.tsx`
- `frontend/src/routes/AppRoutes.tsx`
- `docs/website-improvement-report.md`

## File frontend đã tạo

- `frontend/src/pages/PolicyPage.tsx`

## File backend đã sửa

- Không có.

## Kiểm tra

```text
eslint Contact/Policy/Footer/Routes: passed
npm run build: passed
TypeScript: passed
62 modules transformed
```

## Rủi ro còn lại

- Policy content là static frontend, chưa có version/published timestamp hoặc admin workflow.
- Nội dung nên được chủ shop/pháp lý duyệt trước production.
- Facebook/Messenger chưa có URL chính thức nên vẫn không clickable.
- Contact API có rate limit backend nhưng chưa có CAPTCHA/spam scoring.

Phase 9 kết thúc tại Contact và Policy Pages. Không tạo CMS.

# Frontend Phase 10 – SEO & Performance

## Phạm vi

Chỉ cập nhật cấu hình SEO, metadata theo route và cách tải ảnh hiện có. Không redesign UI, không sửa backend, API contract, database hoặc route. `docs/project-context.md` chưa tồn tại tại thời điểm thực hiện.

## SEO và route metadata

- Tập trung title, meta description và robots theo từng route vào `routeMetadata.ts`.
- Bổ sung metadata riêng cho trang chủ, sản phẩm, giới thiệu, liên hệ, các trang chính sách và các luồng tài khoản.
- Đặt `noindex, nofollow` cho giỏ hàng, checkout, đăng nhập/đăng ký, tài khoản, đơn hàng và trang 404.
- Đồng bộ Open Graph theo route: title, description, URL, image, locale và site name.
- Bổ sung canonical URL và Twitter summary card.
- Thêm JSON-LD Schema.org gồm `Organization`, `WebSite` và `WebPage`; nội dung được cập nhật khi route thay đổi.
- Giữ metadata mặc định trong `index.html` cho thời gian trước khi React hydrate.

## Ảnh, accessibility và bundle

- Logo Header có kích thước nội tại, `decoding="async"`, tải eager và ưu tiên cao để hạn chế layout shift ở vùng đầu trang.
- Ảnh Product Card, danh mục, collection, cart và thumbnail dùng lazy loading/async decoding; ảnh chính Product Detail được ưu tiên tải.
- Alt text có nghĩa tiếp tục được dùng cho ảnh nội dung; ảnh trang trí/thumbnail lặp lại giữ alt rỗng nhưng có accessible label ở nút cha.
- Không thêm thư viện SEO mới; tránh tăng dependency và bundle runtime.
- Giữ nguyên cơ chế route-level `React.lazy`, production build tiếp tục tạo chunk riêng cho từng page.

## File frontend đã sửa

- `frontend/index.html`
- `frontend/src/layouts/MainLayout.tsx`
- `frontend/src/components/Header.tsx`
- `frontend/src/components/ProductCard.tsx`
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/pages/ProductDetailPage.tsx`
- `frontend/src/pages/CartPage.tsx`

## File frontend đã tạo

- `frontend/src/components/SeoManager.tsx`
- `frontend/src/seo/routeMetadata.ts`

## File backend đã sửa

- Không có.

## Kiểm tra

```text
npm run lint: passed
npm run build: passed
TypeScript: passed
64 modules transformed
Production JS: 321,522 bytes (chia theo route; entry gzip 78.99 kB)
Production CSS: 51,789 bytes (gzip 10.54 kB)
Asset files: 19
```

## Rủi ro còn lại

- Đây là SPA client-rendered; crawler không chạy JavaScript sẽ chỉ thấy metadata mặc định từ `index.html`. SSR/prerender là một thay đổi kiến trúc và không thuộc Phase 10.
- Product Detail hiện dùng metadata chung vì metadata manager không mở Product API/type theo giới hạn file của phase; chưa có Product schema động theo dữ liệu sản phẩm.
- `og:image` dùng logo thương hiệu; chưa có ảnh social share chuyên dụng theo tỷ lệ Open Graph.
- Chưa chạy Lighthouse trong trình duyệt; performance check của phase dựa trên production chunking và kích thước bundle đầu ra.

Phase 10 dừng tại SEO, image loading, accessibility và kiểm tra bundle. Không redesign UI.

## Responsive authentication layout

- Tối ưu vị trí và kích thước auth card cho desktop, tablet và mobile.
- Chuẩn hóa chiều cao input/nút; nút submit full-width trên mobile.
- Tăng khoảng cách dọc giữa tiêu đề, mô tả và vùng nhập thông tin.
- Thêm nút hiện/ẩn mật khẩu có trạng thái và nhãn accessibility trên trang đăng nhập.
- Áp dụng nút hiện/ẩn cho cả mật khẩu và mật khẩu xác nhận trên trang đăng ký.
- Nút hiện/ẩn chỉ xuất hiện sau khi người dùng bắt đầu nhập mật khẩu.
- Thống nhất display font toàn website sang system font hỗ trợ tiếng Việt tốt hơn; loại bỏ Georgia ở tiêu đề.

## Production deployment preparation

- Tập trung URL API frontend qua `VITE_API_BASE_URL`, giữ fallback `/api` cho local.
- Thêm CORS production, Docker Laravel, PostgreSQL Render Blueprint và SPA rewrite.
- Thêm `docs/deployment-guide.md`; không thay đổi API contract hoặc database schema.
- Không thay đổi logic đăng nhập hoặc API contract.
