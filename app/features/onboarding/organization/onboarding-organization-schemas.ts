import type { FieldErrors } from 'react-hook-form';
import { z } from 'zod';

import { ONBOARDING_ORGANIZATION_INTENT } from './onboarding-organization-consants';

export const onboardingOrganizationSchema = z.object({
  organizationId: z.string().optional(),
  name: z
    .string({
      invalid_type_error: 'onboarding:organization.name-must-be-string',
    })
    .trim()
    .min(3, 'onboarding:organization.name-min-length')
    .max(255, 'onboarding:organization.name-max-length'),
  intent: z.literal(ONBOARDING_ORGANIZATION_INTENT),
  logo: z
    .string({
      invalid_type_error: 'onboarding:organization.logo-must-be-string',
    })
    .url('onboarding:organization.logo-must-be-url')
    .optional(),
});

export type OnboardingOrganizationSchema = z.infer<
  typeof onboardingOrganizationSchema
>;
export type OnboardingOrganizationErrors =
  FieldErrors<OnboardingOrganizationSchema>;
