import type { ChangeEvent } from 'react'

import { MAX_PRODUCT_IMAGES, PRODUCT_IMAGE_TYPES, moveGalleryItem } from '../../utils/productGallery'

interface Props {
  images: string[]
  coverImage?: string
  files: File[]
  error?: string
  onImagesChange: (images: string[]) => void
  onCoverChange: (image?: string) => void
  onFilesChange: (files: File[]) => void
}

export function ProductGalleryEditor({ images, coverImage, files, error, onImagesChange, onCoverChange, onFilesChange }: Props) {
  const move = (index: number, offset: number) => {
    onImagesChange(moveGalleryItem(images, index, offset))
  }
  const selectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    onFilesChange([...files, ...selected])
    event.target.value = ''
  }
  return <fieldset className="admin-image-manager">
    <legend>Ảnh sản phẩm</legend>
    <p>Tối đa {MAX_PRODUCT_IMAGES} ảnh. Chưa chọn đại diện riêng sẽ dùng ảnh đầu tiên.</p>
    <div className="admin-current-images">{images.map((image, index) => <div key={image}>
      <img src={image} alt={`Ảnh ${index + 1}`} />
      <button type="button" disabled={index === 0} onClick={() => move(index, -1)}>Lên</button>
      <button type="button" disabled={index === images.length - 1} onClick={() => move(index, 1)}>Xuống</button>
      <button type="button" aria-pressed={coverImage === image} onClick={() => onCoverChange(coverImage === image ? undefined : image)}>{coverImage === image ? 'Bỏ chọn đại diện' : 'Chọn đại diện'}</button>
      <button type="button" onClick={() => { onImagesChange(images.filter((item) => item !== image)); if (coverImage === image) onCoverChange(undefined) }}>Gỡ ảnh</button>
    </div>)}</div>
    <label><span>Thêm ảnh JPG, PNG hoặc WebP (tối đa 5 MB/ảnh)</span><input type="file" multiple accept={PRODUCT_IMAGE_TYPES.join(',')} onChange={selectFiles} /></label>
    {files.map((file, index) => <p key={`${file.name}-${index}`}>{file.name} <button type="button" disabled={index === 0} onClick={() => onFilesChange(moveGalleryItem(files, index, -1))}>File lên</button><button type="button" disabled={index === files.length - 1} onClick={() => onFilesChange(moveGalleryItem(files, index, 1))}>File xuống</button><button type="button" onClick={() => onFilesChange(files.filter((_, item) => item !== index))}>Bỏ file</button></p>)}
    {files.length > 0 && <small>Lưu để upload; mở lại chỉnh sửa để chọn đại diện, sắp xếp hoặc gắn ảnh mới cho màu.</small>}
    {error && <small role="alert">{error}</small>}
  </fieldset>
}
