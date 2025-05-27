/**
 * Combines multiple Headers objects into a single Headers instance.
 * Iterates through each provided Headers object, appending their key-value
 * pairs to a new Headers instance. Null or undefined Headers objects are
 * ignored. This function is useful for merging headers from different sources.
 *
 * @param headers - An array of Headers objects, which can include null or
 * undefined values.
 * @returns - A new Headers instance containing all key-value pairs from the
 * input headers.
 */
export function combineHeaders(
  ...headers: (ResponseInit['headers'] | null | undefined)[]
) {
  const combined = new Headers();

  for (const header of headers) {
    if (!header) continue;

    for (const [key, value] of new Headers(header).entries()) {
      combined.append(key, value);
    }
  }

  return combined;
}
