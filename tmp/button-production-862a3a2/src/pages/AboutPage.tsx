import { Link } from 'react-router-dom'

export function AboutPage() {
  return (
    <main className="content-page about-page">
      <section className="about-hero" aria-labelledby="about-title">
        <div className="about-hero-copy">
          <p className="eyebrow">Câu chuyện của Daisy</p>
          <h1 id="about-title">Nét Việt trong từng món trang sức</h1>
          <p>Daisy Handmade Store mang cảm hứng từ cổ phục và văn hóa Việt Nam vào những thiết kế trang sức thủ công dành cho đời sống hôm nay.</p>
          <div className="about-actions"><Link to="/san-pham" className="button button-primary">Khám phá sản phẩm</Link><Link to="/lien-he" className="button button-secondary">Trò chuyện với Daisy</Link></div>
        </div>
        <div className="about-mark" aria-hidden="true"><span>D</span><small>Handmade with care</small></div>
      </section>

      <section className="about-story" aria-labelledby="about-story-title">
        <div><p className="eyebrow">Daisy Handmade Store</p><h2 id="about-story-title">Trang sức kể một câu chuyện</h2></div>
        <div className="about-story-copy"><p>Chúng mình tin rằng một món trang sức đẹp không chỉ hoàn thiện trang phục, mà còn lưu giữ cảm xúc và dấu ấn riêng của người đeo.</p><p>Vì vậy, Daisy hướng đến những thiết kế hài hòa giữa nét truyền thống và tinh thần hiện đại, phù hợp với áo dài, Việt phục, những dịp đặc biệt và cả khoảnh khắc thường ngày.</p></div>
      </section>

      <section className="about-values" aria-labelledby="about-values-title">
        <div className="about-section-heading"><p className="eyebrow">Điều Daisy trân trọng</p><h2 id="about-values-title">Ba giá trị trong mỗi lựa chọn</h2></div>
        <div className="about-value-grid">
          <article><span>01</span><h3>Cảm hứng Việt</h3><p>Họa tiết, màu sắc và tinh thần thiết kế được gợi mở từ vẻ đẹp văn hóa Việt Nam.</p></article>
          <article><span>02</span><h3>Chỉn chu trong chi tiết</h3><p>Mỗi sản phẩm được giới thiệu với thông tin rõ ràng để bạn dễ dàng tìm thấy lựa chọn phù hợp.</p></article>
          <article><span>03</span><h3>Tư vấn tận tâm</h3><p>Daisy sẵn lòng lắng nghe nhu cầu về phong cách, trang phục và món quà bạn đang tìm kiếm.</p></article>
        </div>
      </section>

      <section className="about-visit"><div><p className="eyebrow">Ghé thăm Daisy</p><h2>Để chúng mình đồng hành cùng lựa chọn của bạn</h2><p>Khu phố Hương Phước, phường Phước Tân, thành phố Đồng Nai.</p></div><Link to="/lien-he" className="button button-primary">Liên hệ ngay <span aria-hidden="true">→</span></Link></section>
    </main>
  )
}
