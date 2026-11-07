import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from './ToastProvider'

export function UnavailableFeature({ title, backTo = '/wardrobes', backLabel = 'Khám phá tủ đồ' }: { title: string; backTo?: string; backLabel?: string }) {
  const toast = useToast()
  useEffect(() => { toast.info('Chức năng chưa hỗ trợ.') }, [toast])
  return <section className="mx-auto max-w-3xl px-5 py-16"><h1 className="font-display text-4xl">{title}</h1><p className="mt-4 text-sm text-secondary">Chức năng này đang được phát triển.</p><Link className="mt-6 inline-block underline" to={backTo}>{backLabel}</Link></section>
}
