import type { FieldErrors, FieldValues } from 'react-hook-form';

type ExtractErrors<Type> = Type extends { errors: FieldErrors<FieldValues> }
  ? Type['errors']
  : never;

/**
 * Helper function to safely extract form errors from action data.
 * @template ActionData The type of the action data.
 * @template FormErrors The type of the form errors, defaults to the errors type
 * from ActionData.
 * @param data The action data to check for errors.
 * @returns The form errors if they exist, undefined otherwise.
 *
 * @example
 * // With type inference
 * type LoginActionData = { errors: { email: string[] } } | Response | undefined;
 * const errors = getFormErrors<LoginActionData>(actionData);
 * // errors is inferred as { email: string[] } | undefined
 *
 * @example
 * // With explicit error type
 * type EmailErrors = { email: string[] };
 * const errors = getFormErrors<LoginActionData, EmailErrors>(actionData);
 * // errors is explicitly typed as EmailErrors | undefined
 */
export function getFormErrors<
  ActionData extends object | undefined,
  FormErrors extends FieldErrors<FieldValues> = ExtractErrors<ActionData>,
>(data: ActionData): FormErrors | undefined {
  if (!data || data instanceof Response || typeof data !== 'object') {
    return undefined;
  }

  return 'errors' in data ? (data.errors as FormErrors) : undefined;
}
