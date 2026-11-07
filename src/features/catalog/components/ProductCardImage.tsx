import { Shirt } from 'lucide-react'
import { useState } from 'react'

export function ProductCardImage({ src, alt }: { src?: string; alt: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  if (!src || src === failedSrc) {
    return <div className="grid aspect-[4/5] w-full place-content-center gap-3 bg-[#EFEDED] text-center text-sm text-[#5E5F5D]"><Shirt size={36} className="mx-auto text-[#9D9894]" aria-hidden="true" /><span>Chưa có ảnh</span></div>
  }
  return <img src={src} alt={alt} onError={() => setFailedSrc(src)} className="block aspect-[4/5] w-full min-w-0 object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none" />
}
