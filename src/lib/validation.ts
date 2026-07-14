import { z } from 'zod';
import { passwordSchema } from '@/lib/auth/password';

/**
 * Central Zod validation schemas. Shared between server actions, API routes and
 * React Hook Form clients so validation is defined exactly once.
 */

export const enquiryTypeEnum = z.enum([
  'WEDDING',
  'PORTRAIT',
  'FAMILY',
  'EVENT',
  'COMMERCIAL',
  'EDITORIAL',
  'OTHER',
]);

export const enquirySchema = z.object({
  name: z.string().min(2, 'Please enter your name').max(120),
  email: z.string().email('Please enter a valid email address').max(200),
  phone: z.string().max(40).optional().or(z.literal('')),
  type: enquiryTypeEnum.default('OTHER'),
  eventDate: z.string().optional().or(z.literal('')),
  location: z.string().max(160).optional().or(z.literal('')),
  message: z.string().min(10, 'Please tell us a little about your enquiry').max(4000),
  // Honeypot field — must be empty. Bots tend to fill every field.
  website: z.string().max(0).optional().or(z.literal('')),
});
export type EnquiryInput = z.infer<typeof enquirySchema>;

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Please enter your password'),
  callbackUrl: z.string().optional(),
});

export const requestResetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const setPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

export const galleryPasswordSchema = z.object({
  password: z.string().min(1, 'Please enter the gallery password'),
});

// --- Admin schemas ---

export const portfolioSchema = z.object({
  title: z.string().min(2).max(160),
  slug: z
    .string()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens only')
    .optional(),
  category: z.string().min(2).max(80),
  intro: z.string().max(600).optional().or(z.literal('')),
  description: z.string().max(4000).optional().or(z.literal('')),
  isPublished: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
});
export type PortfolioInput = z.infer<typeof portfolioSchema>;

export const gallerySchema = z.object({
  title: z.string().min(2).max(160),
  slug: z
    .string()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens only')
    .optional(),
  clientName: z.string().min(2).max(160),
  shootDate: z.string().optional().or(z.literal('')),
  message: z.string().max(2000).optional().or(z.literal('')),
  expiresAt: z.string().optional().or(z.literal('')),
  isPublished: z.boolean().default(false),
  isDisabled: z.boolean().default(false),
  galleryPassword: z.string().max(200).optional().or(z.literal('')),
  allowImageDownload: z.boolean().default(false),
  allowGalleryDownload: z.boolean().default(false),
  allowFullResolution: z.boolean().default(false),
  showImageNumbers: z.boolean().default(false),
  watermarkEnabled: z.boolean().default(false),
});
export type GalleryInput = z.infer<typeof gallerySchema>;

export const clientSchema = z.object({
  email: z.string().email().max(200),
  displayName: z.string().min(2).max(160),
  company: z.string().max(160).optional().or(z.literal('')),
  phone: z.string().max(40).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});
export type ClientInput = z.infer<typeof clientSchema>;

export const imageMetadataSchema = z.object({
  caption: z.string().max(400).optional().or(z.literal('')),
  altText: z.string().max(400).optional().or(z.literal('')),
});

export const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export const siteSettingsSchema = z.object({
  studioName: z.string().min(1).max(160),
  tagline: z.string().max(240).optional().or(z.literal('')),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().max(40).optional().or(z.literal('')),
  areasServed: z.string().max(1000).optional().or(z.literal('')),
  responseTime: z.string().max(160).optional().or(z.literal('')),
  studioLocation: z.string().max(240).optional().or(z.literal('')),
  instagramUrl: z.string().url().optional().or(z.literal('')),
  pinterestUrl: z.string().url().optional().or(z.literal('')),
  facebookUrl: z.string().url().optional().or(z.literal('')),
  footerText: z.string().max(1000).optional().or(z.literal('')),
  seoTitle: z.string().max(160).optional().or(z.literal('')),
  seoDescription: z.string().max(320).optional().or(z.literal('')),
});
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;

export const pageContentSchema = z.object({
  key: z.string().min(1).max(120),
  title: z.string().max(200).optional().or(z.literal('')),
  body: z.string().max(8000).optional().or(z.literal('')),
});
