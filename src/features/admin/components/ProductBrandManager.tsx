import { useEffect, useRef, useState } from "react"
import { commerceApi } from "@/api/commerce"
import type {
  CatalogReference,
  CatalogReferenceInput,
} from "@/api/commerce.types"
import { CommerceApiError } from "@/api/http"
import { normalizeColorName } from "@/shared/lib/colorSwatch"
import { Button, TextField } from "@/shared/ui"

interface Props {
  onChanged: (brands: CatalogReference[], selectedId?: string) => void
  onBusyChange: (busy: boolean) => void
  onClose: () => void
}

const emptyForm = (): CatalogReferenceInput => ({
  name: "",
  slug: "",
  is_active: true,
})
const brandSlug = (name: string) =>
  normalizeColorName(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

export default function ProductBrandManager({
  onChanged,
  onBusyChange,
  onClose,
}: Props) {
  const [brands, setBrands] = useState<CatalogReference[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [uncertain, setUncertain] = useState(false)
  const [loadVersion, setLoadVersion] = useState(0)
  const inFlight = useRef(false)
  const callbacks = useRef({ onChanged, onBusyChange })
  callbacks.current = { onChanged, onBusyChange }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")
    void commerceApi.brands
      .listAdmin()
      .then((result) => {
        if (!cancelled) {
          setBrands(result.items)
          callbacks.current.onChanged(result.items)
        }
      })
      .catch((failure) => {
        if (!cancelled)
          setError(
            failure instanceof Error
              ? failure.message
              : "Không tải được danh sách thương hiệu.",
          )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [loadVersion])

  const run = async (operation: () => Promise<void>) => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    callbacks.current.onBusyChange(true)
    setError("")
    setMessage("")
    try {
      await operation()
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Không thể cập nhật thương hiệu.",
      )
    } finally {
      inFlight.current = false
      setBusy(false)
      callbacks.current.onBusyChange(false)
    }
  }

  const upsert = (brand: CatalogReference, select = false) => {
    const next = [...brands.filter((item) => item.id !== brand.id), brand].sort(
      (a, b) => a.name.localeCompare(b.name, "vi"),
    )
    setBrands(next)
    onChanged(next, select && brand.is_active ? brand.id : undefined)
  }

  const save = () => {
    if (uncertain) return
    const input = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      is_active: form.is_active,
    }
    if (!input.name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
      setError(
        "Nhập tên thương hiệu và slug chỉ gồm chữ thường không dấu, số, dấu gạch ngang.",
      )
      return
    }
    if (
      brands.some((item) => item.id !== editingId && item.slug === input.slug)
    ) {
      setError(
        "Slug đã được sử dụng, kể cả thương hiệu đang ẩn. Vui lòng chọn slug khác.",
      )
      return
    }
    void run(async () => {
      let saved: CatalogReference
      try {
        saved = editingId
          ? await commerceApi.brands.replace(editingId, input)
          : await commerceApi.brands.create(input)
      } catch (failure) {
        if (
          !editingId &&
          (!(failure instanceof CommerceApiError) ||
            failure.status >= 500 ||
            failure.status === 408)
        ) {
          setUncertain(true)
          throw new Error(
            "Chưa xác định được kết quả thêm thương hiệu. Bấm “Kiểm tra kết quả” trước khi thử tiếp để tránh tạo trùng.",
          )
        }
        throw failure
      }
      upsert(saved, !editingId)
      setMessage(
        editingId
          ? "Đã cập nhật thương hiệu."
          : saved.is_active
            ? "Đã thêm và chọn thương hiệu cho sản phẩm."
            : "Đã thêm thương hiệu ở trạng thái ẩn.",
      )
      setEditingId(null)
      setForm(emptyForm())
    })
  }

  const checkResult = () =>
    void run(async () => {
      const result = await commerceApi.brands.listAdmin()
      setBrands(result.items)
      const found = result.items.find((item) => item.slug === form.slug.trim())
      if (
        found &&
        found.name.trim().toLocaleLowerCase("vi") !==
          form.name.trim().toLocaleLowerCase("vi")
      ) {
        onChanged(result.items)
        setUncertain(false)
        setError(
          "Slug đang thuộc về thương hiệu khác. Vui lòng chọn slug khác hoặc sửa thương hiệu đã có.",
        )
        return
      }
      onChanged(result.items, found?.is_active ? found.id : undefined)
      if (found) {
        setUncertain(false)
        setForm(emptyForm())
        setMessage("Đã tìm thấy thương hiệu. Danh sách đã được cập nhật.")
      } else
        setError(
          "Chưa tìm thấy thương hiệu. Kết quả tạo vẫn chưa rõ; hãy kiểm tra lại sau.",
        )
    })

  const edit = (id: string) =>
    void run(async () => {
      const brand = await commerceApi.brands.getAdmin(id)
      setEditingId(brand.id)
      setForm({
        name: brand.name,
        slug: brand.slug,
        is_active: brand.is_active,
      })
    })

  const changeVisibility = (brand: CatalogReference) =>
    void run(async () => {
      if (brand.is_active) {
        await commerceApi.brands.remove(brand.id)
        upsert({ ...brand, is_active: false })
        setMessage(`Đã ẩn thương hiệu ${brand.name}.`)
      } else {
        const saved = await commerceApi.brands.replace(brand.id, {
          name: brand.name,
          slug: brand.slug,
          is_active: true,
        })
        upsert(saved)
        setMessage(`Đã hiện lại thương hiệu ${brand.name}.`)
      }
      if (editingId === brand.id) {
        setEditingId(null)
        setForm(emptyForm())
      }
    })

  return (
    <section
      aria-label="Quản lý thương hiệu"
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
          event.preventDefault()
          if (!busy && !uncertain && event.target.type === "text") save()
        }
      }}
      className="grid gap-4 rounded-xl border border-[#C4C7C7] bg-[#FBF9F9] p-4 sm:col-span-2"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Quản lý thương hiệu</h3>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={onClose}
        >
          Đóng quản lý thương hiệu
        </Button>
      </div>
      <p className="text-sm text-[#5E5F5D]">
        Xem cả thương hiệu đã ẩn. Nút Ẩn sẽ ngừng hiển thị thương hiệu, không
        xóa vĩnh viễn.
      </p>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-green-800">
          {message}
        </p>
      )}
      {loading ? (
        <p role="status">Đang tải thương hiệu…</p>
      ) : (
        <>
          <fieldset
            disabled={busy || uncertain}
            className="grid min-w-0 gap-3 sm:grid-cols-2"
          >
            <legend className="mb-3 font-semibold">
              {editingId ? "Sửa thương hiệu" : "Thêm thương hiệu"}
            </legend>
            <TextField
              id="brand-manager-name"
              label="Tên thương hiệu"
              value={form.name}
              onChange={(event) => {
                const name = event.target.value
                setForm((current) => ({
                  ...current,
                  name,
                  slug:
                    !editingId &&
                    (!current.slug || current.slug === brandSlug(current.name))
                      ? brandSlug(name)
                      : current.slug,
                }))
              }}
            />
            <TextField
              id="brand-manager-slug"
              label="Slug thương hiệu"
              value={form.slug}
              onChange={(event) =>
                setForm({ ...form, slug: event.target.value })
              }
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  setForm({ ...form, is_active: event.target.checked })
                }
              />
              Thương hiệu đang hiển thị
            </label>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" size="sm" disabled={busy} onClick={save}>
                {editingId ? "Lưu thương hiệu" : "Thêm thương hiệu"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingId(null)
                    setForm(emptyForm())
                    setError("")
                  }}
                >
                  Hủy sửa
                </Button>
              )}
            </div>
          </fieldset>
          {uncertain && (
            <Button type="button" loading={busy} onClick={checkResult}>
              Kiểm tra kết quả
            </Button>
          )}
          <div className="max-h-72 overflow-auto rounded-lg border border-[#E3E2E2] bg-white">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Danh sách thương hiệu</caption>
              <thead>
                <tr className="border-b">
                  <th className="p-3">Thương hiệu</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {brands.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-[#5E5F5D]">
                      Chưa có thương hiệu.
                    </td>
                  </tr>
                ) : (
                  brands.map((brand) => (
                    <tr key={brand.id} className="border-b last:border-0">
                      <td className="p-3">
                        <p className="break-words font-semibold">
                          {brand.name}
                        </p>
                        <p className="break-all text-xs text-[#5E5F5D]">
                          {brand.slug}
                        </p>
                      </td>
                      <td className="p-3">
                        {brand.is_active ? "Đang hiển thị" : "Đã ẩn"}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={busy || uncertain}
                            aria-label={`Sửa thương hiệu ${brand.name}`}
                            onClick={() => edit(brand.id)}
                          >
                            Sửa
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              brand.is_active ? "danger-soft" : "secondary"
                            }
                            disabled={busy || uncertain}
                            aria-label={`${
                              brand.is_active ? "Ẩn" : "Hiện lại"
                            } thương hiệu ${brand.name}`}
                            onClick={() => changeVisibility(brand)}
                          >
                            {brand.is_active ? "Ẩn" : "Hiện lại"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      {!loading && error && !brands.length && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => setLoadVersion((value) => value + 1)}
        >
          Tải lại thương hiệu
        </Button>
      )}
    </section>
  )
}
