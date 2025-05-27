import type { FieldErrors } from 'react-hook-form';
import { z } from 'zod';

import { registerIntents } from './registration-constants';

export const registerWithEmailSchema = z.object({
  intent: z.literal(registerIntents.registerWithEmail),
  email: z
    .string({
      invalid_type_error: 'user-authentication:common.email-must-be-string',
    })
    .min(1, 'user-authentication:common.email-required')
    .email('user-authentication:common.email-invalid'),
});

export type RegisterWithEmailSchema = z.infer<typeof registerWithEmailSchema>;
export type EmailRegistrationErrors = FieldErrors<RegisterWithEmailSchema>;

export const registerWithGoogleSchema = z.object({
  intent: z.literal(registerIntents.registerWithGoogle),
});

export type RegisterWithGoogleSchema = z.infer<typeof registerWithGoogleSchema>;
