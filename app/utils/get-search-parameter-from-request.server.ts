/**
 * Create a URL instance from a Request object.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Request|Request} on MDN.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/URL|Url} on MDN.
 *
 * @param request - A resource request from the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).
 * @returns A URL interface.
 */
export const requestToUrl = (request: Request) => new URL(request.url);

/**
 * Returns the value of a search parameter from a request.
 *
 * @param searchParameter - The search parameter to get the value of.
 * @returns The value of the search parameter.
 */
export function getSearchParameterFromRequest(searchParameter: string) {
  return function getSearchParameter(request: Request) {
    const url = requestToUrl(request);
    const searchParameterValue = url.searchParams.get(searchParameter) ?? '';
    return searchParameterValue;
  };
}
