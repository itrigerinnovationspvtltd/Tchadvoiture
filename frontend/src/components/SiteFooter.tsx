import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { PLATFORM_SUPPORT_EMAIL } from '../content/faqs'

const linkClass =
  'cursor-pointer text-sm text-white/70 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-sm'

export function SiteFooter() {
  const { user } = useAuth()
  const sellTo = user && user.role !== 'buyer' ? '/my-listings/new' : '/signup'
  const year = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden bg-charcoal text-white">
      <div className="footer-watermark pointer-events-none absolute inset-x-0 bottom-0 select-none" aria-hidden>
        Tchadvoiture
      </div>
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div>
            <p className="text-lg font-bold">
              Tchad<span className="text-white/90">voiture</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Approved listings from dealers and individual sellers. Seller phone numbers stay private until you send an enquiry.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Marketplace</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link to="/cars" className={linkClass}>Buy a car</Link>
              <Link to={sellTo} className={linkClass}>Sell a car</Link>
              <Link to="/wishlist" className={linkClass}>Wishlist</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Company</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link to="/about" className={linkClass}>About</Link>
              <Link to="/faq" className={linkClass}>FAQ</Link>
              <Link to="/terms" className={linkClass}>Terms</Link>
              <Link to="/privacy" className={linkClass}>Privacy</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Contact</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-white/70">
              <Link to="/contact" className={linkClass}>Contact us</Link>
              <a href={`mailto:${PLATFORM_SUPPORT_EMAIL}`} className={linkClass}>
                {PLATFORM_SUPPORT_EMAIL}
              </a>
              <p className="text-white/60">N&apos;Djamena, Chad</p>
            </div>
          </div>
        </div>
        <p className="relative mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © {year} Tchadvoiture. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
