// Coupon Service
// Handles discount code validation and application using database

import { supabase } from '@/integrations/supabase/client';

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  is_private: boolean;
  valid_from: string;
  valid_until: string | null;
  is_trial_coupon?: boolean;
  trial_duration_hours?: number;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  error?: string;
  discount?: number;
  finalPrice?: number;
  isTrialCoupon?: boolean;
  trialDurationHours?: number;
}

export const validateCoupon = async (
  code: string,
  originalPrice: number,
  planName?: string
): Promise<CouponValidationResult> => {
  const normalizedCode = code.trim().toUpperCase();

  try {
    // Query coupon from database (include private coupons by code)
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', normalizedCode)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching coupon:', error);
      return { valid: false, error: 'Error validating coupon' };
    }

    if (!coupon) {
      return { valid: false, error: 'Invalid coupon code' };
    }

    // Check validity period
    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return { valid: false, error: 'Coupon is not yet active' };
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return { valid: false, error: 'Coupon has expired' };
    }

    // Check usage limit
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return { valid: false, error: 'Coupon usage limit reached' };
    }

    // Check minimum purchase (skip for trial coupons)
    const couponData = coupon as any;
    if (!couponData.is_trial_coupon && coupon.min_purchase && originalPrice < coupon.min_purchase) {
      return { 
        valid: false, 
        error: `Minimum purchase of $${coupon.min_purchase} required` 
      };
    }

    // Calculate discount
    let discount: number;
    if (coupon.discount_type === 'percentage') {
      discount = originalPrice * (coupon.discount_value / 100);
    } else {
      discount = coupon.discount_value;
    }

    // Ensure discount doesn't exceed original price
    discount = Math.min(discount, originalPrice);

    const finalPrice = Math.max(0, originalPrice - discount);

    return {
      valid: true,
      coupon: coupon as Coupon,
      discount,
      finalPrice,
      isTrialCoupon: couponData.is_trial_coupon || false,
      trialDurationHours: couponData.trial_duration_hours || 24,
    };
  } catch (err) {
    console.error('Coupon validation error:', err);
    return { valid: false, error: 'Error validating coupon' };
  }
};

export const incrementCouponUsage = async (couponId: string): Promise<void> => {
  try {
    // Fetch current usage and increment
    const { data: coupon } = await supabase
      .from('coupons')
      .select('current_uses')
      .eq('id', couponId)
      .single();

    if (coupon) {
      await supabase
        .from('coupons')
        .update({ current_uses: (coupon.current_uses || 0) + 1 })
        .eq('id', couponId);
    }
  } catch (err) {
    console.error('Error incrementing coupon usage:', err);
  }
};

export const formatDiscount = (coupon: Coupon): string => {
  if (coupon.is_trial_coupon) {
    return `${coupon.trial_duration_hours || 24}-hour free trial`;
  }
  if (coupon.discount_type === 'percentage') {
    return `${coupon.discount_value}% off`;
  }
  return `$${coupon.discount_value} off`;
};

export const getCouponDescription = (coupon: Coupon): string => {
  if (coupon.is_trial_coupon) {
    return `${coupon.trial_duration_hours || 24}-hour free trial with full access`;
  }
  
  let desc = formatDiscount(coupon);

  if (coupon.min_purchase && coupon.min_purchase > 0) {
    desc += ` (min. $${coupon.min_purchase})`;
  }

  return desc;
};

export const isTrialCoupon = async (code: string): Promise<boolean> => {
  const { data } = await (supabase
    .from('coupons' as any)
    .select('is_trial_coupon')
    .eq('code', code.trim().toUpperCase())
    .eq('is_active', true)
    .maybeSingle() as any);
  
  return (data as any)?.is_trial_coupon || false;
};
