import { useEffect, type ReactNode } from 'react'
import { Button, Modal } from '@/shared/ui'
import type { Page } from './communityApi'

export function ApiSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mx-auto max-w-[var(--container-wide)] px-5 py-8 md:px-8 md:py-12"><h1 className="font-display text-4xl font-semibold text-[#222222]">{title}</h1>{children}</section>
}
export function ApiState({ loading, error, retry }: { loading: boolean; error: string; retry: () => void }) {
  if (loading) return <p role="status" className="my-6 text-sm text-[#5E5F5D]">Đang tải dữ liệu…</p>
  if (error) return <div className="my-6 rounded-lg border border-[#E3E2E2] bg-white p-5"><p role="alert" className="text-sm leading-6 text-[#A94B4B]">{error}</p><Button className="mt-4" variant="secondary" onClick={retry}>Tải lại</Button></div>
  return null
}
export function ApiPagination({ data, setPage }: { data: Page<unknown>; setPage: (index: number) => void }) {
  return <div className="mt-6 flex flex-wrap items-center gap-3 text-sm"><Button variant="secondary" disabled={data.page === 0} onClick={() => setPage(data.page - 1)}>Trang trước</Button><span>Trang {data.page + 1} / {Math.max(1, data.total_pages)} · {data.total_elements} kết quả</span><Button variant="secondary" disabled={data.page + 1 >= data.total_pages} onClick={() => setPage(data.page + 1)}>Trang sau</Button></div>
}
export function ApiModal(props: React.ComponentProps<typeof Modal>) {
  useEffect(() => {
    if (!props.open) return
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const dialog = document.querySelector('[data-api-dialog]')?.closest('[role="dialog"]')
      const controls = Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled):not([type=radio]),input[type=radio]:checked,textarea:not(:disabled),select:not(:disabled),a[href]') ?? [])
      const first = controls[0], last = controls[controls.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [props.open])
  return <Modal {...props}><div data-api-dialog>{props.children}</div></Modal>
}
