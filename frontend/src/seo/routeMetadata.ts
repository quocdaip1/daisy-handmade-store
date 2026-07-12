export interface RouteMetadata {
  title: string
  description: string
  robots?: 'index, follow' | 'noindex, nofollow'
}

const brand = 'Daisy Handmade Store'

const metadata: Record<string, RouteMetadata> = {
  '/': { title: `${brand} | Trang sức cổ phục Việt`, description: 'Khám phá trang sức thủ công lấy cảm hứng từ cổ phục và vẻ đẹp văn hóa Việt Nam tại Daisy Handmade Store.' },
  '/san-pham': { title: `Bộ sưu tập trang sức Việt | ${brand}`, description: 'Khám phá các mẫu trang sức thủ công tinh tế, mang nét duyên cổ phục Việt từ Daisy Handmade Store.' },
  '/gioi-thieu': { title: `Câu chuyện Daisy | ${brand}`, description: 'Tìm hiểu hành trình gìn giữ nét đẹp Việt qua từng món trang sức thủ công của Daisy Handmade Store.' },
  '/lien-he': { title: `Liên hệ | ${brand}`, description: 'Liên hệ Daisy Handmade Store để được tư vấn về sản phẩm, đơn hàng và trang sức thủ công.' },
  '/gio-hang': { title: `Giỏ hàng | ${brand}`, description: 'Kiểm tra các sản phẩm đã chọn trong giỏ hàng Daisy.', robots: 'noindex, nofollow' },
  '/thanh-toan': { title: `Thanh toán | ${brand}`, description: 'Xác nhận thông tin giao hàng và phương thức thanh toán.', robots: 'noindex, nofollow' },
  '/dang-nhap': { title: `Đăng nhập | ${brand}`, description: 'Đăng nhập tài khoản khách hàng Daisy.', robots: 'noindex, nofollow' },
  '/dang-ky': { title: `Đăng ký | ${brand}`, description: 'Tạo tài khoản khách hàng Daisy.', robots: 'noindex, nofollow' },
  '/tai-khoan': { title: `Tài khoản | ${brand}`, description: 'Quản lý thông tin tài khoản Daisy.', robots: 'noindex, nofollow' },
  '/don-hang': { title: `Đơn hàng của tôi | ${brand}`, description: 'Theo dõi lịch sử đơn hàng Daisy.', robots: 'noindex, nofollow' },
  '/404': { title: `Không tìm thấy trang | ${brand}`, description: 'Trang bạn tìm kiếm không tồn tại.', robots: 'noindex, nofollow' },
}

const policies: Record<string, RouteMetadata> = {
  'van-chuyen': { title: `Chính sách vận chuyển | ${brand}`, description: 'Thông tin vận chuyển và giao nhận đơn hàng tại Daisy Handmade Store.' },
  'doi-tra': { title: `Chính sách đổi trả | ${brand}`, description: 'Điều kiện và quy trình đổi trả sản phẩm tại Daisy Handmade Store.' },
  'bao-mat': { title: `Chính sách bảo mật | ${brand}`, description: 'Cách Daisy Handmade Store thu thập và bảo vệ thông tin khách hàng.' },
  'thanh-toan': { title: `Chính sách thanh toán | ${brand}`, description: 'Các phương thức và quy định thanh toán tại Daisy Handmade Store.' },
  'dieu-khoan': { title: `Điều khoản sử dụng | ${brand}`, description: 'Điều khoản sử dụng website Daisy Handmade Store.' },
  'huong-dan-mua-hang': { title: `Hướng dẫn mua hàng | ${brand}`, description: 'Hướng dẫn chọn sản phẩm, đặt hàng và thanh toán tại Daisy Handmade Store.' },
}

export function getRouteMetadata(pathname: string): RouteMetadata {
  if (pathname.startsWith('/san-pham/')) return { title: `Chi tiết trang sức | ${brand}`, description: 'Xem hình ảnh, thông tin và tình trạng của sản phẩm trang sức thủ công Daisy.' }
  if (pathname.startsWith('/don-hang/')) return { ...metadata['/don-hang'], title: `Chi tiết đơn hàng | ${brand}` }
  if (pathname.startsWith('/chinh-sach/')) return policies[pathname.split('/').pop() ?? ''] ?? metadata['/404']
  return metadata[pathname] ?? metadata['/404']
}
