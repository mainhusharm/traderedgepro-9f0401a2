// Form Validation Utilities
// Centralized validation schemas and helpers

import { z } from 'zod';

// Common validation patterns
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[\d\s-]{10,}$/;

// Auth schemas
export const loginSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export const signupSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
  firstName: z.string()
    .trim()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .optional(),
  lastName: z.string()
    .trim()
    .max(50, 'Last name must be less than 50 characters')
    .optional(),
  agreeToTerms: z.boolean()
    .refine(val => val === true, 'You must agree to the terms'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Profile schemas
export const profileSchema = z.object({
  firstName: z.string()
    .trim()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z.string()
    .trim()
    .max(50, 'Last name must be less than 50 characters')
    .optional(),
  phone: z.string()
    .trim()
    .regex(phonePattern, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  country: z.string()
    .max(100, 'Country must be less than 100 characters')
    .optional(),
  company: z.string()
    .max(100, 'Company must be less than 100 characters')
    .optional(),
});

// Trading schemas
export const signalSchema = z.object({
  symbol: z.string()
    .trim()
    .min(1, 'Symbol is required')
    .max(20, 'Symbol must be less than 20 characters')
    .transform(val => val.toUpperCase()),
  direction: z.enum(['BUY', 'SELL'], {
    required_error: 'Direction is required',
  }),
  entryPrice: z.number()
    .positive('Entry price must be positive')
    .or(z.string().transform(val => parseFloat(val))),
  stopLoss: z.number()
    .positive('Stop loss must be positive')
    .optional()
    .or(z.string().transform(val => val ? parseFloat(val) : undefined)),
  takeProfit: z.number()
    .positive('Take profit must be positive')
    .optional()
    .or(z.string().transform(val => val ? parseFloat(val) : undefined)),
  confidence: z.number()
    .min(0, 'Confidence must be at least 0')
    .max(100, 'Confidence must be at most 100')
    .default(75),
  analysis: z.string()
    .max(2000, 'Analysis must be less than 2000 characters')
    .optional(),
});

export const journalEntrySchema = z.object({
  date: z.string()
    .min(1, 'Date is required'),
  symbol: z.string()
    .trim()
    .min(1, 'Symbol is required')
    .max(20, 'Symbol must be less than 20 characters')
    .transform(val => val.toUpperCase()),
  direction: z.enum(['BUY', 'SELL']),
  entryPrice: z.number()
    .positive('Entry price must be positive'),
  exitPrice: z.number()
    .positive('Exit price must be positive')
    .optional(),
  stopLoss: z.number()
    .positive('Stop loss must be positive')
    .optional(),
  takeProfit: z.number()
    .positive('Take profit must be positive')
    .optional(),
  lotSize: z.number()
    .positive('Lot size must be positive')
    .max(100, 'Lot size cannot exceed 100')
    .optional(),
  pnl: z.number()
    .optional(),
  notes: z.string()
    .max(5000, 'Notes must be less than 5000 characters')
    .optional(),
  tags: z.array(z.string().max(50))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
});

// Questionnaire schema
export const questionnaireSchema = z.object({
  propFirm: z.string()
    .min(1, 'Prop firm is required'),
  accountType: z.enum(['evaluation', 'funded', 'personal']),
  accountSize: z.number()
    .positive('Account size must be positive')
    .min(1000, 'Minimum account size is $1,000')
    .max(10000000, 'Maximum account size is $10,000,000'),
  riskPercentage: z.number()
    .min(0.1, 'Minimum risk is 0.1%')
    .max(10, 'Maximum risk is 10%'),
  riskRewardRatio: z.string()
    .regex(/^\d+:\d+$/, 'Invalid risk:reward format (e.g., 1:2)'),
  tradingExperience: z.enum(['beginner', 'intermediate', 'advanced', 'professional']),
  tradingSession: z.enum(['any', 'london', 'newyork', 'tokyo', 'sydney']),
});

// Support ticket schema
export const supportTicketSchema = z.object({
  subject: z.string()
    .trim()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters'),
  category: z.enum(['general', 'technical', 'billing', 'signals', 'account']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  description: z.string()
    .trim()
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description must be less than 5000 characters'),
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type SignalFormData = z.infer<typeof signalSchema>;
export type JournalEntryFormData = z.infer<typeof journalEntrySchema>;
export type QuestionnaireFormData = z.infer<typeof questionnaireSchema>;
export type SupportTicketFormData = z.infer<typeof supportTicketSchema>;
