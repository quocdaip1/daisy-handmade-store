interface Props {
  material: string
  description?: string
}

export function ProductDetailInformation({ material, description }: Props) {
  if (!material.trim() && !description?.trim()) return null

  return <section className="detail-information" aria-label="Thông tin chi tiết">
    <h2>Thông tin chi tiết</h2>
    {description ? <p>{description}</p> : null}
    {material.trim() ? <dl><div><dt>Chất liệu</dt><dd>{material}</dd></div></dl> : null}
  </section>
}
