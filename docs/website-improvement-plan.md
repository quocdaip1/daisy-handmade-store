# Kế hoạch cải tiến website Daisy Handmade Store

## Phạm vi và nguồn tham chiếu

Kế hoạch dựa trên source code hiện tại, logo Daisy Handmade Store và `Checklist_Yeu_Cau_Website_Ban_Hang_1.xlsx`. Lần triển khai này chỉ tác động frontend ở hệ thống màu/typography, Header, Hero trang chủ và Product Card; không thay đổi backend, API, route, dữ liệu hay logic giỏ hàng.

## Hiện trạng dự án

- `frontend`: React 19, TypeScript, Vite và React Router; CSS dùng chung tại `src/index.css`; dữ liệu tải qua `src/services`.
- `backend`: Laravel/PHP, nằm ngoài phạm vi chỉnh sửa.
- UI được tách theo `layouts`, `routes`, `pages`, `components`, `context`, `services`, `types`.
- Giỏ hàng dùng React Context và `localStorage`, cần giữ nguyên hành vi.
- Header, Hero và Product Card có cấu trúc cơ bản nhưng nhận diện cũ chưa khớp logo, phân cấp nội dung và CTA còn yếu.

## Yêu cầu chính từ checklist

- Thương hiệu Daisy Handmade Store; màu vàng, trắng, đen.
- Ngành hàng trang sức cổ phục; khách hàng chính là người trẻ có hiểu biết về Việt phục.
- Responsive, tải nhanh, dễ sử dụng và dễ mua hàng.
- Sản phẩm cần thể hiện ảnh, giá, mô tả, tồn kho; website có danh mục, tìm kiếm/lọc, giỏ hàng và checkout.
- Quản trị, thanh toán, vận chuyển và marketing là yêu cầu dài hạn, không thuộc lần chỉnh sửa này.

## Định hướng thiết kế

- Vàng hoa cúc `#F4B400` cho thương hiệu và CTA; vàng nhạt `#FFF4C7` cho nền nhấn.
- Than đậm `#292725` cho chữ; kem `#FFFCF4` cho nền trang; trắng cho bề mặt card.
- Heading dùng Georgia tạo cảm giác mềm mại, truyền thống; nội dung dùng Segoe UI/sans-serif để dễ đọc và không tải font ngoài.
- Phân cấp rõ bằng kích thước, độ đậm và khoảng trắng; focus state có độ tương phản tốt.

## Hạng mục triển khai

1. Chuẩn hóa design tokens màu, font, radius, shadow và focus state.
2. Header dùng logo thật, tên thương hiệu, active navigation, icon SVG, badge giỏ hàng và mobile menu accessible.
3. Hero có thông điệp phù hợp trang sức cổ phục, hai CTA, điểm tin cậy và minh họa hoa cúc nhẹ bằng CSS.
4. Product Card có ảnh lazy-load, badge, rating, hierarchy giá, CTA rõ và trạng thái hết hàng.
5. Kiểm tra responsive, lint và production build.

## Đề xuất cho giai đoạn sau

- Đồng bộ nhận diện sang Footer và các trang nội dung trong một đợt riêng.
- Bổ sung skeleton/loading và trạng thái lỗi API.
- Chuẩn hóa ảnh sản phẩm WebP/AVIF và kích thước từ backend.
- Ưu tiên các yêu cầu checklist còn thiếu: lịch sử đơn hàng, lưu địa chỉ, phí vận chuyển, chính sách và SEO cơ bản.
