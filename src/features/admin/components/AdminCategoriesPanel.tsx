import { Pencil, Plus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'

import type { DemoAction, DemoDatabase } from '@/app/store/types'
import type { ProductCategory } from '@/entities/product/model/types'
import { Button, Modal, TextField, useToast } from '@/shared/ui'

import { StatusBadge } from './AdminCommon'

interface AdminCategoriesPanelProps {
  database: DemoDatabase
  dispatch: React.Dispatch<DemoAction>
}

interface CategoryFormState {
  id: string
  label: string
  description: string
  order: string
}

function createInitialForm(nextOrder: number): CategoryFormState {
  return {
    id: '',
    label: '',
    description: '',
    order: String(nextOrder),
  }
}

function createFormFromCategory(category: ProductCategory): CategoryFormState {
  return {
    id: category.id,
    label: category.label,
    description: category.description,
    order: String(category.order),
  }
}

function buildCategory(form: CategoryFormState, existingCategory?: ProductCategory): ProductCategory {
  return {
    id: existingCategory?.id ?? form.id.trim(),
    label: form.label.trim(),
    description: form.description.trim(),
    active: existingCategory?.active ?? true,
    order: Number(form.order) || 0,
  }
}

export function AdminCategoriesPanel({ database, dispatch }: AdminCategoriesPanelProps) {
  const toast = useToast()
  const nextOrder = Math.max(0, ...database.categories.map(category => category.order)) + 1
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryFormState>(() => createInitialForm(nextOrder))
  const [formError, setFormError] = useState<string | null>(null)

  const categories = useMemo(
    () => [...database.categories].sort((first, second) => first.order - second.order),
    [database.categories],
  )
  const editingCategory = editingCategoryId ? database.categories.find(category => category.id === editingCategoryId) : undefined

  const openCreateModal = () => {
    setEditingCategoryId(null)
    setForm(createInitialForm(nextOrder))
    setFormError(null)
    setModalOpen(true)
  }

  const openEditModal = (categoryId: string) => {
    const category = database.categories.find(item => item.id === categoryId)
    if (!category) return

    setEditingCategoryId(categoryId)
    setForm(createFormFromCategory(category))
    setFormError(null)
    setModalOpen(true)
  }

  const updateField = (field: keyof CategoryFormState, value: string) => {
    setForm(current => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const categoryId = editingCategoryId ?? form.id.trim()
    const duplicate = database.categories.some(category => category.id === categoryId && category.id !== editingCategoryId)

    if (!categoryId || !form.label.trim()) {
      setFormError('Vui lòng nhập mã và tên danh mục.')
      return
    }

    if (duplicate) {
      setFormError('Mã danh mục đã tồn tại.')
      return
    }

    dispatch({ type: 'admin/categoryUpserted', payload: buildCategory(form, editingCategory) })
    toast.success(editingCategoryId ? 'Đã cập nhật danh mục.' : 'Đã thêm danh mục demo.')
    setModalOpen(false)
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#684B5A]">Cấu trúc cửa hàng</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-[#222222] md:text-4xl">
            Quản lý danh mục
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6F6B67]">
            Sắp xếp nhóm sản phẩm quần áo nữ đang hiển thị trong cửa hàng.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal} icon={<Plus size={17} aria-hidden="true" />}>
          Thêm danh mục
        </Button>
      </div>

      <div className="grid gap-3">
        {categories.map(category => (
          <article
            key={category.id}
            className="grid gap-3 rounded-lg bg-white p-4 shadow-[0_10px_28px_rgba(58,54,50,0.07)] md:grid-cols-[88px_minmax(0,1fr)_auto] md:items-center"
          >
            <div className="text-sm font-semibold tabular-nums text-[#8A8179]">#{category.order}</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl font-semibold text-[#222222]">{category.label}</h2>
                <StatusBadge tone={category.active ? 'success' : 'neutral'}>{category.active ? 'Đang bật' : 'Đã tắt'}</StatusBadge>
              </div>
              <p className="mt-1 break-all text-sm font-semibold text-[#684B5A]">{category.id}</p>
              <p className="mt-2 text-sm leading-6 text-[#6F6B67]">{category.description}</p>
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Button
                type="button"
                variant="secondary"
                icon={<Pencil size={16} aria-hidden="true" />}
                onClick={() => openEditModal(category.id)}
              >
                Sửa danh mục {category.id}
              </Button>
              <Button
                type="button"
                variant={category.active ? 'danger' : 'secondary'}
                onClick={() => {
                  dispatch({
                    type: 'admin/categoryStatusChanged',
                    payload: { categoryId: category.id, active: !category.active },
                  })
                  toast.info(category.active ? 'Đã tắt danh mục.' : 'Đã bật danh mục.')
                }}
              >
                {category.active ? `Tắt danh mục ${category.id}` : `Bật danh mục ${category.id}`}
              </Button>
            </div>
          </article>
        ))}
      </div>

      <Modal
        open={modalOpen}
        title={editingCategoryId ? 'Sửa danh mục' : 'Thêm danh mục'}
        description="Danh mục sẽ xuất hiện trong bộ lọc sản phẩm admin và cửa hàng khi đang bật."
        onClose={() => setModalOpen(false)}
      >
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {formError && <p className="rounded-lg bg-[#FCEAEA] p-3 text-sm font-semibold text-[#A94B4B]">{formError}</p>}
          <TextField
            label="ID danh mục"
            value={form.id}
            readOnly={Boolean(editingCategoryId)}
            className={editingCategoryId ? 'bg-[#F5F2EE]' : ''}
            onChange={event => updateField('id', event.target.value)}
          />
          <TextField label="Tên danh mục" value={form.label} onChange={event => updateField('label', event.target.value)} />
          <TextField label="Mô tả danh mục" value={form.description} onChange={event => updateField('description', event.target.value)} />
          <TextField
            label="Thứ tự hiển thị"
            type="number"
            min="0"
            value={form.order}
            onChange={event => updateField('order', event.target.value)}
          />
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Lưu danh mục</Button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
