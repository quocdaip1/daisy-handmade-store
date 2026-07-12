import { Link } from 'react-router-dom'
import logo from '../assets/daisy-logo.webp'

const policyLinks = [
  ['/chinh-sach/van-chuyen', 'Chính sách vận chuyển'], ['/chinh-sach/doi-tra', 'Chính sách đổi trả'],
  ['/chinh-sach/bao-mat', 'Chính sách bảo mật'], ['/chinh-sach/thanh-toan', 'Chính sách thanh toán'],
] as const

export function Footer() {
  return <footer className="footer-shell"><div className="site-footer"><div className="footer-brand"><Link to="/" className="footer-logo"><img src={logo} alt="Logo Daisy Handmade Store" /><span><strong>Daisy</strong><small>Handmade Store</small></span></Link><p>Trang sức thủ công lấy cảm hứng từ cổ phục và vẻ đẹp văn hóa Việt Nam.</p><div className="footer-socials" aria-label="Kênh mạng xã hội"><span>Facebook</span><span>Messenger</span><small>Đường dẫn chính thức đang được cập nhật.</small></div></div><nav className="footer-column" aria-label="Menu nhanh"><h3>Menu nhanh</h3><Link to="/">Trang chủ</Link><Link to="/san-pham">Sản phẩm</Link><Link to="/gioi-thieu">Câu chuyện Daisy</Link><Link to="/lien-he">Liên hệ</Link><Link to="/chinh-sach/huong-dan-mua-hang">Hướng dẫn mua hàng</Link><Link to="/chinh-sach/dieu-khoan">Điều khoản sử dụng</Link></nav><nav className="footer-column" aria-label="Chính sách"> <h3>Chính sách</h3>{policyLinks.map(([path, label]) => <Link key={path} to={path}>{label}</Link>)}</nav><div className="footer-column footer-contact"><h3>Ghé thăm Daisy</h3><address>Khu phố Hương Phước, phường Phước Tân, thành phố Đồng Nai.</address><a href="tel:0349671134">0349 671 134</a><p>Thứ 2 – Chủ nhật: 8:00 – 21:00</p></div></div><div className="footer-bottom"><span>© 2026 Daisy Handmade Store.</span><span>Gìn giữ nét Việt · Gửi trao bằng cả tấm lòng</span></div></footer>
}
