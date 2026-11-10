import { useEffect, useRef, useState, type FormEvent } from "react"
import { commerceApi } from "@/api/commerce"
import type { CatalogReference, CommerceProduct } from "@/api/commerce.types"
import { CommerceApiError } from "@/api/http"
import { Button, Modal, SelectField, TextField } from "@/shared/ui"
import { Plus } from "lucide-react"
import ProductBrandManager from "./ProductBrandManager"

interface Props {
  productId: string | null
  onSaved: (product: CommerceProduct) => void
  onClose: () => void
}

interface VariantDraft {
  key: string
  id?: string
  sku: string
  size: string
  color: string
  material: string
  price: string
  quantity: string
  active: boolean
  file: File | null
  altText: string
  imageUrl: string
}

const newVariant = (): VariantDraft => ({
  key: crypto.randomUUID(),
  sku: "",
  size: "M",
  color: "",
  material: "",
  price: "",
  quantity: "0",
  active: true,
  file: null,
  altText: "",
  imageUrl: "",
})

export default function AdminProductEditor({
  productId,
  onSaved,
  onClose,
}: Props) {
  const [product, setProduct] = useState({
    name: "",
    categoryId: "",
    brandId: "",
    description: "",
    demographic: "WOMEN",
    active: true,
  })
  const [variants, setVariants] = useState<VariantDraft[]>(() => [newVariant()])
  const [categories, setCategories] = useState<CatalogReference[]>([])
  const [brands, setBrands] = useState<CatalogReference[]>([])
  const [brandManagerOpen, setBrandManagerOpen] = useState(false)
  const [brandManagerBusy, setBrandManagerBusy] = useState(false)
  const brandInFlight = useRef(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [loadVersion, setLoadVersion] = useState(0)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState("")
  const [uncertain, setUncertain] = useState(false)
  const savedProductId = useRef(productId)
  const inFlight = useRef(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError("")
    void Promise.all([
      commerceApi.categories.list(),
      commerceApi.brands.list(),
      productId
        ? commerceApi.products.getAdmin(productId)
        : Promise.resolve(null),
    ])
      .then(([categoryList, brandList, existing]) => {
        if (cancelled) return
        setCategories(categoryList.items)
        setBrands(brandList.items)
        if (existing) {
          setProduct({
            name: existing.name,
            categoryId: existing.category_id,
            brandId: existing.brand_id,
            description: existing.description ?? "",
            demographic: existing.demographic_segment ?? "",
            active: existing.product_status === "ACTIVE",
          })
          setVariants(
            existing.variants.map((variant) => ({
              key: variant.variant_id,
              id: variant.variant_id,
              sku: variant.sku,
              size: variant.size ?? "",
              color: variant.color ?? "",
              material: variant.material ?? "",
              price: String(variant.unit_price_vnd),
              quantity: "0",
              active: variant.variant_status === "ACTIVE",
              file: null,
              altText: "",
              imageUrl:
                variant.images.find((image) => image.is_primary)?.image_url ??
                variant.images[0]?.image_url ??
                "",
            })),
          )
        }
      })
      .catch(() => {
        if (!cancelled)
          setLoadError(
            "Không tải được danh mục, thương hiệu hoặc thông tin sản phẩm. Vui lòng thử lại.",
          )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [productId, loadVersion])

  const updateVariant = (key: string, patch: Partial<VariantDraft>) =>
    setVariants((current) =>
      current.map((variant) =>
        variant.key === key ? { ...variant, ...patch } : variant,
      ),
    )
  const close = () => {
    if (!inFlight.current && !brandInFlight.current) onClose()
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (
      inFlight.current ||
      brandInFlight.current ||
      loading ||
      loadError ||
      uncertain
    )
      return
    setError("")
    if (
      !product.name.trim() ||
      !categories.some((item) => item.id === product.categoryId) ||
      !brands.some((item) => item.id === product.brandId)
    ) {
      setError(
        "Vui lòng nhập tên sản phẩm và chọn danh mục, thương hiệu có sẵn.",
      )
      return
    }
    const skus = new Set<string>()
    for (const [index, variant] of variants.entries()) {
      if (
        !variant.sku.trim() ||
        !variant.color.trim() ||
        !variant.size.trim()
      ) {
        setError(`Biến thể ${index + 1}: vui lòng nhập SKU, màu và kích thước.`)
        return
      }
      if (skus.has(variant.sku.trim().toUpperCase())) {
        setError("SKU của mỗi biến thể phải khác nhau.")
        return
      }
      skus.add(variant.sku.trim().toUpperCase())
      if (
        !variant.price.trim() ||
        !Number.isSafeInteger(Number(variant.price)) ||
        Number(variant.price) <= 0
      ) {
        setError(`Biến thể ${index + 1}: giá bán phải là số nguyên lớn hơn 0.`)
        return
      }
      if (
        !variant.id &&
        (!variant.quantity.trim() ||
          !Number.isSafeInteger(Number(variant.quantity)) ||
          Number(variant.quantity) < 0)
      ) {
        setError(
          `Biến thể ${index + 1}: số lượng phải là số nguyên từ 0 trở lên.`,
        )
        return
      }
      if (
        variant.file &&
        !["image/jpeg", "image/png", "image/webp"].includes(variant.file.type)
      ) {
        setError(`Biến thể ${index + 1}: vui lòng chọn ảnh JPG, PNG hoặc WebP.`)
        return
      }
    }
    inFlight.current = true
    setSaving(true)
    // Only an unacknowledged POST is ambiguous. Confirmed IDs survive a retry.
    let pendingPost = false
    try {
      setProgress("Đang lưu thông tin sản phẩm…")
      const input = {
        category_id: product.categoryId,
        brand_id: product.brandId,
        name: product.name.trim(),
        description: product.description.trim() || null,
        demographic_segment: product.demographic.trim() || null,
        product_status: product.active ? "ACTIVE" : "INACTIVE",
      }
      pendingPost = !savedProductId.current
      const saved = savedProductId.current
        ? await commerceApi.products.replace(savedProductId.current, input)
        : await commerceApi.products.create(input)
      savedProductId.current = saved.product_id
      pendingPost = false
      for (const [index, variant] of variants.entries()) {
        setProgress(`Đang lưu biến thể ${index + 1}/${variants.length}…`)
        const variantInput = {
          sku: variant.sku.trim(),
          size: variant.size.trim(),
          color: variant.color.trim(),
          material: variant.material.trim() || null,
          unit_price_vnd: Number(variant.price),
          variant_status: variant.active ? "ACTIVE" : "INACTIVE",
        }
        pendingPost = !variant.id
        const savedVariant = variant.id
          ? await commerceApi.products.replaceVariant(variant.id, variantInput)
          : await commerceApi.products.createVariant(saved.product_id, {
              ...variantInput,
              quantity: Number(variant.quantity),
            })
        pendingPost = false
        updateVariant(variant.key, { id: savedVariant.variant_id })
        if (variant.file) {
          setProgress(`Đang tải ảnh cho ${variant.color} · ${variant.size}…`)
          pendingPost = true
          const image = await commerceApi.products.uploadImage(
            savedVariant.variant_id,
            variant.file,
            variant.altText.trim() ||
              `${product.name.trim()} màu ${variant.color.trim()}`,
          )
          pendingPost = false
          updateVariant(variant.key, { file: null, imageUrl: image.image_url })
        }
      }
      setProgress("Đang cập nhật danh sách sản phẩm…")
      const refreshed = await commerceApi.products.getAdmin(saved.product_id)
      onSaved(refreshed)
    } catch (failure) {
      const unknownResult =
        pendingPost &&
        (!(failure instanceof CommerceApiError) ||
          failure.status >= 500 ||
          failure.status === 408)
      setUncertain(unknownResult)
      setError(
        unknownResult
          ? "Chưa xác định được kết quả lưu. Hãy đóng biểu mẫu, tải lại danh sách và kiểm tra sản phẩm, biến thể, ảnh trước khi tiếp tục."
          : `${
              failure instanceof Error
                ? failure.message
                : "Không thể hoàn tất lưu sản phẩm."
            }${
              savedProductId.current
                ? " Sản phẩm đã được lưu một phần. Bạn có thể sửa thông tin và thử lại trong biểu mẫu này."
                : ""
            }`,
      )
    } finally {
      inFlight.current = false
      setSaving(false)
      setProgress("")
    }
  }

  return (
    <Modal
      open
      layout="drawer"
      title={productId ? "Sửa sản phẩm" : "Thêm sản phẩm"}
      description="Nhập thông tin chung, thêm từng màu và kích thước, sau đó chọn ảnh đúng màu cho từng biến thể."
      onClose={close}
    >
      {loading ? (
        <p role="status" className="py-6">
          Đang tải thông tin…
        </p>
      ) : loadError ? (
        <div className="grid gap-3 py-6">
          <p role="alert">{loadError}</p>
          <Button onClick={() => setLoadVersion((value) => value + 1)}>
            Thử lại
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 grid gap-6" noValidate>
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
            >
              {error}
            </p>
          )}
          <fieldset
            disabled={saving || uncertain}
            className="grid min-w-0 gap-6 disabled:opacity-70"
          >
            <section className="grid gap-4 sm:grid-cols-2">
              <h3 className="border-b border-[#E3E2E2] pb-3 text-xl font-semibold sm:col-span-2">
                Thông tin sản phẩm
              </h3>
              <div className="sm:col-span-2">
                <TextField
                  label="Tên sản phẩm"
                  maxLength={160}
                  value={product.name}
                  onChange={(event) =>
                    setProduct({ ...product, name: event.target.value })
                  }
                />
              </div>
              <SelectField
                label="Danh mục"
                value={product.categoryId}
                onChange={(event) =>
                  setProduct({ ...product, categoryId: event.target.value })
                }
              >
                <option value="">Chọn danh mục</option>
                {categories
                  .filter(
                    (item) => item.is_active || item.id === product.categoryId,
                  )
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </SelectField>
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <SelectField
                    label="Thương hiệu"
                    value={product.brandId}
                    onChange={(event) =>
                      setProduct({ ...product, brandId: event.target.value })
                    }
                  >
                    <option value="">Chọn thương hiệu</option>
                    {brands
                      .filter(
                        (item) => item.is_active || item.id === product.brandId,
                      )
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                  </SelectField>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  aria-label="Quản lý thương hiệu"
                  title="Thêm và quản lý thương hiệu"
                  aria-expanded={brandManagerOpen}
                  disabled={brandManagerBusy}
                  icon={<Plus size={18} aria-hidden="true" />}
                  onClick={() => setBrandManagerOpen((value) => !value)}
                />
              </div>
              {brandManagerOpen && (
                <ProductBrandManager
                  onClose={() => setBrandManagerOpen(false)}
                  onBusyChange={(busy) => {
                    brandInFlight.current = busy
                    setBrandManagerBusy(busy)
                  }}
                  onChanged={(items, selectedId) => {
                    setBrands(items)
                    setProduct((current) => ({
                      ...current,
                      brandId:
                        selectedId ??
                        (items.some(
                          (item) =>
                            item.id === current.brandId && item.is_active,
                        )
                          ? current.brandId
                          : ""),
                    }))
                  }}
                />
              )}
              <TextField
                label="Đối tượng"
                placeholder="Ví dụ: WOMEN"
                value={product.demographic}
                onChange={(event) =>
                  setProduct({ ...product, demographic: event.target.value })
                }
              />
              <SelectField
                label="Trạng thái sản phẩm"
                value={product.active ? "ACTIVE" : "INACTIVE"}
                onChange={(event) =>
                  setProduct({
                    ...product,
                    active: event.target.value === "ACTIVE",
                  })
                }
              >
                <option value="ACTIVE">Đang bán</option>
                <option value="INACTIVE">Đã tắt</option>
              </SelectField>
              <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
                Mô tả
                <textarea
                  value={product.description}
                  onChange={(event) =>
                    setProduct({ ...product, description: event.target.value })
                  }
                  rows={4}
                  className="w-full rounded-lg border border-[#C4C7C7] p-3 font-normal"
                />
              </label>
            </section>
            <section className="grid gap-4">
              <div>
                <h3 className="text-xl font-semibold">Biến thể sản phẩm</h3>
                <p className="mt-1 text-sm text-[#5E5F5D]">
                  Mỗi màu và kích thước là một biến thể có SKU riêng. Ảnh chỉ
                  được gắn với biến thể bạn chọn.
                </p>
              </div>
              {variants.map((variant, index) => (
                <fieldset
                  key={variant.key}
                  className="grid min-w-0 gap-4 rounded-lg border border-[#E3E2E2] p-4 sm:grid-cols-2"
                >
                  <legend className="px-2 font-semibold">
                    Biến thể {index + 1}
                  </legend>
                  <TextField
                    id={`sku-${variant.key}`}
                    label="SKU"
                    value={variant.sku}
                    onChange={(event) =>
                      updateVariant(variant.key, { sku: event.target.value })
                    }
                  />
                  <TextField
                    id={`color-${variant.key}`}
                    label="Màu"
                    value={variant.color}
                    onChange={(event) =>
                      updateVariant(variant.key, { color: event.target.value })
                    }
                  />
                  <TextField
                    id={`size-${variant.key}`}
                    label="Size"
                    placeholder="Ví dụ: M, XL, 2XL"
                    value={variant.size}
                    onChange={(event) =>
                      updateVariant(variant.key, { size: event.target.value })
                    }
                  />
                  <TextField
                    id={`material-${variant.key}`}
                    label="Chất liệu"
                    value={variant.material}
                    onChange={(event) =>
                      updateVariant(variant.key, {
                        material: event.target.value,
                      })
                    }
                  />
                  <TextField
                    id={`price-${variant.key}`}
                    label="Giá bán (VND)"
                    type="number"
                    min="1"
                    step="1"
                    value={variant.price}
                    onChange={(event) =>
                      updateVariant(variant.key, { price: event.target.value })
                    }
                  />
                  {!variant.id && (
                    <TextField
                      id={`quantity-${variant.key}`}
                      label="Số lượng"
                      type="number"
                      min="0"
                      step="1"
                      value={variant.quantity}
                      onChange={(event) =>
                        updateVariant(variant.key, {
                          quantity: event.target.value,
                        })
                      }
                    />
                  )}
                  <SelectField
                    id={`status-${variant.key}`}
                    label="Trạng thái biến thể"
                    value={variant.active ? "ACTIVE" : "INACTIVE"}
                    onChange={(event) =>
                      updateVariant(variant.key, {
                        active: event.target.value === "ACTIVE",
                      })
                    }
                  >
                    <option value="ACTIVE">Đang bật</option>
                    <option value="INACTIVE">Đã tắt</option>
                  </SelectField>
                  <label className="grid gap-2 text-sm font-semibold">
                    Ảnh sản phẩm
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) =>
                        updateVariant(variant.key, {
                          file: event.target.files?.[0] ?? null,
                        })
                      }
                      className="w-full min-w-0 rounded-lg border border-[#C4C7C7] p-3 text-sm"
                    />
                    {variant.file && (
                      <span className="break-all text-xs font-normal">
                        Đã chọn: {variant.file.name}
                      </span>
                    )}
                    {variant.imageUrl && (
                      <img
                        src={variant.imageUrl}
                        alt={`Ảnh hiện tại ${variant.color}`}
                        className="h-24 w-24 rounded-lg object-cover"
                      />
                    )}
                  </label>
                  <TextField
                    id={`alt-${variant.key}`}
                    label="Mô tả ảnh"
                    placeholder="Ví dụ: Áo hai dây viền ren màu trắng"
                    value={variant.altText}
                    onChange={(event) =>
                      updateVariant(variant.key, {
                        altText: event.target.value,
                      })
                    }
                  />
                  {!variant.id && variants.length > 1 && (
                    <div className="sm:col-span-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setVariants((current) =>
                            current.filter((item) => item.key !== variant.key),
                          )
                        }
                      >
                        Bỏ biến thể {index + 1}
                      </Button>
                    </div>
                  )}
                </fieldset>
              ))}
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setVariants((current) => [...current, newVariant()])
                }
              >
                Thêm biến thể
              </Button>
            </section>
          </fieldset>
          {progress && (
            <p role="status" className="text-sm text-[#5E5F5D]">
              {progress}
            </p>
          )}
          <div className="flex justify-end gap-3 border-t border-[#E3E2E2] pt-5">
            <Button
              type="button"
              variant="ghost"
              disabled={saving || brandManagerBusy}
              onClick={close}
            >
              Đóng
            </Button>
            <Button
              type="submit"
              loading={saving}
              disabled={uncertain || brandManagerBusy}
            >
              Lưu sản phẩm
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
