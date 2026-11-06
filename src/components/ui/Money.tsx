import React from 'react'
import { formatVND } from '../../data/mockData'

interface MoneyProps {
  amount: number
  className?: string
  style?: React.CSSProperties
  originalAmount?: number
}

export default function Money({ amount, className = '', style, originalAmount }: MoneyProps) {
  const formatted = formatVND(amount)
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium ${className}`} style={style} aria-label={`${amount.toLocaleString('vi-VN')} Đồng Việt Nam`}>
      {originalAmount && originalAmount > amount && (
        <span className="line-through text-xs text-muted font-normal">
          {formatVND(originalAmount)}
        </span>
      )}
      <span className="tracking-tight">{formatted}</span>
    </span>
  )
}
