export type Role = 'buyer' | 'individual' | 'dealer'

export type User = {
  id: string
  role: Role
  name: string
  email: string
  phone: string
  location: string
  avatarUrl: string
  dealershipName: string
  logoUrl: string
  description: string
  address: string
  businessDetails: string
  status: string
}

export type PublicSeller = {
  id: string
  role?: Role
  name?: string
  location?: string
  avatarUrl?: string
  dealershipName?: string
  logoUrl?: string
  description?: string
  address?: string
  businessDetails?: string
}

export type VehicleImage = { url: string; filename: string }

export type Vehicle = {
  id: string
  title: string
  makeId: string
  modelId: string
  makeName: string
  modelName: string
  variant: string
  manufacturingYear: number
  registrationYear: number | null
  fuelTypeId: string
  fuelName: string
  transmissionId: string
  transmissionName: string
  vehicleTypeId: string
  vehicleTypeName: string
  kilometers: number
  owners: number
  condition: string
  price: number
  location: string
  color: string
  description: string
  specs: { label: string; value: string }[]
  images: VehicleImage[]
  insured: boolean
  insuranceExpiry: string
  sellerRole: Role | string
  seller: PublicSeller
  status: string
  createdAt: string
  favourited?: boolean
  rejectionReason?: string
  registrationNumber?: string
  insurancePolicyNumber?: string
}

export type Paged<T> = { items: T[]; total: number; page: number; pages: number }

export type Settings = { individualListingLimit: number; currencyLabel: string }

export type Lookup = { id: string; name: string; kind?: string }

export type Catalog = {
  makes: { id: string; name: string; models: { id: string; name: string }[] }[]
  fuels: Lookup[]
  transmissions: Lookup[]
  vehicleTypes: Lookup[]
  conditions: string[]
  settings: Settings
}

export type Enquiry = {
  id: string
  vehicleId: string
  vehicleTitle: string
  buyerName: string
  buyerPhone: string
  buyerEmail: string
  message: string
  status: 'new' | 'read' | 'closed'
  createdAt: string
}

export type Notice = {
  id: string
  type: string
  title: string
  body: string
  link: string
  read: boolean
  createdAt: string
}
