import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { commerceApi } from '@/api/commerce'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { useAuth } from '@/features/auth'
import { AdminAiPanel } from '@/features/admin/components/AdminAiPanel'
import { AdminCategoriesPanel } from '@/features/admin/components/AdminCategoriesPanel'
import { AdminCustomersPanel } from '@/features/admin/components/AdminCustomersPanel'
import { AdminOverviewPanel } from '@/features/admin/components/AdminOverviewPanel'
import { AdminOrdersPanel } from '@/features/admin/components/AdminOrdersPanel'
import { AdminProductsPanel } from '@/features/admin/components/AdminProductsPanel'
import { AdminRequestsPanel } from '@/features/admin/components/AdminRequestsPanel'
import { AdminShell } from '@/features/admin/components/AdminShell'
import type { AdminSection } from '@/features/admin/model/adminTypes'
import {
  commerceCategoryToEntity,
  commerceCancellationToEntity,
  commerceOrderToEntity,
  commerceProductToEntity,
} from '@/features/commerce/data/commerceEntityAdapters'
import { loadAllCommerceProducts } from '@/features/commerce/data/loadCommerceProducts'

const sections = new Set<AdminSection>(['overview', 'products', 'categories', 'orders', 'requests', 'customers', 'ai'])

function resolveSection(value: string | null): AdminSection {
  return value && sections.has(value as AdminSection) ? (value as AdminSection) : 'overview'
}

function sectionPlaceholder(section: AdminSection) {
  const title: Record<AdminSection, string> = {
    overview: 'Tổng quan quản trị',
    products: 'Quản lý sản phẩm',
    categories: 'Quản lý danh mục',
    orders: 'Quản lý đơn hàng',
    requests: 'Quản lý yêu cầu',
    customers: 'Quản lý khách hàng',
    ai: 'Quản lý dữ liệu AI',
  }

  return (
    <section className="grid gap-4">
      <div>
        <p className="text-sm font-semibold text-[#684B5A]">Bảng quản trị StyleMind</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[#222222]">{title[section]}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F6B67]">
          Khu vực này đã có điều hướng và bố cục sẵn sàng; các thao tác chi tiết sẽ được mở trong bước tiếp theo của MVP quản trị.
        </p>
      </div>
    </section>
  )
}

export function AdminPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { state, dispatch } = useDemoStore()
  const { currentUser, logout } = useAuth()
  const [commerceError, setCommerceError] = useState<string | null>(null)
  const [commerceLoading, setCommerceLoading] = useState(true)
  const activeSection = resolveSection(searchParams.get('section'))

  useEffect(() => {
    let active = true
    Promise.all([
      loadAllCommerceProducts(),
      commerceApi.categories.listAdmin(),
      commerceApi.orders.listAdmin({ page: 0, size: 100 }),
    ]).then(([products, categories, orders]) => {
      if (!active) return
      dispatch({
        type: 'commerce/catalogSynced',
        payload: {
          products: products.map(commerceProductToEntity),
          categories: categories.items.map(commerceCategoryToEntity),
        },
      })
      dispatch({
        type: 'commerce/adminOrdersSynced',
        payload: {
          orders: orders.items.map(commerceOrderToEntity),
          cancellationRequests: orders.items
            .map(order => order.cancellation_request)
            .filter(request => request !== null)
            .map(commerceCancellationToEntity),
        },
      })
      setCommerceError(null)
    }).catch(error => {
      if (active) {
        if (import.meta.env.MODE !== 'test') {
          dispatch({ type: 'commerce/catalogSynced', payload: { products: [], categories: [] } })
          dispatch({ type: 'commerce/adminOrdersSynced', payload: { orders: [], cancellationRequests: [] } })
        }
        setCommerceError(error instanceof Error ? error.message : 'Không thể tải dữ liệu Commerce admin')
      }
    }).finally(() => {
      if (active) setCommerceLoading(false)
    })
    return () => {
      active = false
    }
  }, [dispatch])

  const content = useMemo(() => {
    if (activeSection === 'overview') return <AdminOverviewPanel database={state} />
    if (activeSection === 'products') return <AdminProductsPanel database={state} dispatch={dispatch} />
    if (activeSection === 'categories') return <AdminCategoriesPanel database={state} dispatch={dispatch} />
    if (activeSection === 'orders') return <AdminOrdersPanel database={state} dispatch={dispatch} />
    if (activeSection === 'requests') return <AdminRequestsPanel database={state} dispatch={dispatch} reviewerId={currentUser?.id ?? ''} />
    if (activeSection === 'customers') return <AdminCustomersPanel />
    if (activeSection === 'ai') return <AdminAiPanel database={state} dispatch={dispatch} />
    return sectionPlaceholder(activeSection)
  }, [activeSection, currentUser?.id, dispatch, state])

  if (!currentUser) return null

  return (
    <AdminShell
      activeSection={activeSection}
      adminName={currentUser.fullName}
      adminEmail={currentUser.email}
      onLogout={() => {
        logout()
        navigate('/login', { replace: true })
      }}
    >
      <Link to="/admin/payments" className="mb-4 inline-block rounded-lg bg-[#EEE8E1] px-4 py-3 font-semibold text-[#684B5A]">Thanh toán: thu COD và xem lỗi</Link>
      {commerceLoading && <p role="status" className="mb-4 rounded-lg bg-white p-4 text-sm text-[#6F6B67]">Đang tải dữ liệu Commerce…</p>}
      {commerceError && <p role="alert" className="mb-4 rounded-lg bg-[#FCEAEA] p-4 text-sm font-semibold text-[#A94B4B]">{commerceError}</p>}
      {content}
    </AdminShell>
  )
}
