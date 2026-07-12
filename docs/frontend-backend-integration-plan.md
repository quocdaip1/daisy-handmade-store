# Frontend–Backend Integration Plan – Daisy Handmade Store

## Phase 6: Checkout Preview

### Nguồn dữ liệu

- Cart frontend hiện là React Context + localStorage.
- Backend cart contract vẫn được giữ.
- Checkout preview chấp nhận optional item identifiers từ local cart để backend xác nhận dữ liệu thực.

### Mapping

| Frontend | Backend |
|---|---|
| `product.id` | `items[].product_id` |
| cart quantity | `items[].quantity` |
| customer/address form | `address.{name,phone,city,district,address}` |
| selected shipping | `shipping_method_id` |
| coupon input | `coupon_code` |

Frontend không gửi price hoặc totals. Backend trả `subtotal`, `discount`, `shipping_fee`, `grand_total` và item prices đã xác nhận.

### Authentication

Checkout preview dùng Sanctum Bearer token hiện lưu theo cơ chế auth frontend hiện tại. Không log token.

### Compatibility

- Route không đổi: `POST /api/checkout/preview`.
- `items` là optional; client cũ dùng server cart không bị ảnh hưởng.
- Phase này không gọi create order và không clear cart.

### Validation mapping

Frontend map Laravel 422 nested address fields, shipping, coupon và cart errors về đúng vùng form/summary.

### Bước tiếp theo

Phase tạo order phải tái sử dụng preview selections, gửi payment method/note theo Order contract, và chỉ clear local cart sau response order thành công.

## Phase 7: Create Order

### Endpoint

`POST /api/orders` với Sanctum Bearer token.

### Mapping

| Checkout state | Order payload |
|---|---|
| local cart identifiers | `items[].product_id`, `items[].quantity` |
| customer form | `customer_name`, `customer_email`, `customer_phone` |
| address fields | `shipping_address` string |
| selected shipping | `shipping_method_id` |
| validated coupon | `coupon_code` |
| COD/bank selection | `payment_method` |
| optional note | `note` |

Không gửi price/totals. Backend là nguồn sự thật và chạy transaction/stock lock.

### Success/Error

- COD dùng payment response `unpaid`.
- Bank transfer dùng response `pending_verification` và bank instruction snapshot.
- Laravel 422 được map theo field; 401 yêu cầu đăng nhập.
- Local cart chỉ clear sau create response thành công.
- Request lỗi giữ nguyên cart và form.

## Phase 8: Customer Account

### Authentication

- Mechanism: Sanctum Bearer personal access token.
- Token key hiện tại: `viet-ngoc-auth-token`.
- Login/Register response: `{user:{id,name,email},token}`.
- Profile response: `{user:{id,name,email}}`.
- Logout revoke current token; frontend xóa local token sau success.

### Routes frontend

- `/dang-nhap`
- `/dang-ky`
- `/tai-khoan`
- `/don-hang`
- `/don-hang/:orderId`

### Order mapping

- History dùng `GET /api/orders` và Laravel `data/meta` pagination.
- Detail dùng `GET /api/orders/{id}` và OrderPolicy ownership.
- UI dùng order item snapshot và totals backend, không lấy lại giá Product hiện tại.

### Compatibility

- Không đổi backend routes/response.
- Không chuyển auth sang cookie/JWT.
- Không tạo field Profile/Order không có trong Resource.
