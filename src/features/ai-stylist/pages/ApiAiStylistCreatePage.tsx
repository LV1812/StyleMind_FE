import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { SelectField } from '@/shared/ui/SelectField'

import { parseVndBudget } from '../model/parseVndBudget'
import { STYLIST_CONTEXT_FIELDS, type StylistColor } from '../model/stylistFormOptions'
import ExcludedColorSelect from '../components/ExcludedColorSelect'
import {
  invalidStylistResponse,
  stylistApi,
  stylistErrorMessage,
  type CreateStylingRequestPayload,
  type RecommendationDetailResponse,
} from '../api/stylistApi'

type FlowState =
  | 'idle'
  | 'saving'
  | 'received'
  | 'generating'
  | 'processing'
  | 'loading_details'
  | 'succeeded'
  | 'no_result'
  | 'failed'
  | 'detail_failed'

interface StylistForm {
  message: string
  occasion: string
  intendedUse: string
  style: string
  weather: string
  budget: string
  hardBudget: boolean
  excludedColors: StylistColor[]
}

const initialForm: StylistForm = {
  message: '',
  occasion: '',
  intendedUse: '',
  style: '',
  weather: '',
  budget: '',
  hardBudget: false,
  excludedColors: [],
}

const isBusy = (state: FlowState) =>
  ['saving', 'received', 'generating', 'loading_details'].includes(state)

function detailWarning(recommendation: RecommendationDetailResponse) {
  const topCount = recommendation.items.filter(item => item.slot_name === 'TOP').length
  const bottomCount = recommendation.items.filter(item => item.slot_name === 'BOTTOM').length
  if (topCount !== 1 || bottomCount !== 1 || recommendation.items.length !== 2) {
    return 'Detail API chưa trả đúng một sản phẩm TOP và một sản phẩm BOTTOM.'
  }
  if (recommendation.items.some(item => !item.product_name?.trim() || !Number.isFinite(item.current_unit_price_vnd))) {
    return 'Detail API đang thiếu tên hoặc giá hiện tại của sản phẩm.'
  }
  return ''
}

function availabilityLabel(value: string) {
  if (value === 'AVAILABLE') return 'Đang khả dụng'
  if (value === 'UNAVAILABLE') return 'Hiện không khả dụng'
  return 'Chưa xác định'
}

