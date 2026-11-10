import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { commerceApi } from '@/api/commerce'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { useAuth } from '@/features/auth'
import { apiMode } from '@/shared/api/http'
import { UnavailableFeature } from '@/shared/ui/UnavailableFeature'
import { Button } from '@/shared/ui'
import { AdminNotificationsUnavailable } from '@/features/admin/components/AdminNotificationsUnavailable'
import { AdminSettingsUnavailable } from '@/features/admin/components/AdminSettingsUnavailable'
import { AdminOverviewLive } from '@/features/admin/components/AdminOverviewLive'
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
import { loadAdminOrders } from '@/features/commerce/data/loadAdminOrders'

const sections = new Set<AdminSection>(['overview', 'products', 'categories', 'orders', 'requests', 'customers', 'notifications', 'settings', 'ai'])

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
    notifications: 'Quản lý thông báo',
    settings: 'Cài đặt hệ thống',
    ai: 'Quản lý dữ liệu AI',
  }

  return (
    <section className="grid gap-4">
      <div>
        <p className="text-sm font-semibold text-[#1C1B1B]">Bảng quản trị StyleMind</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[#222222]">{title[section]}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5E5F5D]">
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
  const [reloadVersion, setReloadVersion] = useState(0)
  const [summary, setSummary] = useState<{ productCount: number | null; orderCount: number | null }>({ productCount: null, orderCount: null })
  const activeSection = resolveSection(searchParams.get('section'))

  useEffect(() => {
    if (!apiMode()) {
      setCommerceLoading(false)
      setCommerceError(null)
      return
    }

    let active = true
    setCommerceLoading(true)
    setSummary({ productCount: null, orderCount: null })
    Promise.all([
      loadAllCommerceProducts(),
      commerceApi.categories.listAdmin(),
      loadAdminOrders(),
    ]).then(([products, categories, orders]) => {
      if (!active) return
      setSummary({ productCount: products.length, orderCount: Number.isSafeInteger(orders.total) ? orders.total : null })
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
  }, [dispatch, activeSection, reloadVersion])

  const content = useMemo(() => {
    if (activeSection === 'overview') return apiMode() ? <AdminOverviewLive {...summary} loading={commerceLoading} /> : <AdminOverviewPanel database={state} />
    if (activeSection === 'products') return <AdminProductsPanel database={state} dispatch={dispatch} />
    if (activeSection === 'categories') return <AdminCategoriesPanel database={state} dispatch={dispatch} />
    if (activeSection === 'orders') return <AdminOrdersPanel database={state} dispatch={dispatch} onReload={() => setReloadVersion(value => value + 1)} />
    if (activeSection === 'requests') return <AdminRequestsPanel database={state} dispatch={dispatch} reviewerId={currentUser?.id ?? ''} />
    if (activeSection === 'customers') return <AdminCustomersPanel />
    if (activeSection === 'notifications') return <AdminNotificationsUnavailable />
    if (activeSection === 'settings') return <AdminSettingsUnavailable />
    if (activeSection === 'ai') return <UnavailableFeature title="Quản lý AI" backTo="/admin" backLabel="Về tổng quan" />
    return sectionPlaceholder(activeSection)
  }, [activeSection, currentUser?.id, dispatch, state, summary, commerceLoading])

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
      <Link to="/admin/payments" className="mb-4 inline-block rounded-lg bg-[#EFEDED] px-4 py-3 font-semibold text-[#1C1B1B]">Thanh toán: thu COD và xem lỗi</Link>
      {commerceLoading && <p role="status" className="mb-4 rounded-lg bg-white p-4 text-sm text-[#5E5F5D]">Đang tải dữ liệu Commerce…</p>}
      {commerceError && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E7BBBB] bg-[#FCEAEA] p-4"><p role="alert" className="text-sm font-semibold text-[#A94B4B]">{commerceError}</p><Button type="button" variant="secondary" disabled={commerceLoading} onClick={() => { setCommerceError(null); setReloadVersion(value => value + 1) }}>Thử tải lại</Button></div>}
      {(!['products', 'categories', 'orders', 'requests'].includes(activeSection) || (!commerceLoading && !commerceError)) && content}
    </AdminShell>
  )
}

