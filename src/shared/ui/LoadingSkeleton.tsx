interface LoadingSkeletonProps {
  className?: string
}

export function LoadingSkeleton({ className = '' }: LoadingSkeletonProps) {
  return <div aria-hidden="true" className={`ai-shimmer rounded-lg ${className}`} />
}
