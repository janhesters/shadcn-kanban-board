import type { FieldErrors } from 'react-hook-form';
import { z } from 'zod';

export const contactSalesFormSchema = z.object({
  firstName: z
    .string({
      invalid_type_error: 'billing:contact-sales.first-name-must-be-string',
      required_error: 'billing:contact-sales.first-name-required',
    })
    .min(1, 'billing:contact-sales.first-name-required')
    .max(255, 'billing:contact-sales.first-name-too-long'),
  lastName: z
    .string({
      invalid_type_error: 'billing:contact-sales.last-name-must-be-string',
      required_error: 'billing:contact-sales.last-name-required',
    })
    .min(1, 'billing:contact-sales.last-name-required')
    .max(255, 'billing:contact-sales.last-name-too-long'),
  companyName: z
    .string({
      invalid_type_error: 'billing:contact-sales.company-name-must-be-string',
      required_error: 'billing:contact-sales.company-name-required',
    })
    .min(1, 'billing:contact-sales.company-name-required')
    .max(255, 'billing:contact-sales.company-name-too-long'),
  workEmail: z
    .string({
      invalid_type_error: 'billing:contact-sales.work-email-must-be-string',
      required_error: 'billing:contact-sales.work-email-required',
    })
    .min(1, 'billing:contact-sales.work-email-required')
    .email('billing:contact-sales.work-email-invalid'),
  phoneNumber: z
    .string({
      invalid_type_error: 'billing:contact-sales.phone-number-must-be-string',
      required_error: 'billing:contact-sales.phone-number-required',
    })
    .min(1, 'billing:contact-sales.phone-number-required'),
  message: z
    .string({
      invalid_type_error: 'billing:contact-sales.message-must-be-string',
      required_error: 'billing:contact-sales.message-required',
    })
    .min(1, 'billing:contact-sales.message-required')
    .max(5000, 'billing:contact-sales.message-too-long'),
  intent: z.literal('contactSales'),
});

export type ContactSalesFormSchema = z.infer<typeof contactSalesFormSchema>;
export type ContactSalesFormErrors = FieldErrors<ContactSalesFormSchema>;
