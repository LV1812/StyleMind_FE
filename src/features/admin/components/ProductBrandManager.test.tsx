import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, afterEach, expect, it, vi } from "vitest"
import { commerceApi } from "@/api/commerce"
import { CommerceApiError } from "@/api/http"
import ProductBrandManager from "./ProductBrandManager"

const active = {
  id: "b1",
  name: "StyleMind",
  slug: "stylemind",
  is_active: true,
}
const hidden = { id: "b2", name: "Hidden", slug: "hidden", is_active: false }
beforeEach(() => {
  vi.spyOn(commerceApi.brands, "listAdmin").mockResolvedValue({
    items: [active, hidden],
  })
  vi.spyOn(commerceApi.brands, "getAdmin").mockResolvedValue(active)
  vi.spyOn(commerceApi.brands, "create").mockResolvedValue({
    id: "b3",
    name: "Đầm Việt",
    slug: "dam-viet",
    is_active: true,
  })
  vi.spyOn(commerceApi.brands, "replace").mockImplementation(
    async (id, input) => ({ id, ...input }),
  )
  vi.spyOn(commerceApi.brands, "remove").mockResolvedValue(undefined)
})
afterEach(() => vi.restoreAllMocks())

async function setup() {
  const onChanged = vi.fn()
  const onBusyChange = vi.fn()
  render(
    <ProductBrandManager
      onChanged={onChanged}
      onBusyChange={onBusyChange}
      onClose={vi.fn()}
    />,
  )
  await screen.findByRole("button", { name: "Sửa thương hiệu StyleMind" })
  return { user: userEvent.setup(), onChanged, onBusyChange }
}

it("reads active and hidden brands and creates a brand with a generated editable slug", async () => {
  const { user, onChanged } = await setup()
  expect(screen.getByText("Đã ẩn")).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText("Tên thương hiệu"), {
    target: { value: "Đầm Việt" },
  })
  expect(screen.getByLabelText("Slug thương hiệu")).toHaveValue("dam-viet")
  await user.click(screen.getByRole("button", { name: "Thêm thương hiệu" }))
  await waitFor(() =>
    expect(onChanged).toHaveBeenLastCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: "b3" })]),
      "b3",
    ),
  )
  expect(commerceApi.brands.create).toHaveBeenCalledWith({
    name: "Đầm Việt",
    slug: "dam-viet",
    is_active: true,
  })
})

it("loads details and sends all three fields when editing", async () => {
  const { user, onChanged } = await setup()
  await user.click(
    screen.getByRole("button", { name: "Sửa thương hiệu StyleMind" }),
  )
  expect(commerceApi.brands.getAdmin).toHaveBeenCalledWith("b1")
  await waitFor(() =>
    expect(screen.getByLabelText("Tên thương hiệu")).toHaveValue("StyleMind"),
  )
  fireEvent.change(screen.getByLabelText("Tên thương hiệu"), {
    target: { value: "StyleMind Fashion" },
  })
  fireEvent.change(screen.getByLabelText("Slug thương hiệu"), {
    target: { value: "stylemind-fashion" },
  })
  await user.click(screen.getByRole("button", { name: "Lưu thương hiệu" }))
  await waitFor(() =>
    expect(commerceApi.brands.replace).toHaveBeenCalledWith("b1", {
      name: "StyleMind Fashion",
      slug: "stylemind-fashion",
      is_active: true,
    }),
  )
  expect(onChanged).toHaveBeenLastCalledWith(
    expect.arrayContaining([
      expect.objectContaining({ name: "StyleMind Fashion" }),
    ]),
    undefined,
  )
})

it("soft deletes using DELETE and restores using a full PUT payload", async () => {
  const { user, onChanged } = await setup()
  await user.click(
    screen.getByRole("button", { name: "Ẩn thương hiệu StyleMind" }),
  )
  expect(commerceApi.brands.remove).toHaveBeenCalledWith("b1")
  await screen.findByRole("button", { name: "Hiện lại thương hiệu StyleMind" })
  expect(onChanged).toHaveBeenLastCalledWith(
    expect.arrayContaining([{ ...active, is_active: false }]),
    undefined,
  )
  await user.click(
    screen.getByRole("button", { name: "Hiện lại thương hiệu StyleMind" }),
  )
  await waitFor(() =>
    expect(commerceApi.brands.replace).toHaveBeenCalledWith("b1", {
      name: "StyleMind",
      slug: "stylemind",
      is_active: true,
    }),
  )
  expect(
    await screen.findByRole("button", { name: "Ẩn thương hiệu StyleMind" }),
  ).toBeInTheDocument()
})

it("rejects invalid and duplicate slugs including hidden brands", async () => {
  const { user } = await setup()
  fireEvent.change(screen.getByLabelText("Tên thương hiệu"), {
    target: { value: "New" },
  })
  fireEvent.change(screen.getByLabelText("Slug thương hiệu"), {
    target: { value: "Thương hiệu!" },
  })
  await user.click(screen.getByRole("button", { name: "Thêm thương hiệu" }))
  expect(screen.getByRole("alert")).toHaveTextContent(
    "slug chỉ gồm chữ thường không dấu",
  )
  fireEvent.change(screen.getByLabelText("Slug thương hiệu"), {
    target: { value: "hidden" },
  })
  await user.click(screen.getByRole("button", { name: "Thêm thương hiệu" }))
  expect(screen.getByRole("alert")).toHaveTextContent(
    "kể cả thương hiệu đang ẩn",
  )
  expect(commerceApi.brands.create).not.toHaveBeenCalled()
})

it("keeps a failed deletion visible and surfaces the API error", async () => {
  vi.mocked(commerceApi.brands.remove).mockRejectedValueOnce(
    new CommerceApiError(403, { detail: "Không có quyền" }),
  )
  const { user } = await setup()
  await user.click(
    screen.getByRole("button", { name: "Ẩn thương hiệu StyleMind" }),
  )
  expect(await screen.findByRole("alert")).toHaveTextContent("Không có quyền")
  expect(
    screen.getByRole("button", { name: "Ẩn thương hiệu StyleMind" }),
  ).toBeEnabled()
})

it("checks the result of an uncertain POST without issuing a second POST", async () => {
  vi.mocked(commerceApi.brands.create).mockRejectedValueOnce(
    new TypeError("Offline"),
  )
  const { user, onChanged } = await setup()
  fireEvent.change(screen.getByLabelText("Tên thương hiệu"), {
    target: { value: "New" },
  })
  await user.click(screen.getByRole("button", { name: "Thêm thương hiệu" }))
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Chưa xác định được kết quả",
  )
  expect(
    screen.getByRole("button", { name: "Thêm thương hiệu" }),
  ).toBeDisabled()
  vi.mocked(commerceApi.brands.listAdmin).mockResolvedValueOnce({
    items: [active, { id: "b3", name: "New", slug: "new", is_active: true }],
  })
  await user.click(screen.getByRole("button", { name: "Kiểm tra kết quả" }))
  await waitFor(() =>
    expect(onChanged).toHaveBeenLastCalledWith(expect.any(Array), "b3"),
  )
  expect(commerceApi.brands.create).toHaveBeenCalledTimes(1)
})
