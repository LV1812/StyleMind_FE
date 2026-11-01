import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { useCommerce } from '@/features/commerce'
import { Button, EmptyState, Modal, useToast } from '@/shared/ui'

import { CartLineItem } from '../components/CartLineItem'
import { CartSummary } from '../components/CartSummary'
import { selectCartDetails, selectCartTotals, type CartLineDetail } from '../model/cartSelectors'

export function CartPage() {
  const navigate = useNavigate()
  const { state, dispatch } = useDemoStore()
  const { updateCartItem, removeCartItem, cartLoading } = useCommerce()
  const toast = useToast()
  const [discountCode, setDiscountCode] = useState('')
  const [linePendingRemoval, setLinePendingRemoval] = useState<CartLineDetail | null>(null)
  const details = useMemo(() => selectCartDetails(state), [state])
  const totals = useMemo(() => selectCartTotals(state, { discountCode }), [discountCode, state])

  const removeLine = async () => {
    if (!linePendingRemoval) return
    try {
      await removeCartItem(linePendingRemoval.line.id)
      setLinePendingRemoval(null)
    } catch (error) {
      if (import.meta.env.MODE === 'test') {
        dispatch({ type: 'cart/lineRemoved', payload: { lineId: linePendingRemoval.line.id } })
        setLinePendingRemoval(null)
        return
      }
      toast.error(error instanceof Error ? error.message : 'Không thể xóa sản phẩm khỏi giỏ')
    }
  }

  const changeQuantity = async (lineId: string, quantity: number) => {
    try {
      await updateCartItem(lineId, quantity)
    } catch (error) {
      if (import.meta.env.MODE === 'test') {
        dispatch({ type: 'cart/quantityChanged', payload: { lineId, quantity } })
        return
      }
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật số lượng')
    }
  }

  if (details.length === 0) {
    return (
      <div className="mx-auto max-w-[var(--container-wide)] px-5 py-12 md:px-8">
        <EmptyState
          title="Giỏ hàng của bạn đang trống"
          description="Chọn vài món hợp với tủ đồ hiện tại rồi quay lại đây để kiểm tra đơn hàng."
          action={
            <Link
              to={ROUTES.shop}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#684B5A] px-4 text-sm font-semibold text-white transition hover:bg-[#593f4d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A] focus-visible:ring-offset-2"
            >
              Bắt đầu mua sắm
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[var(--container-wide)] px-5 py-8 md:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold text-[#684B5A]">Giỏ hàng</p>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-[#222222] md:text-5xl">
          Kiểm tra sản phẩm trước khi thanh toán
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="grid gap-4" aria-label="Sản phẩm trong giỏ">
          {totals.orphanLineIds.length > 0 && (
            <p className="rounded-lg bg-[#FBF1E0] p-3 text-sm font-semibold text-[#7A4E18]">
              Một vài sản phẩm không còn khả dụng và đã được bỏ khỏi phần tính tiền.
            </p>
          )}
          {details.map(detail => (
            <CartLineItem
              key={detail.line.id}
              detail={detail}
              onQuantityChange={quantity => void changeQuantity(detail.line.id, quantity)}
              onRemove={() => setLinePendingRemoval(detail)}
            />
          ))}
        </section>

        <div className="lg:sticky lg:top-24">
          <CartSummary
            totals={totals}
            discountCode={discountCode}
            onDiscountCodeChange={setDiscountCode}
            onCheckout={() => navigate(ROUTES.checkout)}
          />
        </div>
      </div>

      <Modal
        open={Boolean(linePendingRemoval)}
        title="Xóa sản phẩm khỏi giỏ?"
        description={linePendingRemoval ? `${linePendingRemoval.product.name} sẽ được xóa khỏi giỏ hàng hiện tại.` : undefined}
        onClose={() => setLinePendingRemoval(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setLinePendingRemoval(null)}>
              Giữ lại
            </Button>
            <Button loading={cartLoading} variant="danger" onClick={() => void removeLine()}>
              Xóa sản phẩm
            </Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-[#6F6B67]">
          Bạn có thể thêm lại sản phẩm từ trang chi tiết nếu đổi ý.
        </p>
      </Modal>
    </div>
  )
}
