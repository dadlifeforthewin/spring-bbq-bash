import { z } from 'zod'

export const parentSchema = z.object({
  name: z.string().min(1, 'Name required').max(120),
  phone: z.string().min(7, 'Phone required').max(30),
  email: z.string().email('Valid email required'),
})

export const pickupAuthorizationSchema = z.object({
  name: z.string().min(1).max(120),
  relationship: z.string().max(60).optional().or(z.literal('')),
})

export const childSchema = z.object({
  first_name: z.string().min(1).max(60),
  last_name: z.string().min(1).max(60),
  age: z.number().int().min(1).max(25).nullable().optional(),
  grade: z.string().max(30).optional().or(z.literal('')),
  allergies: z.string().max(1000).optional().or(z.literal('')),
  special_instructions: z.string().max(1000).optional().or(z.literal('')),
  pickup_authorizations: z.array(pickupAuthorizationSchema).max(20),
  facts_reload_permission: z.boolean(),
  facts_max_amount: z.number().int().min(0).max(10),
})

export const signatureInputSchema = z.object({
  typed_name: z.string().min(1, 'Please type your name to sign').max(120),
})

export const registrationSchema = z.object({
  primary_parent: parentSchema,
  secondary_parent: parentSchema.nullable(),
  children: z.array(childSchema).min(1, 'Add at least one child'),
  waiver_signature: signatureInputSchema,
  photo_consent_app: z.boolean(),
  photo_consent_promo: z.boolean(),
  vision_matching_consent: z.boolean(),
  photo_signature: signatureInputSchema,
})

export type RegistrationInput = z.infer<typeof registrationSchema>

export const walkupSchema = registrationSchema.extend({
  qr_code: z.string().uuid(),
})

export const registrationEditSchema = z.object({
  children: z.array(childSchema.extend({
    id: z.string().uuid(),
  })).min(1),
  primary_parent: parentSchema,
  secondary_parent: parentSchema.nullable(),
})
