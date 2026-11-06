export interface PaginationResult<T> {
  items: T[]
  page: number
  totalPages: number
}

export function paginateProducts<T>(items: T[], requestedPage: number, pageSize: number): PaginationResult<T> {
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new Error('Kích thước trang phải là số nguyên dương.')
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.min(Math.max(1, Math.trunc(requestedPage) || 1), totalPages)
  const start = (page - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    page,
    totalPages,
  }
}
