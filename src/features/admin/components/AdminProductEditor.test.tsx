import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { commerceApi } from "@/api/commerce"
import { CommerceApiError } from "@/api/http"
import type { CommerceProduct, ProductVariant } from "@/api/commerce.types"
import AdminProductEditor from "./AdminProductEditor"

const product: CommerceProduct = {
  product_id: "p1",
  category_id: "c1",
  brand_id: "b1",
  category_name: "Áo",
  brand_name: "Brand",
  name: "Áo ren",
  description: null,
  demographic_segment: "WOMEN",
  product_status: "ACTIVE",
  variants: [],
}
const variant: ProductVariant = {
  variant_id: "v1",
  product_id: "p1",
  sku: "WHITE-M",
  size: "M",
  color: "Trắng",
  material: null,
  unit_price_vnd: 199000,
  variant_status: "ACTIVE",
  available_quantity: 0,
  images: [],
}
beforeEach(() => {
  vi.spyOn(commerceApi.categories, "list").mockResolvedValue({
    items: [{ id: "c1", name: "Áo", slug: "ao", is_active: true }],
  })
  vi.spyOn(commerceApi.brands, "list").mockResolvedValue({
    items: [{ id: "b1", name: "Brand", slug: "brand", is_active: true }],
  })
  vi.spyOn(commerceApi.products, "create").mockResolvedValue(product)
  vi.spyOn(commerceApi.products, "replace").mockResolvedValue(product)
  vi.spyOn(commerceApi.products, "createVariant").mockResolvedValue(variant)
  vi.spyOn(commerceApi.products, "replaceVariant").mockResolvedValue(variant)
  vi.spyOn(commerceApi.products, "getAdmin").mockResolvedValue({
    ...product,
    variants: [variant],
  })
  vi.spyOn(commerceApi.products, "uploadImage").mockResolvedValue({
    image_id: "i1",
    variant_id: "v1",
    image_url: "/white.jpg",
    alt_text: "Áo trắng",
    is_primary: true,
    display_order: 0,
  })
})
afterEach(() => vi.restoreAllMocks())

it("loads existing stock and includes quantity when updating a variant", async () => {
  vi.mocked(commerceApi.products.getAdmin).mockResolvedValue({
    ...product,
    variants: [{ ...variant, available_quantity: 13 }],
  })
  const onSaved = vi.fn()
  render(
    <AdminProductEditor productId="p1" onSaved={onSaved} onClose={vi.fn()} />,
  )
  expect(await screen.findByLabelText("Số lượng")).toHaveValue(13)
  fireEvent.change(screen.getByLabelText("Số lượng"), {
    target: { value: "7" },
  })
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Lưu sản phẩm" }))
  await waitFor(() => expect(onSaved).toHaveBeenCalled())
  expect(commerceApi.products.replaceVariant).toHaveBeenCalledWith(
    "v1",
    expect.objectContaining({ quantity: 7, sku: "WHITE-M" }),
  )
  expect(commerceApi.products.createVariant).not.toHaveBeenCalled()
})

it("selects the brand created inside the product form and submits its returned ID", async () => {
  vi.spyOn(commerceApi.brands, "listAdmin").mockResolvedValue({
    items: [{ id: "b1", name: "Brand", slug: "brand", is_active: true }],
  })
  vi.spyOn(commerceApi.brands, "create").mockResolvedValue({
    id: "b2",
    name: "New Brand",
    slug: "new-brand",
    is_active: true,
  })
  const { user, onSaved } = await setup()
  await user.click(screen.getByRole("button", { name: "Quản lý thương hiệu" }))
  await screen.findByLabelText("Tên thương hiệu")
  fireEvent.change(screen.getByLabelText("Tên thương hiệu"), {
    target: { value: "New Brand" },
  })
  await user.click(screen.getByRole("button", { name: "Thêm thương hiệu" }))
  await waitFor(() =>
    expect(screen.getByLabelText("Thương hiệu")).toHaveValue("b2"),
  )
  expect(commerceApi.products.create).not.toHaveBeenCalled()
  await user.click(screen.getByRole("button", { name: "Lưu sản phẩm" }))
  await waitFor(() => expect(onSaved).toHaveBeenCalled())
  expect(commerceApi.products.create).toHaveBeenCalledWith(
    expect.objectContaining({ brand_id: "b2" }),
  )
})

