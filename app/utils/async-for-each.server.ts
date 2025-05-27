/**
 * Iterates over an array asynchronously and executes a callback for each item.
 *
 * @param array - The array to iterate over.
 * @param callback - The promise callback to execute for each element.
 *
 * @example
 * ```ts
 * const waitFor = ms => new Promise(r => setTimeout(r, ms));
 *
 * const start = async () => {
 *   await asyncForEach([1, 2, 3], async num => {
 *     await waitFor(3000);
 *     console.log(num);
 *   });
 *   console.log('Done');
 * };
 *
 * start();
 * ```
 */
export async function asyncForEach<T>(
  array: T[],
  callback: (item: T, index: number, array: T[]) => Promise<void>,
) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
