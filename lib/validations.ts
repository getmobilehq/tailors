import { z } from 'zod'

export const addressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  postcode: z.string().regex(/^NG\d{1,2}\s?\d[A-Z]{2}$/i, 'Must be a valid Nottingham postcode (NG)'),
})

export const phoneSchema = z.string().regex(/^(\+44|0)\d{10}$/, 'Must be a valid UK phone number')

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Full name is required'),
  phone: phoneSchema,
})

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const cartItemSchema = z.object({
  service_id: z.string().uuid(),
  garment_description: z.string().min(5, 'Please describe the garment'),
  quantity: z.number().min(1).default(1),
  photos: z.array(z.string()).default([]),
  notes: z.string().optional(),
})

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Cart cannot be empty'),
  address: addressSchema,
  phone: phoneSchema,
  notes: z.string().optional(),
  pickup_date: z.string().min(1, 'Pickup date is required'),
  pickup_slot: z.enum(['morning', 'afternoon', 'evening']),
})

export const measurementSchema = z.object({
  chest: z.number().optional(),
  waist: z.number().optional(),
  hips: z.number().optional(),
  inseam: z.number().optional(),
  outseam: z.number().optional(),
  sleeve: z.number().optional(),
  shoulder: z.number().optional(),
  neck: z.number().optional(),
})

export const reviewSchema = z.object({
  overall_rating: z.number().min(1).max(5),
  runner_rating: z.number().min(1).max(5).optional(),
  quality_rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
})