it("clears the selected brand after it is hidden from the manager", async () => {
  vi.spyOn(commerceApi.brands, "listAdmin").mockResolvedValue({
    items: [{ id: "b1", name: "Brand", slug: "brand", is_active: true }],
  })
  vi.spyOn(commerceApi.brands, "remove").mockResolvedValue(undefined)
  const { user } = await setup()
  await user.click(screen.getByRole("button", { name: "Quản lý thương hiệu" }))
  await user.click(
    await screen.findByRole("button", { name: "Ẩn thương hiệu Brand" }),
  )
  await waitFor(() =>
    expect(screen.getByLabelText("Thương hiệu")).toHaveValue(""),
  )
  await user.click(screen.getByRole("button", { name: "Lưu sản phẩm" }))
  expect(
    screen.getByText(
      "Vui lòng nhập tên sản phẩm và chọn danh mục, thương hiệu có sẵn.",
    ),
  ).toBeInTheDocument()
  expect(commerceApi.products.create).not.toHaveBeenCalled()
})
function fillVariant(
  group: HTMLElement,
  sku: string,
  color: string,
  size: string,
) {
  for (const [label, value] of Object.entries({
    SKU: sku,
    Màu: color,
    Size: size,
    "Giá bán (VND)": "199000",
  }))
    fireEvent.change(within(group).getByLabelText(label), { target: { value } })
}
async function setup() {
  const onSaved = vi.fn()
  render(
    <AdminProductEditor productId={null} onSaved={onSaved} onClose={vi.fn()} />,
  )
  await screen.findByLabelText("Tên sản phẩm")
  for (const [label, value] of Object.entries({
    "Tên sản phẩm": "Áo ren",
    "Danh mục": "c1",
    "Thương hiệu": "b1",
  }))
    fireEvent.change(screen.getByLabelText(label), { target: { value } })
  fillVariant(
    screen.getByRole("group", { name: "Biến thể 1" }),
    "WHITE-M",
    "Trắng",
    "M",
  )
  return { user: userEvent.setup(), onSaved }
}
it("uses only contract fields and allows creation without uploading an image", async () => {
  const { user, onSaved } = await setup()
  for (const label of [
    "ID sản phẩm",
    "Giá cơ bản",
    "Phom dáng",
    "Họa tiết",
    "Phong cách",
    "Dịp sử dụng",
    "Thẻ tìm kiếm",
    "Mã màu",
  ])
    expect(screen.queryByLabelText(label)).not.toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "Lưu sản phẩm" }))
  await waitFor(() => expect(onSaved).toHaveBeenCalled())
  expect(commerceApi.products.create).toHaveBeenCalledWith({
    category_id: "c1",
    brand_id: "b1",
    name: "Áo ren",
    description: null,
    demographic_segment: "WOMEN",
    product_status: "ACTIVE",
  })
  expect(commerceApi.products.createVariant).toHaveBeenCalledWith("p1", {
    sku: "WHITE-M",
    color: "Trắng",
    size: "M",
    material: null,
    unit_price_vnd: 199000,
    quantity: 0,
    variant_status: "ACTIVE",
  })
  expect(commerceApi.products.uploadImage).not.toHaveBeenCalled()
})
it("creates each colour-size separately and uploads each file to its returned variant ID", async () => {
  vi.mocked(commerceApi.products.createVariant)
    .mockResolvedValueOnce(variant)
    .mockResolvedValueOnce({
      ...variant,
      variant_id: "v2",
      color: "Đen",
      size: "2XL",
    })
  const { user, onSaved } = await setup()
  await user.click(screen.getByRole("button", { name: "Thêm biến thể" }))
  const second = screen.getByRole("group", { name: "Biến thể 2" })
  fillVariant(second, "BLACK-2XL", "Đen", "2XL")
  fireEvent.change(within(second).getByLabelText("Mô tả ảnh"), {
    target: { value: "Ảnh áo đen" },
  })
  const white = new File(["white"], "white.png", { type: "image/png" })
  const black = new File(["black"], "black.png", { type: "image/png" })
  await user.upload(
    within(screen.getByRole("group", { name: "Biến thể 1" })).getByLabelText(
      "Ảnh sản phẩm",
    ),
    white,
  )
  await user.upload(within(second).getByLabelText("Ảnh sản phẩm"), black)
  await user.click(screen.getByRole("button", { name: "Lưu sản phẩm" }))
  await waitFor(() => expect(onSaved).toHaveBeenCalled())
  expect(commerceApi.products.create).toHaveBeenCalledTimes(1)
  expect(commerceApi.products.createVariant).toHaveBeenCalledTimes(2)
  expect(commerceApi.products.createVariant).toHaveBeenLastCalledWith(
    "p1",
    expect.objectContaining({ sku: "BLACK-2XL", size: "2XL", color: "Đen" }),
  )
  expect(commerceApi.products.uploadImage).toHaveBeenNthCalledWith(
    1,
    "v1",
    white,
    "Áo ren màu Trắng",
  )
  expect(commerceApi.products.uploadImage).toHaveBeenNthCalledWith(
    2,
    "v2",
    black,
    "Ảnh áo đen",
  )
  expect(
    vi.mocked(commerceApi.products.create).mock.invocationCallOrder[0],
  ).toBeLessThan(
    vi.mocked(commerceApi.products.createVariant).mock.invocationCallOrder[0],
  )
  expect(
    vi.mocked(commerceApi.products.createVariant).mock.invocationCallOrder[0],
  ).toBeLessThan(
    vi.mocked(commerceApi.products.uploadImage).mock.invocationCallOrder[0],
  )
})
it("validates quantity and duplicate SKU before any creation request", async () => {
  const { user } = await setup()
  fireEvent.change(screen.getByLabelText("Số lượng"), {
    target: { value: "-1" },
  })
  await user.click(screen.getByRole("button", { name: "Lưu sản phẩm" }))
  expect(screen.getByRole("alert")).toHaveTextContent(
    "số lượng phải là số nguyên từ 0",
  )
  fireEvent.change(screen.getByLabelText("Số lượng"), {
    target: { value: "0" },
  })
  await user.click(screen.getByRole("button", { name: "Thêm biến thể" }))
  fillVariant(
    screen.getByRole("group", { name: "Biến thể 2" }),
    "white-m",
    "Đen",
    "M",
  )
  await user.click(screen.getByRole("button", { name: "Lưu sản phẩm" }))
  expect(screen.getByRole("alert")).toHaveTextContent(
    "SKU của mỗi biến thể phải khác nhau",
  )
  expect(commerceApi.products.create).not.toHaveBeenCalled()
})
it("reuses confirmed IDs after a rejected upload", async () => {
  vi.mocked(commerceApi.products.uploadImage).mockRejectedValueOnce(
    new CommerceApiError(400, { detail: "Ảnh không hợp lệ" }),
  )
  const { user, onSaved } = await setup()
  await user.upload(
    screen.getByLabelText("Ảnh sản phẩm"),
    new File(["image"], "shirt.png", { type: "image/png" }),
  )
  await user.click(screen.getByRole("button", { name: "Lưu sản phẩm" }))
  expect(await screen.findByRole("alert")).toHaveTextContent("Ảnh không hợp lệ")
  await user.click(screen.getByRole("button", { name: "Lưu sản phẩm" }))
  await waitFor(() => expect(onSaved).toHaveBeenCalled())
  expect(commerceApi.products.create).toHaveBeenCalledTimes(1)
  expect(commerceApi.products.createVariant).toHaveBeenCalledTimes(1)
  expect(commerceApi.products.replaceVariant).toHaveBeenCalledWith(
    "v1",
    expect.any(Object),
  )
})
it("blocks repeating a POST with an unknown outcome", async () => {
  vi.mocked(commerceApi.products.createVariant).mockRejectedValueOnce(
    new TypeError("Network error"),
  )
  const { user } = await setup()
  await user.click(screen.getByRole("button", { name: "Lưu sản phẩm" }))
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Chưa xác định được kết quả lưu",
  )
  expect(screen.getByRole("button", { name: "Lưu sản phẩm" })).toBeDisabled()
})
it("retries failed reference loading", async () => {
  vi.mocked(commerceApi.brands.list).mockRejectedValueOnce(new Error("Offline"))
  render(
    <AdminProductEditor productId={null} onSaved={vi.fn()} onClose={vi.fn()} />,
  )
  expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được")
  await userEvent.setup().click(screen.getByRole("button", { name: "Thử lại" }))
  expect(await screen.findByLabelText("Thương hiệu")).toBeInTheDocument()
})
