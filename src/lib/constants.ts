export const DELIVERY_FEE = 7.00
export const CURRENCY = 'GBP'
export const CURRENCY_SYMBOL = '£'

export const SERVICE_CATEGORIES = [
  { id: 'trousers', name: 'Trousers', icon: '👖' },
  { id: 'jeans', name: 'Jeans & Chinos', icon: '🩳' },
  { id: 'shirts', name: 'Shirts & Jumpers', icon: '👔' },
  { id: 'jackets', name: 'Jackets & Coats', icon: '🧥' },
  { id: 'dresses', name: 'Dresses & Skirts', icon: '👗' },
  { id: 'zips', name: 'Zip Replacement', icon: '🔧' },
  { id: 'repairs', name: 'Repairs', icon: '🧵' },
] as const

export const ORDER_STATUSES = {
  booked: { label: 'Booked', color: 'blue' },
  pickup_scheduled: { label: 'Pickup Scheduled', color: 'blue' },
  collected: { label: 'Collected', color: 'yellow' },
  in_progress: { label: 'In Progress', color: 'yellow' },
  ready: { label: 'Ready', color: 'green' },
  out_for_delivery: { label: 'Out for Delivery', color: 'green' },
  delivered: { label: 'Delivered', color: 'green' },
  completed: { label: 'Completed', color: 'gray' },
  cancelled: { label: 'Cancelled', color: 'red' },
} as const

export const PICKUP_SLOTS = [
  { id: 'morning', label: 'Morning', time: '9:00 AM - 12:00 PM' },
  { id: 'afternoon', label: 'Afternoon', time: '12:00 PM - 5:00 PM' },
  { id: 'evening', label: 'Evening', time: '5:00 PM - 8:00 PM' },
] as const

export const NOTTINGHAM_POSTCODES = ['NG1', 'NG2', 'NG3', 'NG5', 'NG7', 'NG9']

export const STATUS_COLORS: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  green: 'bg-green-100 text-green-800',
  gray: 'bg-gray-100 text-gray-800',
  red: 'bg-red-100 text-red-800',
}
