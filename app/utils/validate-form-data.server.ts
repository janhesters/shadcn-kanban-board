import { parseFormData } from '@mjackson/form-data-parser';
import type { MultipartParserOptions } from '@mjackson/multipart-parser';
import type { ZodError, ZodSchema } from 'zod';

import { badRequest } from './http-responses.server';

type ValidationErrors = Record<string, { message: string }>;

export const processErrors = (error: ZodError): ValidationErrors => {
  const { formErrors, fieldErrors } = error.flatten();

  // Collect only valid error objects.
  const errorObjects: Record<string, { message: string }>[] = [];

  // Add root error only if it exists.
  if (formErrors.length > 0) {
    errorObjects.push({ root: { message: formErrors[0] } });
  }

  // Add field errors only if they exist.
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages?.length) {
      errorObjects.push({ [field]: { message: messages[0] } });
    }
  }

  // Merge all error objects into one.
  return errorObjects.reduce(
    (accumulator, current) => ({ ...accumulator, ...current }),
    {},
  );
};

export async function validateFormData<T>(
  request: Request,
  schema: ZodSchema<T>,
  parserOptions?: MultipartParserOptions,
) {
  const formData = parserOptions
    ? await parseFormData(request, parserOptions)
    : await parseFormData(request);
  const values = Object.fromEntries(formData);
  const result = schema.safeParse(values);

  if (!result.success) {
    const errors = processErrors(result.error);
    throw badRequest({ errors });
  }

  return result.data;
}
