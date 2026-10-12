import { Link } from 'react-router-dom'

export function LoadingSkeleton({ count = 4 }: { count?: number }) {
  return <div className="home-skeleton-grid" aria-label="Đang tải nội dung">{Array.from({ length: count }, (_, index) => <span key={index} className="home-skeleton-card" />)}</div>
}

export function EmptyState({ message }: { message: string }) {
  return <div className="home-data-state"><span aria-hidden="true">✿</span><p>{message}</p><Link to="/san-pham" className="section-link">Khám phá sản phẩm <span aria-hidden="true">→</span></Link></div>
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <div className="home-data-state error" role="alert"><span aria-hidden="true">!</span><p>Chưa thể tải nội dung lúc này. Bạn vui lòng thử lại.</p><button type="button" onClick={onRetry}>Thử lại</button></div>
}
