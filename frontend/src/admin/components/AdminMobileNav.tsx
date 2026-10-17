import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Button, Sheet, SheetContent, SheetTrigger } from '@/components/ui'
import { AdminSidebar } from './AdminSidebar'

type AdminMobileNavProps = {
  onLogout: () => void
  pendingListings?: number
}

export function AdminMobileNav({ onLogout, pendingListings }: AdminMobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 transition-all duration-300 hover:bg-secondary lg:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <AdminSidebar
          onLogout={onLogout}
          pendingListings={pendingListings}
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
