/** Navy brand color for Simple Icons CDN (hex without #). */
export const BRAND_LOGO_COLOR = '0f2a5f'

const CDN = 'https://cdn.simpleicons.org'

/** Catalog make name → Simple Icons slug */
export const BRAND_LOGO_SLUGS: Record<string, string> = {
  Toyota: 'toyota',
  Honda: 'honda',
  Hyundai: 'hyundai',
  Nissan: 'nissan',
  Kia: 'kia',
}

/** Makes not on Simple Icons — full image URL (SVG/PNG). */
export const BRAND_LOGO_URL_OVERRIDES: Record<string, string> = {
  'Mercedes-Benz': 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg',
}

function slugFromName(makeName: string): string | undefined {
  const mapped = BRAND_LOGO_SLUGS[makeName]
  if (mapped) return mapped
  const normalized = makeName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
  return normalized || undefined
}

export function brandLogoUrl(makeName: string): string | undefined {
  const override = BRAND_LOGO_URL_OVERRIDES[makeName]
  if (override) return override
  const slug = slugFromName(makeName)
  if (!slug) return undefined
  return `${CDN}/${slug}/${BRAND_LOGO_COLOR}`
}
