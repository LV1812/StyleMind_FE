import { Pencil, Plus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'

import type { DemoAction, DemoDatabase } from '@/app/store/types'
import type { ProductCategory } from '@/entities/product/model/types'
import { Button, Modal, TextField, ToggleSwitch, useToast } from '@/shared/ui'

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

      <div className="overflow-hidden rounded-xl border border-[#E5E0D8] bg-white shadow-[0_8px_24px_rgba(58,54,50,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left text-sm">
            <thead className="bg-[#FAF8F5] text-xs font-semibold uppercase tracking-wide text-[#6F6B67]">
              <tr>
                <th scope="col" className="w-16 px-4 py-3">#</th>
                <th scope="col" className="px-4 py-3">Danh mục</th>
                <th scope="col" className="px-4 py-3">Mô tả</th>
                <th scope="col" className="w-28 px-4 py-3 text-center">Trạng thái</th>
                <th scope="col" className="w-20 px-4 py-3 text-right">Sửa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D8]">
              {categories.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#6F6B67]">Chưa có danh mục.</td></tr>
              ) : categories.map(category => (
                <tr key={category.id} className="align-middle hover:bg-[#FAF8F5]/70">
                  <td className="px-4 py-3 font-semibold tabular-nums text-[#6F6B67]">#{category.order}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#222222]">{category.label}</p>
                    <span className="mt-1 inline-flex rounded-md bg-[#F5F2EE] px-2 py-0.5 text-xs italic text-[#6F6B67]">{category.id}</span>
                  </td>
                  <td className="max-w-[28rem] px-4 py-3 leading-5 text-[#6F6B67]">{category.description}</td>
                  <td className="px-4 py-3 text-center">
                    <ToggleSwitch
                      checked={category.active}
                      label={`Danh mục ${category.label}`}
                      onCheckedChange={active => {
                        dispatch({ type: 'admin/categoryStatusChanged', payload: { categoryId: category.id, active } })
                        toast.info(active ? 'Đã bật danh mục.' : 'Đã tắt danh mục.')
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 px-0"
                      aria-label={`Sửa danh mục ${category.label}`}
                      title="Sửa danh mục"
                      icon={<Pencil size={16} aria-hidden="true" />}
                      onClick={() => openEditModal(category.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
