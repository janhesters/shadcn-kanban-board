import { z } from 'zod';

import { CREATE_ORGANIZATION_INTENT } from './create-organization-constants';

export const createOrganizationFormSchema = z.object({
  intent: z.literal(CREATE_ORGANIZATION_INTENT),
  logo: z
    .string({
      invalid_type_error: 'organizations:new.form.logo-must-be-string',
    })
    .url('organizations:new.form.logo-must-be-url')
    .optional(),
  name: z
    .string({
      invalid_type_error: 'organizations:new.form.name-must-be-string',
    })
    .trim()
    .min(3, 'organizations:new.form.name-min-length')
    .max(255, 'organizations:new.form.name-max-length'),
  organizationId: z.string().optional(),
});

export type CreateOrganizationFormSchema = z.infer<
  typeof createOrganizationFormSchema
>;
