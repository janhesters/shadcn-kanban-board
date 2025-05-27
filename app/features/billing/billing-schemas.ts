import type { FieldErrors } from 'react-hook-form';
import { z } from 'zod';

import {
  CANCEL_SUBSCRIPTION_INTENT,
  KEEP_CURRENT_SUBSCRIPTION_INTENT,
  OPEN_CHECKOUT_SESSION_INTENT,
  RESUME_SUBSCRIPTION_INTENT,
  SWITCH_SUBSCRIPTION_INTENT,
  UPDATE_BILLING_EMAIL_INTENT,
  VIEW_INVOICES_INTENT,
} from './billing-constants';

export const cancelSubscriptionSchema = z.object({
  intent: z.literal(CANCEL_SUBSCRIPTION_INTENT),
});

export const openCustomerCheckoutSessionSchema = z.object({
  intent: z.literal(OPEN_CHECKOUT_SESSION_INTENT),
  lookupKey: z.string(),
});

export const keepCurrentSubscriptionSchema = z.object({
  intent: z.literal(KEEP_CURRENT_SUBSCRIPTION_INTENT),
});

export const resumeSubscriptionSchema = z.object({
  intent: z.literal(RESUME_SUBSCRIPTION_INTENT),
});

export const switchSubscriptionSchema = z.object({
  intent: z.literal(SWITCH_SUBSCRIPTION_INTENT),
  lookupKey: z.string(),
});

export const updateBillingEmailSchema = z.object({
  intent: z.literal(UPDATE_BILLING_EMAIL_INTENT),
  billingEmail: z
    .string({
      invalid_type_error:
        'billing:billing-page.update-billing-email-modal.email-must-be-string',
    })
    .min(1, 'billing:billing-page.update-billing-email-modal.email-required')
    .email('billing:billing-page.update-billing-email-modal.email-invalid'),
});

export const viewInvoicesSchema = z.object({
  intent: z.literal(VIEW_INVOICES_INTENT),
});

export type UpdateBillingEmailSchema = z.infer<typeof updateBillingEmailSchema>;
export type UpdateBillingEmailErrors = FieldErrors<UpdateBillingEmailSchema>;
