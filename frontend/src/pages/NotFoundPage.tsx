import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="empty-state">
      <h1>404</h1>
      <p>Trang bạn đang tìm kiếm không tồn tại.</p>
      <Link to="/" className="button button-primary">
        Quay về trang chủ
      </Link>
    </div>
  )
}
