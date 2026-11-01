const steps = [
  'Chọn sản phẩm quần áo thật trong cửa hàng.',
  'Lưu màu, size và chất liệu vào tủ đồ cá nhân.',
  'Gợi ý phối đồ dựa trên phong cách và dịp sử dụng.',
  'Chuyển các lựa chọn phù hợp vào giỏ hàng.',
]

export function WardrobeIntro() {
  return (
    <section className="bg-[#FDFCFA] px-5 py-14 md:px-8">
      <div className="mx-auto max-w-[var(--container-wide)]">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[#684B5A]">AI Wardrobe</p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-[#222222]">Tủ đồ AI bắt đầu từ dữ liệu rõ ràng</h2>
          <p className="mt-4 text-base leading-7 text-[#6F6B67]">
            Tủ đồ giúp bạn lưu outfit thủ công, nhận gợi ý AI và chuyển các món phù hợp vào giỏ hàng khi muốn mua sắm.
          </p>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-4">
          {steps.map((step, index) => (
            <article key={step} className="rounded-lg bg-[#FAF8F5] p-4">
              <span className="text-sm font-semibold text-[#684B5A]">{String(index + 1).padStart(2, '0')}</span>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#3A3632]">{step}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
