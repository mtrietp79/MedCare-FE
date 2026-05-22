const facilities = [
  {
    image: '/images/facilities/clinic1.png',
    title: 'Phòng khám chuyên khoa',
    description: 'Cơ sở vật chất hiện đại, trang thiết bị y tế tiên tiến',
  },
  {
    image: '/images/facilities/clinic2.png',
    title: 'Phòng chờ thoải mái',
    description: 'Không gian yên tĩnh, thoáng đãng cho bệnh nhân',
  },
  {
    image: '/images/facilities/lab1.png',
    title: 'Phòng xét nghiệm',
    description: 'Hệ thống xét nghiệm máy móc hiện đại',
  },
  {
    image: '/images/facilities/lab2.png',
    title: 'Phòng chẩn đoán',
    description: 'Máy chẩn đoán hình ảnh công nghệ cao',
  },
]

export function FacilitiesSection() {
  return (
    <section className="py-16 md:py-24 bg-slate-100/80">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Cơ sở vật chất của chúng tôi
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Thiết bị y tế hiện đại, không gian thoáng đãng và chuyên nghiệp
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {facilities.map((facility) => (
            <article
              key={facility.title}
              className="group rounded-2xl overflow-hidden border border-border bg-white shadow-sm hover:shadow-lg transition-all duration-300 min-h-64"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={facility.image}
                  alt={facility.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4">
                  <h3 className="font-semibold text-white mb-1">{facility.title}</h3>
                  <p className="text-sm text-white/85">{facility.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
