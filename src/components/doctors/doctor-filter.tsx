'use client'

import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { Specialty } from '@/types'
import { api } from '@/services/api'

interface DoctorFilterProps {
  searchQuery?: string
  onSearchChange?: (value: string) => void
  selectedSpecialty?: string
  onSpecialtyChange?: (value: string) => void
  sortBy?: string
  onSortChange?: (value: string) => void
}

export function DoctorFilter({
  searchQuery = '',
  onSearchChange = () => {},
  selectedSpecialty = 'all',
  onSpecialtyChange = () => {},
  sortBy = 'default',
  onSortChange = () => {},
}: DoctorFilterProps) {
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        setLoading(true)
        const data = await api.specialties.getAll()
        setSpecialties(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load specialties')
        console.error('Error fetching specialties:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSpecialties()
  }, [])

  const FilterContent = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Chuyên khoa
        </label>
        <Select value={selectedSpecialty} onValueChange={onSpecialtyChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tất cả chuyên khoa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chuyên khoa</SelectItem>
            {loading ? (
              <SelectItem value="" disabled>Đang tải...</SelectItem>
            ) : error ? (
              <SelectItem value="" disabled>Lỗi tải dữ liệu</SelectItem>
            ) : (
              specialties.map((specialty) => (
                <SelectItem key={specialty.id} value={specialty.id}>
                  {specialty.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Sắp xếp theo
        </label>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Mặc định" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Mặc định</SelectItem>
            <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
            <SelectItem value="experience">Kinh nghiệm nhiều nhất</SelectItem>
            <SelectItem value="price-low">Giá thấp đến cao</SelectItem>
            <SelectItem value="price-high">Giá cao đến thấp</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  return (
    <div className="bg-card rounded-xl border p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo tên bác sĩ"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Desktop Filters */}
        <div className="hidden md:flex items-center gap-3">
          <Select value={selectedSpecialty} onValueChange={onSpecialtyChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chuyên khoa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả chuyên khoa</SelectItem>
              {(Array.isArray(specialties) ? specialties : []).map((specialty) => (
                <SelectItem key={specialty.id} value={specialty.id}>
                  {specialty.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Mặc định</SelectItem>
              <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
              <SelectItem value="experience">Kinh nghiệm nhiều nhất</SelectItem>
              <SelectItem value="price-low">Giá thấp đến cao</SelectItem>
              <SelectItem value="price-high">Giá cao đến thấp</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mobile Filter Button */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Bộ lọc
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>Bộ lọc tìm kiếm</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
