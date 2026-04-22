export function SpecialtyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Chuyên khoa</h1>
        <p className="text-muted-foreground">Chọn chuyên khoa để tìm bác sĩ phù hợp</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Specialty cards */}
        {[
          { name: 'Tim mạch', icon: '❤️' },
          { name: 'Nhi khoa', icon: '👶' },
          { name: 'Nha khoa', icon: '🦷' },
          { name: 'Mắt khoa', icon: '👁️' },
          { name: 'Tai mũi họng', icon: '👂' },
          { name: 'Da liễu', icon: '🩹' },
        ].map((specialty) => (
          <div
            key={specialty.name}
            className="p-6 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="text-4xl mb-4">{specialty.icon}</div>
            <h3 className="font-semibold text-lg">{specialty.name}</h3>
          </div>
        ))}
      </div>
    </div>
  )
}
