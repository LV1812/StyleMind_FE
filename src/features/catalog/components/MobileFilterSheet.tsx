import { SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { ProductSize } from '@/entities/product/model/types'
import { Button, Modal } from '@/shared/ui'

import { FilterPanel } from './FilterPanel'
import type { CatalogFilters } from '../model/types'

interface Option {
  id: string
  label: string
}

interface MobileFilterSheetProps {
  filters: CatalogFilters
  emptyFilters: CatalogFilters
  categories: Option[]
  styles: Option[]
  occasions: Option[]
  colors: string[]
  sizes: ProductSize[]
  onApply: (filters: CatalogFilters) => void
  onClear: () => void
}

export function MobileFilterSheet({
  filters,
  emptyFilters,
  categories,
  styles,
  occasions,
  colors,
  sizes,
  onApply,
  onClear,
}: MobileFilterSheetProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(filters)

  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  return (
    <>
      <Button variant="secondary" icon={<SlidersHorizontal size={17} aria-hidden="true" />} onClick={() => setOpen(true)} className="md:hidden">
        Bộ lọc
      </Button>
      <Modal
        open={open}
        title="Bộ lọc"
        description="Chọn điều kiện lọc rồi áp dụng cho danh sách sản phẩm."
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                onClear()
                setOpen(false)
              }}
            >
              Xóa bộ lọc
            </Button>
            <Button
              onClick={() => {
                onApply(draft)
                setOpen(false)
              }}
            >
              Áp dụng
            </Button>
          </>
        }
      >
        <FilterPanel
          filters={draft}
          categories={categories}
          styles={styles}
          occasions={occasions}
          colors={colors}
          sizes={sizes}
          onChange={setDraft}
          onClear={() => setDraft(emptyFilters)}
        />
      </Modal>
    </>
  )
}
