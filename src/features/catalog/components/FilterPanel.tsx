import type { ReactNode } from 'react'

import type { ProductSize } from '@/entities/product/model/types'
import { Button } from '@/shared/ui'

import type { CatalogFilters, CatalogSort } from '../model/types'

interface Option {
  id: string
  label: string
}

interface FilterPanelProps {
  filters: CatalogFilters
  categories: Option[]
  styles: Option[]
  occasions: Option[]
  colors: string[]
  sizes: ProductSize[]
  onChange: (filters: CatalogFilters) => void
  onClear: () => void
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value]
}

function toggleSize(list: ProductSize[], value: ProductSize) {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value]
}

export function FilterPanel({ filters, categories, styles, occasions, colors, sizes, onChange, onClear }: FilterPanelProps) {
  const updatePrice = (field: 'min' | 'max', value: string) => {
    const numericValue = value ? Number(value) : field === 'min' ? 0 : Number.MAX_SAFE_INTEGER
    onChange({ ...filters, price: { ...filters.price, [field]: numericValue } })
  }

  return (
    <aside className="grid gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-[#222222]">Bộ lọc</h2>
        <Button variant="ghost" onClick={onClear} className="min-h-9 px-3">
          Xóa bộ lọc
        </Button>
      </div>
      <FilterGroup title="Danh mục">
        {categories.map(category => (
          <Checkbox
            key={category.id}
            label={category.label}
            checked={filters.categoryIds.includes(category.id)}
            onChange={() => onChange({ ...filters, categoryIds: toggle(filters.categoryIds, category.id) })}
          />
        ))}
      </FilterGroup>
      <FilterGroup title="Màu sắc">
        {colors.map(color => (
          <Checkbox
            key={color}
            label={color}
            checked={filters.colors.includes(color)}
            onChange={() => onChange({ ...filters, colors: toggle(filters.colors, color) })}
          />
        ))}
      </FilterGroup>
      <FilterGroup title="Kích thước">
        <div className="grid grid-cols-3 gap-2">
          {sizes.map(size => (
            <label key={size} className="inline-flex items-center gap-2 text-sm font-semibold text-[#3A3632]">
              <input
                type="checkbox"
                checked={filters.sizes.includes(size)}
                onChange={() => onChange({ ...filters, sizes: toggleSize(filters.sizes, size) })}
                className="h-4 w-4 accent-[#684B5A]"
              />
              {size}
            </label>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Phong cách">
        {styles.map(style => (
          <Checkbox
            key={style.id}
            label={style.label}
            checked={filters.styles.includes(style.id)}
            onChange={() => onChange({ ...filters, styles: toggle(filters.styles, style.id) })}
          />
        ))}
      </FilterGroup>
      <FilterGroup title="Dịp sử dụng">
        {occasions.map(occasion => (
          <Checkbox
            key={occasion.id}
            label={occasion.label}
            checked={filters.occasions.includes(occasion.id)}
            onChange={() => onChange({ ...filters, occasions: toggle(filters.occasions, occasion.id) })}
          />
        ))}
      </FilterGroup>
      <FilterGroup title="Khoảng giá">
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-xs font-semibold text-[#6F6B67]">
            Từ
            <input
              type="number"
              min={0}
              value={filters.price.min || ''}
              onChange={event => updatePrice('min', event.target.value)}
              placeholder="0"
              className="min-h-10 rounded-lg border border-[#D8D0C6] bg-white px-3 text-sm font-semibold text-[#222222] outline-none focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-[#6F6B67]">
            Đến
            <input
              type="number"
              min={0}
              value={filters.price.max === Number.MAX_SAFE_INTEGER ? '' : filters.price.max}
              onChange={event => updatePrice('max', event.target.value)}
              placeholder="Không giới hạn"
              className="min-h-10 rounded-lg border border-[#D8D0C6] bg-white px-3 text-sm font-semibold text-[#222222] outline-none focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20"
            />
          </label>
        </div>
      </FilterGroup>
      <label className="grid gap-2 text-sm font-semibold text-[#3A3632]">
        Sắp xếp
        <select
          value={filters.sort}
          onChange={event => onChange({ ...filters, sort: event.target.value as CatalogSort })}
          className="min-h-11 rounded-lg border border-[#D8D0C6] bg-white px-3 text-sm outline-none focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20"
        >
          <option value="featured">Nổi bật</option>
          <option value="newest">Mới nhất</option>
          <option value="price-asc">Giá tăng dần</option>
          <option value="price-desc">Giá giảm dần</option>
        </select>
      </label>
    </aside>
  )
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-2 text-sm font-bold text-[#222222]">{title}</legend>
      {children}
    </fieldset>
  )
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#3A3632]">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-[#684B5A]" />
      {label}
    </label>
  )
}