function RecommendationView({ recommendation }: { recommendation: RecommendationDetailResponse }) {
  const warning = detailWarning(recommendation)
  const availableCount = recommendation.items.filter(item => item.current_availability === 'AVAILABLE').length
  const statusSummary = availableCount === recommendation.items.length
    ? 'Cả bộ đang khả dụng'
    : availableCount > 0
      ? `${availableCount}/${recommendation.items.length} món đang khả dụng`
      : 'Tình trạng theo Commerce'

  return (
    <section aria-label="Chi tiết bản phối" className="grid gap-5 border-t border-[#E3E2E2] pt-5 first:border-t-0 first:pt-0">
      <header className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <h3 className="font-display text-2xl leading-tight text-[#222222]">Bản phối dành cho bạn</h3>
          {recommendation.explanation && (
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#3A3632]">{recommendation.explanation}</p>
          )}
          {recommendation.styling_tips && (
            <p className="mt-1 max-w-xl text-sm leading-6 text-[#5E5F5D]">{recommendation.styling_tips}</p>
          )}
        </div>
        <p className="text-sm text-[#5E5F5D]">
          {recommendation.items.length} món <span aria-hidden="true">·</span> {statusSummary}
        </p>
      </header>

      {warning && (
        <p role="alert" className="rounded-lg border border-[#E7C9A5] bg-[#FBF1E0] px-4 py-3 text-sm text-[#83551D]">
          {warning} Kết quả chi tiết từ backend chưa đủ dữ liệu để hiển thị outfit hoàn chỉnh.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {recommendation.items.map(item => {
          const image = [...(item.images ?? [])]
            .filter(candidate => candidate?.imageUrl?.trim())
            .sort((left, right) => Number(right.primary) - Number(left.primary) || left.displayOrder - right.displayOrder)[0]
          const slotLabel = item.slot_name === 'TOP'
            ? 'Áo · TOP'
            : item.slot_name === 'BOTTOM'
              ? 'Quần · BOTTOM'
              : item.slot_name || 'Mục phối đồ'
          const colorAndMaterial = [item.color, item.material].filter(Boolean).join(' · ')
          const size = item.size?.trim()
          const isAvailable = item.current_availability === 'AVAILABLE'

          return (
            <article key={recommendation.recommendation_id + '-' + item.display_order} className="group overflow-hidden rounded-xl border border-[#E3E2E2] bg-white">
              <div className="relative aspect-[4/5] overflow-hidden bg-[#F5F3F3]">
                {image ? (
                  <img
                    src={image.imageUrl}
                    alt={image.altText?.trim() || item.product_name || slotLabel}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.015] motion-reduce:transition-none"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-sm text-[#5E5F5D]">
                    Catalog chưa có ảnh cho sản phẩm này.
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#222222]">
                  {slotLabel}
                </span>
                <span className="absolute right-3 top-3 inline-flex min-h-8 items-center gap-2 rounded-full bg-white/95 px-3 text-xs font-medium text-[#222222]">
                  <span aria-hidden="true" className={`h-2 w-2 rounded-full ${isAvailable ? 'bg-[#48755A]' : item.current_availability === 'UNAVAILABLE' ? 'bg-[#A94B4B]' : 'bg-[#9D9894]'}`} />
                  {availabilityLabel(item.current_availability)}
                </span>
              </div>
              <div className="grid gap-4 p-4 sm:p-5">
                <div className="grid gap-1">
                  <h4 className="min-h-12 text-base font-semibold leading-6 text-[#222222]">
                    {item.product_name?.trim() || 'Detail chưa có tên sản phẩm'}
                  </h4>
                  <p className="text-sm text-[#5E5F5D]">
                    {colorAndMaterial || 'Chưa có thông tin màu hoặc chất liệu'}
                  </p>
                </div>

                <div className="flex items-end justify-between gap-3">
                  <p className="text-xs text-[#5E5F5D]">Giá hiện tại</p>
                  {typeof item.current_unit_price_vnd === 'number' && Number.isFinite(item.current_unit_price_vnd) ? (
                    <p className="text-base font-semibold text-[#222222]">{formatCurrency(item.current_unit_price_vnd)}</p>
                  ) : (
                    <p className="text-sm font-medium text-[#A94B4B]">Chưa có giá</p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[#E3E2E2] pt-3">
                  <div>
                    <p className="text-sm font-medium text-[#222222]">Size được đề xuất</p>
                    <p className="mt-1 text-xs leading-5 text-[#5E5F5D]">Theo biến thể Commerce</p>
                  </div>
                  <span
                    aria-label={size ? `Cỡ được đề xuất: ${size}` : 'Chưa có cỡ được đề xuất'}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-[#222222] px-3 text-sm font-semibold text-white"
                  >
                    {size || '—'}
                  </span>
                </div>

                {item.selection_reason && (
                  <p className="border-t border-[#E3E2E2] pt-3 text-sm leading-5 text-[#5E5F5D]">{item.selection_reason}</p>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {typeof recommendation.total_current_price_vnd === 'number' && (
        <div className="grid gap-1 border-t border-[#E3E2E2] pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-sm text-[#5E5F5D]">Tổng giá cả bộ</p>
            <p className="font-display text-3xl leading-tight text-[#222222]">{formatCurrency(recommendation.total_current_price_vnd)}</p>
          </div>
          <p className="text-sm text-[#5E5F5D]">Theo dữ liệu Commerce hiện tại</p>
        </div>
      )}
    </section>
  )
}

export function ApiAiStylistCreatePage() {
  const [form, setForm] = useState(initialForm)
  const [flow, setFlow] = useState<FlowState>('idle')
  const [requestId, setRequestId] = useState<string | null>(null)
  const [requestStatus, setRequestStatus] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendationDetailResponse[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [budgetError, setBudgetError] = useState('')

  const busy = isBusy(flow)
  const hasNeed = Boolean(
    form.message.trim()
      || form.occasion.trim()
      || form.intendedUse.trim()
      || form.style.trim()
      || form.weather.trim(),
  )
  const parsedBudget = parseVndBudget(form.budget)
  const budgetIsValid = parsedBudget !== null

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy || !hasNeed) return
    if (!budgetIsValid) {
      setBudgetError('Nhập số tiền VND nguyên, ví dụ 500.000.')
      return
    }

    const payload: CreateStylingRequestPayload = {
      message: form.message.trim() || undefined,
      occasion: form.occasion.trim() || undefined,
      intended_use: form.intendedUse.trim() || undefined,
      style_context: form.style.trim() || undefined,
      general_weather_context: form.weather.trim() || undefined,
      max_budget_vnd: parsedBudget ?? undefined,
      budget_is_hard: typeof parsedBudget === 'number' && form.hardBudget,
      constraints: form.excludedColors.map(color => ({
        constraint_kind: 'EXCLUDE_COLOR', text_value: color, is_hard: true,
      })),
    }

    let stage: 'intake' | 'generation' | 'detail' = 'intake'
    let currentRequestId: string | null = null
    setFlow('saving')
    setRequestId(null)
    setRequestStatus(null)
    setRecommendations([])
    setErrorMessage('')
    setBudgetError('')

    try {
      const session = await stylistApi.createSession('Tư vấn phối đồ')
      const created = await stylistApi.createRequest(session.session_id, payload)
      currentRequestId = created.request_id
      setRequestId(created.request_id)
      setRequestStatus(created.request_status)

      if (created.request_status !== 'RECEIVED') {
        throw invalidStylistResponse('Stylist không trả trạng thái RECEIVED sau khi lưu yêu cầu.')
      }

      setFlow('received')
      stage = 'generation'
      setFlow('generating')
      const generated = await stylistApi.generate(created.request_id)
      setRequestStatus(generated.request_status)

      if (generated.request_status === 'NO_RESULT') {
        setFlow('no_result')
        return
      }
      if (generated.request_status === 'PROCESSING') {
        setFlow('processing')
        return
      }
      if (generated.request_status === 'FAILED') {
        setFlow('failed')
        setErrorMessage('Backend xác nhận yêu cầu đã FAILED. Tạo một yêu cầu mới nếu bạn muốn thử lại.')
        return
      }
      if (generated.request_status !== 'SUCCEEDED') {
        throw invalidStylistResponse('Stylist chưa trả trạng thái kết thúc hợp lệ.')
      }
      if (!generated.recommendations?.length || generated.recommendations.some(item => !item.recommendation_id)) {
        throw invalidStylistResponse('Stylist trả SUCCEEDED nhưng thiếu recommendation ID.')
      }

      stage = 'detail'
      setFlow('loading_details')
      const details = await Promise.all(
        generated.recommendations.map(item => stylistApi.getRecommendationDetail(item.recommendation_id)),
      )
      setRecommendations(details)
      setFlow('succeeded')
    } catch (error) {
      if (stage === 'generation' && currentRequestId) {
        setRequestStatus(null)
        try {
          const latest = await stylistApi.getRequest(currentRequestId)
          setRequestStatus(latest.request_status)
          if (latest.request_status === 'PROCESSING') {
            setFlow('processing')
            setErrorMessage('Backend vẫn đang xử lý yêu cầu. Không gửi lại yêu cầu này.')
            return
          }
        } catch {
          // The generate error is already shown below; never replace it with raw detail from the status read.
        }
      }
      setFlow(stage === 'detail' ? 'detail_failed' : 'failed')
      setErrorMessage(stylistErrorMessage(error, stage))
    }
  }

  const update = <Key extends keyof StylistForm,>(key: Key, value: StylistForm[Key]) => {
    setForm(previous => ({ ...previous, [key]: value }))
    if (key === 'budget') setBudgetError('')
  }

  const buttonText = flow === 'saving'
    ? 'Đang gửi yêu cầu…'
    : flow === 'generating'
      ? 'Đang tạo gợi ý…'
      : flow === 'loading_details'
        ? 'Đang tải chi tiết sản phẩm…'
        : 'Tạo gợi ý phối đồ'

  return (
    <section className="mx-auto grid max-w-[var(--container-wide)] gap-6 px-5 py-8 md:px-8 md:py-12">
      <div>
        <Link to={ROUTES.wardrobes} className="text-sm font-semibold text-[#684B5A] hover:underline">Tủ đồ</Link>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[#222222]">AI Stylist</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5E5F5D]">
          Nhập nhu cầu để Stylist tìm đúng một món TOP và một món BOTTOM trong catalog hiện có.
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <form onSubmit={submit} className="grid gap-4 rounded-lg border border-[#E3E2E2] bg-white p-5">
          <h2 className="text-xl font-semibold text-[#222222]">Nhu cầu phối đồ</h2>

          <label className="grid gap-2 text-sm font-semibold text-[#3A3632]">
            Mô tả nhu cầu
            <textarea
              value={form.message}
              onChange={event => update('message', event.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Ví dụ: Tôi cần bộ đồ đi làm thoải mái, thanh lịch"
              className="rounded-lg border border-[#C9C6C4] bg-white px-3 py-3 text-sm font-normal leading-6 text-[#222222] outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A] focus-visible:ring-offset-2"
              disabled={busy}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            {STYLIST_CONTEXT_FIELDS.map(field => (
              <SelectField key={field.key} label={field.label} value={form[field.key]} onChange={event => update(field.key, event.target.value)} disabled={busy}>
                <option value="">{field.placeholder}</option>
                {field.options.map(option => <option key={option} value={option}>{option}</option>)}
              </SelectField>
            ))}
          </div>

          <fieldset className="grid gap-3 rounded-lg border border-[#E3E2E2] p-4">
            <legend className="px-1 text-sm font-semibold text-[#3A3632]">Ngân sách tối đa (VND)</legend>
            <input
              type="text"
              inputMode="numeric"
              aria-label="Ngân sách tối đa (VND)"
              value={form.budget}
              onChange={event => {
                const value = event.target.value
                setForm(previous => ({ ...previous, budget: value, hardBudget: value.trim() ? previous.hardBudget : false }))
                setBudgetError('')
              }}
              aria-describedby={budgetError ? 'stylist-budget-error stylist-budget-help' : 'stylist-budget-help'}
              placeholder="Ví dụ: 500.000"
              className="min-h-11 rounded-lg border border-[#C9C6C4] px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A] focus-visible:ring-offset-2"
              disabled={busy}
            />
            <label className="flex min-h-11 items-center gap-2 text-sm text-[#3A3632]">
              <input
                type="checkbox"
                checked={form.hardBudget && Boolean(form.budget.trim())}
                onChange={event => update('hardBudget', event.target.checked)}
                disabled={busy || !form.budget.trim()}
              />
              Bắt buộc không vượt ngân sách này
            </label>
            <p id="stylist-budget-help" className="text-xs leading-5 text-[#5E5F5D]">
              Nếu không bật giới hạn, ngân sách chỉ là tiêu chí ưu tiên và gợi ý có thể vượt mức này.
            </p>
            {budgetError && <p id="stylist-budget-error" role="alert" className="text-sm text-[#A94B4B]">{budgetError}</p>}
          </fieldset>

          <ExcludedColorSelect value={form.excludedColors} onChange={value => update('excludedColors', value)} disabled={busy} />

          <p className="text-sm leading-5 text-[#5E5F5D]">
            Nhập ít nhất một nhu cầu như mô tả, dịp mặc, mục đích hoặc phong cách. Ngân sách và màu tránh không thay thế mô tả nhu cầu.
          </p>
          <button
            type="submit"
            disabled={busy || !hasNeed || !budgetIsValid}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#684B5A] px-4 text-sm font-semibold text-white transition hover:bg-[#563E4A] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A] focus-visible:ring-offset-2"
          >
            {buttonText}
          </button>
        </form>

        <section aria-label="Gợi ý phối đồ" className="grid min-h-80 content-start gap-4 rounded-lg border border-[#E3E2E2] bg-white p-5">
          <div>
            <h2 className="text-xl font-semibold text-[#222222]">Gợi ý phối đồ</h2>
            <p className="mt-1 text-sm leading-6 text-[#5E5F5D]">Sản phẩm và giá được hiển thị theo chi tiết do backend trả về.</p>
          </div>

          {requestId && (
            <p className="text-xs text-[#5E5F5D]">
              Mã yêu cầu: {requestId}
              {requestStatus ? ' · ' + requestStatus : ' · Chưa xác định trạng thái cuối'}
            </p>
          )}

          {flow === 'idle' && (
            <p role="status" className="rounded-lg bg-[#F5F3F3] p-4 text-sm leading-6 text-[#3A3632]">
              Chưa nhập nhu cầu. Kết quả sẽ xuất hiện ở đây sau khi Stylist xử lý yêu cầu.
            </p>
          )}
          {flow === 'saving' && <p role="status" className="text-sm text-[#3A3632]">Đang lưu yêu cầu…</p>}
          {(flow === 'received' || flow === 'generating') && (
            <p role="status" className="rounded-lg bg-[#F5F3F3] p-4 text-sm leading-6 text-[#3A3632]">
              {flow === 'received' ? 'Yêu cầu đã được lưu (RECEIVED).' : 'Yêu cầu đã lưu (RECEIVED). Đang tạo gợi ý…'}
            </p>
          )}
          {flow === 'processing' && (
            <p role="status" className="rounded-lg bg-[#F5F3F3] p-4 text-sm leading-6 text-[#3A3632]">
              Backend đang xử lý yêu cầu. Gợi ý chưa sẵn sàng; không gửi lại yêu cầu này.
            </p>
          )}
          {flow === 'loading_details' && <p role="status" className="text-sm text-[#3A3632]">Tạo gợi ý thành công. Đang tải chi tiết sản phẩm…</p>}
          {flow === 'no_result' && (
            <p role="status" className="rounded-lg bg-[#F5F3F3] p-4 text-sm leading-6 text-[#3A3632]">
              Chưa tìm được một bộ đủ cả TOP và BOTTOM phù hợp với nhu cầu này.
            </p>
          )}
          {(flow === 'failed' || flow === 'detail_failed') && errorMessage && (
            <div role="alert" className="rounded-lg border border-[#E3E2E2] bg-[#F5F3F3] p-4 text-sm leading-6 text-[#3A3632]">
              {errorMessage}
              {flow === 'failed' && requestStatus === 'FAILED' && <p className="mt-2 font-semibold">Trạng thái yêu cầu: FAILED</p>}
              {flow === 'failed' && !requestStatus && <p className="mt-2">Trạng thái cuối chưa xác nhận được.</p>}
            </div>
          )}
          {flow === 'succeeded' && recommendations.map(recommendation => (
            <RecommendationView key={recommendation.recommendation_id} recommendation={recommendation} />
          ))}
        </section>
      </div>
    </section>
  )
}
