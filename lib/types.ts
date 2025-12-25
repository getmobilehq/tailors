export type UserRole = 'customer' | 'runner' | 'tailor' | 'admin'

export type OrderStatus = 
  | 'booked' 
  | 'pickup_scheduled' 
  | 'collected' 
  | 'in_progress' 
  | 'ready' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'completed' 
  | 'cancelled'

export type PickupSlot = 'morning' | 'afternoon' | 'evening'

export interface User {
  id: string
  email: string
  phone: string | null
  full_name: string
  role: UserRole
  avatar_url: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  name: string
  category: string
  base_price: number
  price: number // Alias for base_price for compatibility
  description: string | null
  estimated_days: number
  active: boolean
  popular: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Address {
  line1: string
  line2?: string
  city: string
  postcode: string
}

export interface SavedAddress extends Address {
  id: string
  user_id: string
  label: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  customer_id: string
  runner_id: string | null
  tailor_id: string | null
  status: OrderStatus
  subtotal: number
  delivery_fee: number
  total: number
  customer_address: Address
  customer_phone: string
  customer_notes: string | null
  pickup_date: string | null
  pickup_slot: PickupSlot | null
  estimated_completion: string | null
  measurements: Record<string, number> | null
  runner_notes: string | null
  admin_notes: string | null
  collected_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  // Relations
  customer?: User
  runner?: User
  tailor?: User
  items?: OrderItem[]
  payment?: Payment
}

export interface OrderItem {
  id: string
  order_id: string
  service_id: string
  garment_description: string
  quantity: number
  price: number
  photos: string[]
  notes: string | null
  status: 'pending' | 'in_progress' | 'done'
  tailor_notes: string | null
  completion_photos: string[]
  created_at: string
  // Relations
  service?: Service
}

export interface Payment {
  id: string
  order_id: string
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  amount: number
  status: 'pending' | 'succeeded' | 'failed' | 'refunded'
  refund_amount: number | null
  refund_reason: string | null
  created_at: string
}

export interface Message {
  id: string
  order_id: string
  sender_id: string
  content: string
  attachments: string[]
  read_by: string[] // Array of user IDs who have read the message
  created_at: string
  sender?: User
}

export interface Review {
  id: string
  order_id: string
  customer_id: string
  overall_rating: number
  runner_rating: number | null
  quality_rating: number | null
  comment: string | null
  created_at: string
}

export interface CartItem {
  service: Service
  garment_description: string
  quantity: number
  photos: string[]
  notes: string
}

export interface RunnerProfile {
  user_id: string
  service_postcodes: string[]
  availability: Record<string, any>
  max_daily_jobs: number
  rating: number
  completed_jobs: number
  created_at: string
}

export interface TailorProfile {
  user_id: string
  business_name: string | null
  specializations: string[]
  weekly_capacity: number
  turnaround_days: number
  rating: number
  completed_jobs: number
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  order_id: string
  type: 'order_update' | 'action_required' | 'order_complete'
  title: string
  message: string
  action_url: string | null
  read: boolean
  created_at: string
}

export interface TimelineEntry {
  id: string
  order_id: string
  status: OrderStatus
  actor_id: string | null
  actor_role: UserRole | null
  notes: string | null
  created_at: string
}
