export const DELIVERY_FEE = 7.00
export const CURRENCY = 'GBP'
export const CURRENCY_SYMBOL = '£'

// Tailor payout: 60% of subtotal (services only, excludes delivery fee)
export const TAILOR_PAYOUT_RATE = 0.60

/**
 * @deprecated Use database categories instead
 * Fetch from: supabase.from('categories').select('*').eq('active', true).order('sort_order')
 * This constant is kept for backward compatibility only.
 * Categories are now managed in the admin dashboard and stored in the database.
 */
export const SERVICE_CATEGORIES = [
  { id: 'trousers', name: 'Trousers & Jeans', icon: '👖' },
  { id: 'shirts', name: 'Shirts & Jumpers', icon: '👔' },
  { id: 'coats', name: 'Jackets & Coats', icon: '🧥' },
  { id: 'dresses', name: 'Dresses & Skirts', icon: '👗' },
  { id: 'other', name: 'Zips & Repairs', icon: '🔧' },
] as const

export const ORDER_STATUSES = {
  booked: { label: 'Booked', color: 'booking', phase: 'booking' },
  pickup_scheduled: { label: 'Pickup Scheduled', color: 'pickup', phase: 'pickup' },
  collected: { label: 'Collected', color: 'pickup', phase: 'pickup' },
  in_progress: { label: 'In Progress', color: 'processing', phase: 'processing' },
  ready: { label: 'Ready', color: 'qc', phase: 'qc' },
  out_for_delivery: { label: 'Out for Delivery', color: 'delivery', phase: 'delivery' },
  delivered: { label: 'Delivered', color: 'complete', phase: 'complete' },
  completed: { label: 'Completed', color: 'complete', phase: 'complete' },
  cancelled: { label: 'Cancelled', color: 'cancelled', phase: 'cancelled' },
} as const

export const PICKUP_SLOTS = [
  { id: 'morning', label: 'Morning', time: '9:00 AM - 12:00 PM' },
  { id: 'afternoon', label: 'Afternoon', time: '12:00 PM - 5:00 PM' },
  { id: 'evening', label: 'Evening', time: '5:00 PM - 8:00 PM' },
] as const

export const NOTTINGHAM_POSTCODES = ['NG1', 'NG2', 'NG3', 'NG5', 'NG7', 'NG9']

// Brand-aligned status colors using CSS variables
export const STATUS_COLORS: Record<string, string> = {
  // Phase-based colors (from brand tokens)
  booking: 'bg-[--phase-booking-light] text-[--phase-booking] border border-[--phase-booking]/20',
  pickup: 'bg-[--phase-pickup-light] text-[--phase-pickup] border border-[--phase-pickup]/20',
  processing: 'bg-[--phase-processing-light] text-[--phase-processing] border border-[--phase-processing]/20',
  qc: 'bg-[--phase-qc-light] text-[--phase-qc] border border-[--phase-qc]/20',
  delivery: 'bg-[--phase-delivery-light] text-[--phase-delivery] border border-[--phase-delivery]/20',
  complete: 'bg-[--phase-complete-light] text-[--phase-complete] border border-[--phase-complete]/20',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',

  // Legacy colors (backward compatibility)
  blue: 'bg-[--phase-booking-light] text-[--phase-booking]',
  yellow: 'bg-[--phase-qc-light] text-[--phase-qc]',
  green: 'bg-[--phase-pickup-light] text-[--phase-pickup]',
  gray: 'bg-slate-100 text-slate-700',
  red: 'bg-red-50 text-red-700',
}
