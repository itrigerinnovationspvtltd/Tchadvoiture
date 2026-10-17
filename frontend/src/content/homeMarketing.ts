/**
 * Marketing copy and image paths for the homepage.
 * Images use seeded `/uploads/demo-*.jpg` assets (see backend seed); resolve with assetUrl() in components.
 */
import { MARKETING_HERO_IMAGE } from './faqs'

export type ProcessStep = {
  step: string
  title: string
  description: string
  image: string
  imageAlt: string
  link?: { href: string; label: string }
}

export const buySteps: ProcessStep[] = [
  {
    step: '01',
    title: 'Search approved cars',
    description:
      'Browse listings that passed admin review. Filter by make, city, price, body type, and mileage until you find the right match.',
    image: MARKETING_HERO_IMAGE,
    imageAlt: 'Approved cars available to browse on Tchadvoiture',
    link: { href: '/cars', label: 'Explore cars' },
  },
  {
    step: '02',
    title: 'Send an enquiry',
    description:
      'Open a listing and message the seller through the platform. Their phone number stays off the public page until they choose to share it.',
    image: '/uploads/demo-camry-ndjamena.jpg',
    imageAlt: 'Buyer reviewing a car listing before sending an enquiry',
    link: { href: '/signup', label: 'Create a free account' },
  },
  {
    step: '03',
    title: 'The seller replies',
    description:
      'The seller sees your name and phone from your account and answers in Enquiries. Arrange a viewing or next steps directly with them.',
    image: '/uploads/demo-corolla-moundou.jpg',
    imageAlt: 'Seller and buyer connecting after an enquiry',
    link: { href: '/cars', label: 'Start browsing' },
  },
]

export const sellSteps: ProcessStep[] = [
  {
    step: '01',
    title: 'Create your account',
    description:
      'Sign up as an individual or dealer. Add your contact details so buyers can reach you when you accept enquiries.',
    image: '/uploads/demo-crv-moundou.jpg',
    imageAlt: 'Seller preparing to list a vehicle on Tchadvoiture',
    link: { href: '/signup', label: 'Sign up to sell' },
  },
  {
    step: '02',
    title: 'List your car',
    description:
      'Use the step-by-step form: photos, price, location, specs, and condition. Save progress and submit when you are ready.',
    image: '/uploads/demo-camry-ndjamena.jpg',
    imageAlt: 'Adding car details and photos to a new listing',
    link: { href: '/my-listings/new', label: 'List a car' },
  },
  {
    step: '03',
    title: 'Get approved, then enquiries',
    description:
      'An admin reviews your listing before it goes live in search. Once approved, buyers can send enquiries and you reply from your dashboard.',
    image: MARKETING_HERO_IMAGE,
    imageAlt: 'Approved listing visible to buyers on the marketplace',
    link: { href: '#faq', label: 'How approval works' },
  },
]

export type WhyBentoItem = {
  num: string
  title: string
  text: string
}

export const whyBentoItems: WhyBentoItem[] = [
  {
    num: '01',
    title: 'Approved listings',
    text: 'Every car is reviewed by an admin before it appears in search, so buyers see vetted inventory—not unmoderated posts.',
  },
  {
    num: '02',
    title: 'Private seller contact',
    text: 'Enquiries keep seller phone numbers off public pages. Sellers respond when they are ready, with your details from your account.',
  },
  {
    num: '03',
    title: 'Dealers and individuals',
    text: 'Shop from dealerships or private owners. Seller type is shown on each listing so you know who you are contacting.',
  },
  {
    num: '04',
    title: 'Built for Chad',
    text: 'Listings use local currency labels, cities, and a flow designed for buying and selling cars in N’Djamena and beyond.',
  },
]

/** Feature photos for the bento grid (same upload pool as marketing pages). */
export const whyBentoPhotos = [
  { src: MARKETING_HERO_IMAGE, alt: 'Quality vehicle listed on Tchadvoiture' },
  { src: '/uploads/demo-corolla-moundou.jpg', alt: 'Car detail shown on an approved listing' },
  { src: '/uploads/demo-crv-moundou.jpg', alt: 'SUV listing on the marketplace' },
] as const

export const whyStats = [
  { label: 'Admin-reviewed listings' },
  { label: 'Private enquiries' },
  { label: 'Dealers & individuals' },
  { label: 'Free to browse' },
] as const
