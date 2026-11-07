import { useEffect, useState } from 'react'

import type { ProductImage } from '@/entities/product/model/types'

interface ProductGalleryProps {
  images: ProductImage[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedImage = images[selectedIndex] ?? images[0]

  useEffect(() => {
    setSelectedIndex(0)
  }, [images])

  if (!selectedImage) {
    return (
      <div className="grid aspect-[3/4] place-items-center rounded-lg bg-[#EFEDED] text-sm font-semibold text-[#5E5F5D]">
        Chưa có hình ảnh
      </div>
    )
  }

  return (
    <section aria-label={`Hình ảnh ${productName}`} className="grid gap-3">
      <div className="overflow-hidden rounded-lg bg-[#EFEDED]">
        <img src={selectedImage.url} alt={selectedImage.alt} className="aspect-[3/4] w-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              aria-label={`Xem ảnh ${index + 1} của ${productName}`}
              aria-pressed={index === selectedIndex}
              onClick={() => setSelectedIndex(index)}
              className={`overflow-hidden rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B] ${
                index === selectedIndex ? 'border-[#1C1B1B]' : 'border-[#C4C7C7] hover:border-[#8B6475]'
              }`}
            >
              <img src={image.url} alt={image.alt} className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
