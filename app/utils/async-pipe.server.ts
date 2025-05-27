/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
// A type that represents either a value or a promise of that value.
type MaybePromise<T> = T | Promise<T>;

// A function type for asynchronous (or synchronous) functions.
export type AsyncFunction<T extends any[] = any[], R = any> = (
  ...arguments_: T
) => MaybePromise<R>;

/**
 * Pipe asynchronous (or synchronous) functions from left to right.
 *
 * If no functions are provided, the resulting function is the identity.
 *
 * Overloads allow the first function to accept multiple arguments.
 */
export function asyncPipe(): <T>(x: T) => Promise<T>;
export function asyncPipe<A extends any[], R>(
  function_: AsyncFunction<A, R>,
): (...arguments_: A) => Promise<R>;
export function asyncPipe<A extends any[], B, R>(
  function1: AsyncFunction<A, B>,
  function2: AsyncFunction<[B], R>,
): (...arguments_: A) => Promise<R>;
export function asyncPipe<A extends any[], B, C, R>(
  function1: AsyncFunction<A, B>,
  function2: AsyncFunction<[B], C>,
  function3: AsyncFunction<[C], R>,
): (...arguments_: A) => Promise<R>;
export function asyncPipe<A extends any[], B, C, D, R>(
  function1: AsyncFunction<A, B>,
  function2: AsyncFunction<[B], C>,
  function3: AsyncFunction<[C], D>,
  function4: AsyncFunction<[D], R>,
): (...arguments_: A) => Promise<R>;

/**
 * Composes multiple asynchronous (or synchronous) functions from left to right
 * into a single function.
 *
 * Each function in the pipeline receives the result of the previous function as
 * its argument.
 *
 * All function results are automatically wrapped in Promises to ensure
 * consistent asynchronous behavior.
 *
 * If no functions are provided, returns an identity function that wraps its
 * argument in a Promise.
 *
 * If a single function is provided, returns that function with its result
 * wrapped in a Promise.
 * For multiple functions, composes them using Promise chaining.
 *
 * @example
 * ```typescript
 * // Basic composition of two async functions
 * const asyncDouble = async (x: number) => x * 2;
 * const asyncInc = async (x: number) => x + 1;
 * const composed = asyncPipe(asyncDouble, asyncInc);
 * await composed(10); // Returns 21 (first doubles 10 to 20, then adds 1)
 *
 * // Composition with type transformations
 * const asyncToString = async (x: number) => x.toString();
 * const asyncShout = async (x: string) => `${x}!`;
 * const complex = asyncPipe(asyncDouble, asyncInc, asyncToString, asyncShout);
 * await complex(10); // Returns "21!"
 * ```
 *
 * @param fns - The functions to compose. Each function should take a single
 * argument (except for the first function which can accept multiple
 * arguments) and return a value or Promise.
 *
 * @returns A new function that:
 * - Accepts the same arguments as the first function in the pipeline
 * - Returns a Promise that resolves to the result of passing the input through
 * all functions in sequence
 * - If no functions are provided, returns a Promise-wrapped identity function
 */
export function asyncPipe(
  ...fns: AsyncFunction[]
): (...arguments_: any[]) => Promise<any> {
  if (fns.length === 0) {
    // No functions: return an identity function that wraps its argument in a Promise.
    return <T>(x: T) => Promise.resolve(x);
  }

  if (fns.length === 1) {
    // Single function: wrap its result in a Promise.
    return (...arguments_: any[]) => Promise.resolve(fns[0](...arguments_));
  }

  return (...arguments_: any[]) => {
    // Call the first function with all provided arguments.
    const [first, ...rest] = fns;
    // Chain the remaining functions using Promise.then
    return rest.reduce(
      (chain, function_) => chain.then(result => function_(result)),
      Promise.resolve(first(...arguments_)),
    );
  };
}
