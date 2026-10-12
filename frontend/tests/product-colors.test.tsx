import { useContext, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProductDetailPage } from '../src/pages/ProductDetailPage'
import { ProductGalleryEditor } from '../src/components/admin/ProductGalleryEditor'
import { CartProvider } from '../src/context/CartContext.tsx'
import { CartContext } from '../src/context/CartContext'
import { productSelectionKey } from '../src/utils/productSelection'
import { ProductCard } from '../src/components/ProductCard'
import type { Product } from '../src/types/product'
import { fetchProductDetail, fetchRelatedProducts } from '../src/services/api'

vi.mock('../src/services/api', () => ({ fetchProductDetail: vi.fn(), fetchRelatedProducts: vi.fn() }))

const product: Product = {
  id: 1, name: 'Color product', slug: 'colors', categoryId: 1, description: 'Description', shortDescription: '',
  price: 100, material: 'Silver', color: 'Legacy', stock: 5, inventoryMode: 'variant',
  images: ['/all.png', '/red.png', '/blue.png'], featured: false, isNew: false, rating: 5,
  variants: [{ id: 10, colorName: 'Red', stock: 3, images: ['/red.png'], active: true }, { id: 11, colorName: 'Blue', stock: 2, images: ['/blue.png'], active: true }, { id: 12, colorName: 'Empty', stock: 0, images: [], active: true }],
}

function CartSummary() {
  const { cartItems } = useContext(CartContext)
  return <output data-testid="cart">{cartItems.map((item) => `${productSelectionKey(item.product.id, item.variantId)}:${item.colorName}:${item.quantity}`).join('|')}</output>
}

function Detail() {
  return <MemoryRouter initialEntries={['/san-pham/colors']}><CartProvider><Routes><Route path="/san-pham/:slug" element={<ProductDetailPage />} /></Routes><CartSummary /></CartProvider></MemoryRouter>
}

function Gallery() {
  const [images, setImages] = useState(['/a.png', '/b.png'])
  const [coverImage, setCover] = useState<string>()
  const [files, setFiles] = useState<File[]>([])
  return <><ProductGalleryEditor images={images} coverImage={coverImage} files={files} onImagesChange={setImages} onCoverChange={setCover} onFilesChange={setFiles} /><output data-testid="gallery">{JSON.stringify({ images, coverImage, files: files.map((file) => file.name) })}</output></>
}

beforeEach(() => {
  localStorage.clear()
  vi.mocked(fetchProductDetail).mockResolvedValue(product)
  vi.mocked(fetchRelatedProducts).mockResolvedValue([])
})
afterEach(cleanup)

describe('product colors', () => {
  it('shows total before selection, changes gallery/stock, caps quantity and keeps two colors after remount', async () => {
    const user = userEvent.setup()
    const view = render(<Detail />)
    await screen.findByText('Còn 5 sản phẩm · Tổng tồn')
    expect((screen.getByRole('button', { name: 'Mua ngay' }) as HTMLButtonElement).disabled).toBe(true)
    await user.click(screen.getByRole('button', { name: /Red/ }))
    expect(screen.getByAltText('Color product').getAttribute('src')).toBe('/red.png')
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '99' } })
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('3')
    await user.click(screen.getByRole('button', { name: 'Thêm vào giỏ hàng' }))
    await user.click(screen.getByRole('button', { name: /Blue/ }))
    expect(screen.getByAltText('Color product').getAttribute('src')).toBe('/blue.png')
    await user.click(screen.getByRole('button', { name: 'Thêm vào giỏ hàng' }))
    expect(screen.getByTestId('cart').textContent).toBe('1:10:Red:3|1:11:Blue:1')
    await user.click(screen.getByRole('button', { name: /Empty/ }))
    expect((screen.getByRole('button', { name: 'Mua ngay' }) as HTMLButtonElement).disabled).toBe(true)
    view.unmount()
    render(<Detail />)
    await waitFor(() => expect(screen.getByTestId('cart').textContent).toBe('1:10:Red:3|1:11:Blue:1'))
  })

  it('keeps legacy shared products purchasable without inventing colors', async () => {
    vi.mocked(fetchProductDetail).mockResolvedValue({ ...product, inventoryMode: 'shared', variants: undefined })
    render(<Detail />)
    await screen.findByText('Color product', { selector: 'h1' })
    expect((screen.getByRole('button', { name: 'Mua ngay' }) as HTMLButtonElement).disabled).toBe(false)
    expect(screen.queryByRole('button', { name: /Red/ })).toBeNull()
  })
})

it('accumulates file selections, reorders images and clears a removed cover', async () => {
  const user = userEvent.setup()
  const { container } = render(<Gallery />)
  const input = container.querySelector<HTMLInputElement>('input[type=file]')!
  await user.upload(input, new File(['a'], 'first.png', { type: 'image/png' }))
  await user.upload(input, new File(['b'], 'second.png', { type: 'image/png' }))
  await user.click(screen.getAllByRole('button', { name: 'Xuống' })[0])
  await user.click(screen.getAllByRole('button', { name: 'Chọn đại diện' })[0])
  expect(JSON.parse(screen.getByTestId('gallery').textContent!)).toEqual({ images: ['/b.png', '/a.png'], coverImage: '/b.png', files: ['first.png', 'second.png'] })
  await user.click(screen.getAllByRole('button', { name: 'Gỡ ảnh' })[0])
  expect(JSON.parse(screen.getByTestId('gallery').textContent!)).toEqual({ images: ['/a.png'], files: ['first.png', 'second.png'] })
})

it('uses the selected cover and falls back to the first image in product lists', () => {
  const view = render(<MemoryRouter><ProductCard product={{ ...product, coverImage: '/blue.png' }} onAddToCart={vi.fn()} /></MemoryRouter>)
  expect(screen.getByAltText('Color product').getAttribute('src')).toBe('/blue.png')
  expect(screen.getByRole('button', { name: 'Chọn màu' })).toBeTruthy()
  view.rerender(<MemoryRouter><ProductCard product={product} onAddToCart={vi.fn()} /></MemoryRouter>)
  expect(screen.getByAltText('Color product').getAttribute('src')).toBe('/all.png')
})
