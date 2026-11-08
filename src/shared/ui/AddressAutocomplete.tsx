import { useEffect, useId, useState } from 'react'

interface Props { label: string; value: string; onChange: (value: string) => void; error?: string; required?: boolean; token?: string; id?: string }
interface Suggestion { id: string; label: string }

export default function AddressAutocomplete({ label, value, onChange, error, required, token = import.meta.env.VITE_LOCATIONIQ_TOKEN, id: providedId }: Props) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  useEffect(() => {
    const query = search.trim()
    if (query.length < 3 || !token) { setSuggestions([]); setStatus(''); return }
    const controller = new AbortController()
    setStatus('Đang tìm địa chỉ…')
    const timer = window.setTimeout(() => {
      const url = new URL('https://api.locationiq.com/v1/autocomplete')
      url.search = new URLSearchParams({ key: token, q: query.slice(0, 200), countrycodes: 'vn', limit: '5' }).toString()
      void fetch(url.toString(), { signal: controller.signal }).then(async response => {
        if (response.status === 404) return []
        if (!response.ok) throw new Error('request failed')
        const data: unknown = await response.json()
        if (!Array.isArray(data)) throw new Error('invalid response')
        return data.flatMap((item, index) => typeof item?.display_name === 'string' && item.display_name.trim()
          ? [{ id: `${item.place_id ?? index}-${index}`, label: item.display_name as string }] : [])
      }).then(items => { if (!controller.signal.aborted) { setSuggestions(items); setActive(-1); setStatus(items.length ? '' : 'Không tìm thấy gợi ý. Bạn vẫn có thể nhập địa chỉ thủ công.') } })
        .catch(() => { if (!controller.signal.aborted) { setSuggestions([]); setStatus('Không tải được gợi ý. Bạn vẫn có thể nhập địa chỉ thủ công.') } })
    }, 600)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [search, token])

  const select = (item: Suggestion) => { onChange(item.label); setSearch(''); setSuggestions([]); setOpen(false); setActive(-1); setStatus('') }
  return <div className="relative grid gap-1.5 text-sm font-semibold text-[#3A3632]">
    <label htmlFor={id}>{label}</label>
    <input id={id} role="combobox" aria-autocomplete="list" aria-expanded={open && suggestions.length > 0} aria-controls={`${id}-list`} aria-activedescendant={active >= 0 ? `${id}-option-${active}` : undefined} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} autoComplete="off" required={required} maxLength={500} value={value} onFocus={() => setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 150)} onChange={event => { setSuggestions([]); setActive(-1); onChange(event.target.value); setSearch(event.target.value); setOpen(true) }} onKeyDown={event => {
      if (event.key === 'ArrowDown' && suggestions.length) { event.preventDefault(); setOpen(true); setActive(current => Math.min(current + 1, suggestions.length - 1)) }
      if (event.key === 'ArrowUp' && suggestions.length) { event.preventDefault(); setActive(current => Math.max(current - 1, 0)) }
      if (event.key === 'Enter' && open && active >= 0 && suggestions[active]) { event.preventDefault(); select(suggestions[active]) }
      if (event.key === 'Escape') { setOpen(false); setActive(-1) }
    }} className="h-11 rounded-lg border border-[#C4C7C7] bg-white px-3 text-sm font-medium outline-none focus:border-[#1C1B1B] focus:ring-2 focus:ring-[#1C1B1B]/20" />
    {open && suggestions.length > 0 && <ul id={`${id}-list`} role="listbox" className="absolute top-full z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[#E3E2E2] bg-white shadow-lg">{suggestions.map((item, index) => <li id={`${id}-option-${index}`} key={item.id} role="option" aria-selected={index === active} onMouseDown={event => event.preventDefault()} onClick={() => select(item)} className={`cursor-pointer px-3 py-3 text-sm font-normal hover:bg-[#F5F2EE] ${index === active ? 'bg-[#F5F2EE]' : ''}`}>{item.label}</li>)}</ul>}
    {error && <span id={`${id}-error`} className="text-xs font-medium text-[#A94B4B]">{error}</span>}
    {status && open && <span role="status" className="text-xs font-normal text-[#5E5F5D]">{status}</span>}
    {!token && <span className="text-xs font-normal text-[#5E5F5D]">Chưa cấu hình gợi ý địa chỉ. Bạn có thể nhập thủ công.</span>}
    {token && <a href="https://locationiq.com" target="_blank" rel="noreferrer" className="text-xs font-normal text-[#5E5F5D] underline">Search by LocationIQ.com</a>}
  </div>
}
