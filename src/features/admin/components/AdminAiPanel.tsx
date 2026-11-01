import { Pencil, Plus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'

import type { DemoAction, DemoDatabase } from '@/app/store/types'
import type { CompatibilityRule, FashionMetadata, FashionMetadataOption } from '@/entities/product/model/types'
import { Button, Modal, SelectField, TextField, useToast } from '@/shared/ui'

import { StatusBadge } from './AdminCommon'

interface AdminAiPanelProps {
  database: DemoDatabase
  dispatch: React.Dispatch<DemoAction>
}

type AiTab = 'metadata' | 'rules'
type MetadataGroup = keyof FashionMetadata

interface MetadataFormState {
  group: MetadataGroup
  id: string
  label: string
}

interface RuleFormState {
  id: string
  sourceType: string
  targetType: string
  score: string
  note: string
}

interface EditingMetadata {
  group: MetadataGroup
  id: string
}

const metadataGroupLabels: Record<MetadataGroup, string> = {
  styles: 'Phong cách',
  occasions: 'Dịp sử dụng',
  colors: 'Màu sắc',
  materials: 'Chất liệu',
  fits: 'Phom dáng',
  patterns: 'Họa tiết',
}

const metadataGroups = Object.keys(metadataGroupLabels) as MetadataGroup[]

function createMetadataForm(): MetadataFormState {
  return { group: 'styles', id: '', label: '' }
}

function createMetadataFormFromOption(group: MetadataGroup, option: FashionMetadataOption): MetadataFormState {
  return { group, id: option.id, label: option.label }
}

function createRuleForm(): RuleFormState {
  return { id: '', sourceType: '', targetType: '', score: '', note: '' }
}

function createRuleFormFromRule(rule: CompatibilityRule): RuleFormState {
  return {
    id: rule.id,
    sourceType: rule.sourceType,
    targetType: rule.targetType,
    score: String(rule.score),
    note: rule.note,
  }
}

function statusTone(active: boolean) {
  return active ? 'success' : 'neutral'
}

export function AdminAiPanel({ database, dispatch }: AdminAiPanelProps) {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<AiTab>('metadata')
  const [metadataModalOpen, setMetadataModalOpen] = useState(false)
  const [ruleModalOpen, setRuleModalOpen] = useState(false)
  const [editingMetadata, setEditingMetadata] = useState<EditingMetadata | null>(null)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [metadataForm, setMetadataForm] = useState<MetadataFormState>(() => createMetadataForm())
  const [ruleForm, setRuleForm] = useState<RuleFormState>(() => createRuleForm())
  const [formError, setFormError] = useState<string | null>(null)

  const compatibilityRules = useMemo(
    () => [...database.compatibilityRules].sort((first, second) => first.id.localeCompare(second.id)),
    [database.compatibilityRules],
  )

  const openMetadataModal = () => {
    setEditingMetadata(null)
    setMetadataForm(createMetadataForm())
    setFormError(null)
    setMetadataModalOpen(true)
  }

  const openEditMetadataModal = (group: MetadataGroup, optionId: string) => {
    const option = database.fashionMetadata[group].find(item => item.id === optionId)
    if (!option) return

    setEditingMetadata({ group, id: optionId })
    setMetadataForm(createMetadataFormFromOption(group, option))
    setFormError(null)
    setMetadataModalOpen(true)
  }

  const openRuleModal = () => {
    setEditingRuleId(null)
    setRuleForm(createRuleForm())
    setFormError(null)
    setRuleModalOpen(true)
  }

  const openEditRuleModal = (ruleId: string) => {
    const rule = database.compatibilityRules.find(item => item.id === ruleId)
    if (!rule) return

    setEditingRuleId(ruleId)
    setRuleForm(createRuleFormFromRule(rule))
    setFormError(null)
    setRuleModalOpen(true)
  }

  const submitMetadata = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const group = editingMetadata?.group ?? metadataForm.group
    const optionId = editingMetadata?.id ?? metadataForm.id.trim()
    const existingOption = editingMetadata ? database.fashionMetadata[group].find(option => option.id === editingMetadata.id) : undefined
    const duplicate = database.fashionMetadata[group].some(option => option.id === optionId && option.id !== editingMetadata?.id)
    const option: FashionMetadataOption = {
      id: optionId,
      label: metadataForm.label.trim(),
      active: existingOption?.active ?? true,
    }

    if (!option.id || !option.label) {
      setFormError('Vui lòng nhập đủ ID và tên hiển thị.')
      return
    }

    if (duplicate) {
      setFormError('ID thuộc tính đã tồn tại trong nhóm này.')
      return
    }

    dispatch({ type: 'admin/fashionMetadataOptionUpserted', payload: { group, option } })
    toast.success(editingMetadata ? 'Đã cập nhật thuộc tính AI.' : 'Đã thêm thuộc tính AI.')
    setMetadataModalOpen(false)
  }

  const submitRule = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const ruleId = editingRuleId ?? ruleForm.id.trim()
    const existingRule = editingRuleId ? database.compatibilityRules.find(rule => rule.id === editingRuleId) : undefined
    const duplicate = database.compatibilityRules.some(rule => rule.id === ruleId && rule.id !== editingRuleId)
    const score = Number(ruleForm.score)
    const rule: CompatibilityRule = {
      id: ruleId,
      sourceType: ruleForm.sourceType.trim(),
      targetType: ruleForm.targetType.trim(),
      score,
      note: ruleForm.note.trim(),
      active: existingRule?.active ?? true,
    }

    if (!rule.id || !rule.sourceType || !rule.targetType) {
      setFormError('Vui lòng nhập đủ ID, nguồn và đích.')
      return
    }

    if (!Number.isFinite(score) || score < 0) {
      setFormError('Điểm phải là số không âm.')
      return
    }

    if (duplicate) {
      setFormError('ID luật đã tồn tại.')
      return
    }

    dispatch({ type: 'admin/compatibilityRuleUpserted', payload: rule })
    toast.success(editingRuleId ? 'Đã cập nhật luật tương thích.' : 'Đã thêm luật tương thích.')
    setRuleModalOpen(false)
  }

  return (
    <section className="grid gap-5">
      <div>
        <p className="text-sm font-semibold text-[#684B5A]">Dữ liệu gợi ý</p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-[#222222] md:text-4xl">
          Quản lý dữ liệu AI
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6F6B67]">
          Quản trị các thuộc tính thời trang và luật tương thích dùng cho dữ liệu gợi ý phối đồ.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={activeTab === 'metadata' ? 'primary' : 'secondary'} onClick={() => setActiveTab('metadata')}>
            Thuộc tính AI
          </Button>
          <Button type="button" variant={activeTab === 'rules' ? 'primary' : 'secondary'} onClick={() => setActiveTab('rules')}>
            Luật tương thích
          </Button>
        </div>
        {activeTab === 'metadata' ? (
          <Button type="button" onClick={openMetadataModal} icon={<Plus size={17} aria-hidden="true" />}>
            Thêm thuộc tính AI
          </Button>
        ) : (
          <Button type="button" onClick={openRuleModal} icon={<Plus size={17} aria-hidden="true" />}>
            Thêm luật
          </Button>
        )}
      </div>

      {activeTab === 'metadata' ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {metadataGroups.map(group => (
            <section key={group} className="rounded-lg bg-white p-4 shadow-[0_10px_28px_rgba(58,54,50,0.07)]">
              <h2 className="font-display text-2xl font-semibold text-[#222222]">{metadataGroupLabels[group]}</h2>
              <div className="mt-4 grid gap-2">
                {database.fashionMetadata[group].map(option => (
                  <article key={option.id} className="grid gap-3 rounded-lg border border-[#E3DAD0] p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[#222222]">{option.label}</p>
                        <StatusBadge tone={statusTone(option.active)}>{option.active ? 'Đang bật' : 'Đã tắt'}</StatusBadge>
                      </div>
                      <p className="mt-1 break-all text-sm font-semibold text-[#684B5A]">{option.id}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-9 px-3"
                        icon={<Pencil size={16} aria-hidden="true" />}
                        onClick={() => openEditMetadataModal(group, option.id)}
                      >
                        Sửa thuộc tính {option.id}
                      </Button>
                      <Button
                        type="button"
                        variant={option.active ? 'danger' : 'secondary'}
                        className="min-h-9 px-3"
                        onClick={() => {
                          dispatch({
                            type: 'admin/fashionMetadataOptionStatusChanged',
                            payload: { group, optionId: option.id, active: !option.active },
                          })
                          toast.info(option.active ? 'Đã tắt thuộc tính AI.' : 'Đã bật thuộc tính AI.')
                        }}
                      >
                        {option.active ? `Tắt thuộc tính ${option.id}` : `Bật thuộc tính ${option.id}`}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {compatibilityRules.length === 0 ? (
            <p className="rounded-lg bg-white p-4 text-sm text-[#6F6B67] shadow-[0_10px_28px_rgba(58,54,50,0.07)]">
              Chưa có luật tương thích nào.
            </p>
          ) : (
            compatibilityRules.map(rule => (
              <article key={rule.id} className="grid gap-4 rounded-lg bg-white p-4 shadow-[0_10px_28px_rgba(58,54,50,0.07)] xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-all font-display text-2xl font-semibold text-[#222222]">{rule.id}</h2>
                    <StatusBadge tone={statusTone(rule.active)}>{rule.active ? 'Đang bật' : 'Đã tắt'}</StatusBadge>
                  </div>
                  <p className="mt-2 break-all text-sm leading-6 text-[#6F6B67]">
                    {rule.sourceType} → {rule.targetType} · Điểm {rule.score}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#3A3632]">{rule.note}</p>
                </div>
                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    icon={<Pencil size={16} aria-hidden="true" />}
                    onClick={() => openEditRuleModal(rule.id)}
                  >
                    Sửa luật {rule.id}
                  </Button>
                  <Button
                    type="button"
                    variant={rule.active ? 'danger' : 'secondary'}
                    onClick={() => {
                      dispatch({
                        type: 'admin/compatibilityRuleStatusChanged',
                        payload: { ruleId: rule.id, active: !rule.active },
                      })
                      toast.info(rule.active ? 'Đã tắt luật tương thích.' : 'Đã bật luật tương thích.')
                    }}
                  >
                    {rule.active ? `Tắt luật ${rule.id}` : `Bật luật ${rule.id}`}
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      <Modal
        open={metadataModalOpen}
        title={editingMetadata ? 'Sửa thuộc tính AI' : 'Thêm thuộc tính AI'}
        description="Thuộc tính được dùng trong dữ liệu phân loại và gợi ý phối đồ."
        onClose={() => setMetadataModalOpen(false)}
      >
        <form className="grid gap-4" onSubmit={submitMetadata}>
          {formError && <p className="rounded-lg bg-[#FCEAEA] p-3 text-sm font-semibold text-[#A94B4B]">{formError}</p>}
          <SelectField
            label="Nhóm dữ liệu"
            value={metadataForm.group}
            disabled={Boolean(editingMetadata)}
            onChange={event => setMetadataForm(current => ({ ...current, group: event.target.value as MetadataGroup }))}
          >
            {metadataGroups.map(group => (
              <option key={group} value={group}>
                {metadataGroupLabels[group]}
              </option>
            ))}
          </SelectField>
          <TextField
            label="ID thuộc tính"
            value={metadataForm.id}
            readOnly={Boolean(editingMetadata)}
            className={editingMetadata ? 'bg-[#F5F2EE]' : ''}
            onChange={event => setMetadataForm(current => ({ ...current, id: event.target.value }))}
          />
          <TextField
            label="Tên hiển thị"
            value={metadataForm.label}
            onChange={event => setMetadataForm(current => ({ ...current, label: event.target.value }))}
          />
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setMetadataModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Lưu thuộc tính</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={ruleModalOpen}
        title={editingRuleId ? 'Sửa luật tương thích' : 'Thêm luật tương thích'}
        description="Luật mô tả quan hệ giữa hai nhóm dữ liệu để phục vụ gợi ý phối đồ."
        onClose={() => setRuleModalOpen(false)}
      >
        <form className="grid gap-4" onSubmit={submitRule}>
          {formError && <p className="rounded-lg bg-[#FCEAEA] p-3 text-sm font-semibold text-[#A94B4B]">{formError}</p>}
          <TextField
            label="ID luật"
            value={ruleForm.id}
            readOnly={Boolean(editingRuleId)}
            className={editingRuleId ? 'bg-[#F5F2EE]' : ''}
            onChange={event => setRuleForm(current => ({ ...current, id: event.target.value }))}
          />
          <TextField
            label="Nguồn"
            value={ruleForm.sourceType}
            onChange={event => setRuleForm(current => ({ ...current, sourceType: event.target.value }))}
          />
          <TextField
            label="Đích"
            value={ruleForm.targetType}
            onChange={event => setRuleForm(current => ({ ...current, targetType: event.target.value }))}
          />
          <TextField
            label="Điểm"
            type="number"
            min="0"
            value={ruleForm.score}
            onChange={event => setRuleForm(current => ({ ...current, score: event.target.value }))}
          />
          <TextField label="Ghi chú" value={ruleForm.note} onChange={event => setRuleForm(current => ({ ...current, note: event.target.value }))} />
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setRuleModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Lưu luật</Button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
