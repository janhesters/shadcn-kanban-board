/* eslint-disable unicorn/no-null */
import type { ActionFunction } from 'react-router';
import { createCookie, data } from 'react-router';
import { createTypedCookie } from 'remix-utils/typed-cookie';
import { z } from 'zod';

import type { ColorScheme } from './color-scheme-constants';
import { COLOR_SCHEME_FORM_KEY, colorSchemes } from './color-scheme-constants';

const cookie = createCookie('color-scheme', {
  path: '/',
  sameSite: 'lax',
  httpOnly: true,
  secrets: [process.env.COOKIE_SECRET ?? 'secret'],
});

const schema = z
  .enum([colorSchemes.dark, colorSchemes.light, colorSchemes.system]) // Possible color schemes
  .default(colorSchemes.system) // If there's no cookie, default to "system"
  // eslint-disable-next-line unicorn/prefer-top-level-await
  .catch(colorSchemes.system); // In case of an error, default to "system"

const typedCookie = createTypedCookie({ cookie, schema });

export async function getColorScheme(request: Request): Promise<ColorScheme> {
  const colorScheme = await typedCookie.parse(request.headers.get('Cookie'));
  return colorScheme ?? colorSchemes.system; // Default to "system" if no cookie is found
}

export async function setColorScheme(colorScheme: ColorScheme) {
  return await typedCookie.serialize(colorScheme);
}

/**
 * Action handler for updating the user's color scheme preference.
 * Validates the color scheme from form data and sets it in a cookie.
 *
 * @param param0 - The action parameters containing the request
 * @returns A redirect response with the updated color scheme cookie
 * @throws {Response} 400 Bad Request if the color scheme is invalid
 */
export const colorSchemeAction: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const colorScheme = schema.parse(formData.get(COLOR_SCHEME_FORM_KEY));
  return data(null, {
    headers: { 'Set-Cookie': await setColorScheme(colorScheme) },
  });
};
