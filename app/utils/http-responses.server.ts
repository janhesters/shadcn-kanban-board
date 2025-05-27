import { data } from 'react-router';

type NestedJSON = {
  [key: string]: string | NestedJSON;
};

export type DataWithResponseInit<Data> = ReturnType<typeof data<Data>>;

/**
 * Returns a 201 Created response.
 *
 * @returns A response with the 201 status code and a message.
 */
export function created(): DataWithResponseInit<{ message: string }>;
/**
 * Returns a 201 Created response.
 *
 * @param createdData - An object containing the created resource data.
 * @returns A response with the 201 status code and the created resource data.
 */
export function created<T extends NestedJSON>(
  createdData: T,
  init?: Omit<ResponseInit, 'status'>,
): DataWithResponseInit<{ message: string } & T>;
export function created<T extends NestedJSON>(
  createdData?: T,
  init?: Omit<ResponseInit, 'status'>,
): DataWithResponseInit<{ message: string } | ({ message: string } & T)> {
  return createdData
    ? data({ message: 'Created', ...createdData }, { ...init, status: 201 })
    : data({ message: 'Created' }, { status: 201 });
}

/**
 * Returns a 400 Bad Request error.
 *
 * @returns A response with the 400 status code and a message.
 */
export function badRequest(): DataWithResponseInit<{ message: string }>;
/**
 * Returns a 400 Bad Request error.
 *
 * @param errors - An object containing custom error messages.
 * @returns A response with the 400 status code and the error messages.
 */
export function badRequest<T extends NestedJSON>(
  errors: T,
  init?: Omit<ResponseInit, 'status'>,
): DataWithResponseInit<{ message: string } & T>;
export function badRequest<T extends NestedJSON>(
  errors?: T,
  init?: Omit<ResponseInit, 'status'>,
): DataWithResponseInit<{ message: string } | ({ message: string } & T)> {
  return errors
    ? data({ message: 'Bad Request', ...errors }, { ...init, status: 400 })
    : data({ message: 'Bad Request' }, { status: 400 });
}

/**
 * Returns a 401 Unauthorized error.
 *
 * @returns A response with the 401 status code and a message.
 */
export function unauthorized(): DataWithResponseInit<{ message: string }>;
/**
 * Returns a 401 Unauthorized error.
 *
 * @param errors - An object containing custom error messages.
 * @returns A response with the 401 status code and the error messages.
 */
export function unauthorized<T extends NestedJSON>(
  errors: T,
  init?: Omit<ResponseInit, 'status'>,
): DataWithResponseInit<{ message: string } & T>;
export function unauthorized<T extends NestedJSON>(
  errors?: T,
  init?: Omit<ResponseInit, 'status'>,
): DataWithResponseInit<{ message: string } | ({ message: string } & T)> {
  return errors
    ? data({ message: 'Unauthorized', ...errors }, { ...init, status: 401 })
    : data({ message: 'Unauthorized' }, { status: 401 });
}

/**
 * Returns a 403 Forbidden error.
 *
 * @returns A response with the 403 status code and a message.
 */
export function forbidden(): DataWithResponseInit<{ message: string }>;
/**
 * Returns a 403 Forbidden error.
 *
 * @param errors - An object containing custom error messages.
 * @returns A response with the 403 status code and the error messages.
 */
export function forbidden<T extends NestedJSON>(
  errors: T,
  init?: Omit<ResponseInit, 'status'>,
): DataWithResponseInit<{ message: string } & T>;
export function forbidden<T extends NestedJSON>(
  errors?: T,
  init?: Omit<ResponseInit, 'status'>,
): DataWithResponseInit<{ message: string } | ({ message: string } & T)> {
  return errors
    ? data({ message: 'Forbidden', ...errors }, { ...init, status: 403 })
    : data({ message: 'Forbidden' }, { status: 403 });
}

/**
 * Returns a 404 Not Found error.
 *
 * @returns A response with the 404 status code and a message.
 */
export function notFound(): DataWithResponseInit<{ message: string }>;
/**
 * Returns a 404 Not Found error.
 *
 * @param errors - An object containing custom error messages.
 * @returns A response with the 404 status code and the error messages.
 */
export function notFound<T extends NestedJSON>(
  errors: T,
  init?: Omit<ResponseInit, 'status'>,
): DataWithResponseInit<{ message: string } & T>;
export function notFound<T extends NestedJSON>(
  errors?: T,
  init?: Omit<ResponseInit, 'status'>,
): DataWithResponseInit<{ message: string } | ({ message: string } & T)> {
  return errors
    ? data({ message: 'Not Found', ...errors }, { ...init, status: 404 })
    : data({ message: 'Not Found' }, { status: 404 });
}

/**
 * Returns a 405 Method Not Allowed error.
 *
 * @returns A response with the 405 status code and a message.
 */
export function methodNotAllowed(): DataWithResponseInit<{ message: string }>;
/**
 * Returns a 405 Method Not Allowed error.
 *
 * @param errors - An object containing custom error messages.
 * @returns A response with the 405 status code and the error messages.
 */
export function methodNotAllowed<T extends NestedJSON>(
  errors: T,
  init?: Omit<ResponseInit, 'status'>,
): DataWithResponseInit<{ message: string } & T>;
export function methodNotAllowed<T extends NestedJSON>(
  errors?: T,
  init?: Omit<ResponseInit, 'status'>,
): DataWithResponseInit<{ message: string } | ({ message: string } & T)> {
  return errors
    ? data(
        { message: 'Method Not Allowed', ...errors },
        { ...init, status: 405 },
      )
    : data({ message: 'Method Not Allowed' }, { status: 405 });
}

/**
 * Returns a 409 Conflict error.
 *
 * @returns A response with the 409 status code and a message.
 */
export function conflict(): DataWithResponseInit<{ message: string }>;
/**
 * Returns a 409 Conflict error.
 *
 * @param errors - An object containing custom error messages.
 * @returns A response with the 409 status code and the error messages.
 */
export function conflict<T extends NestedJSON>(
  errors: T,
  init?: Omit<ResponseInit, 'status'>,
): DataWithResponseInit<{ message: string } & T>;
export function conflict<T extends NestedJSON>(
  errors?: T,
  init?: Omit<ResponseInit, 'status'>,
): DataWithResponseInit<{ message: string } | ({ message: string } & T)> {
  return errors
    ? data({ message: 'Conflict', ...errors }, { ...init, status: 409 })
    : data({ message: 'Conflict' }, { status: 409 });
}

/**
 * Returns a 429 Too Many Requests error.
 *
 * @returns A response with the 429 status code and a message.
 */
export function tooManyRequests(): DataWithResponseInit<{ message: string }>;
/**
 * Returns a 429 Too Many Requests error.
 *
 * @param errors - An object containing custom error messages.
 * @returns A response with the 429 status code and the error messages.
 */
export function tooManyRequests<T extends NestedJSON>(
  errors: T,
  init?: Omit<ResponseInit, 'status'>,
): DataWithResponseInit<{ message: string } & T>;
export function tooManyRequests<T extends NestedJSON>(
  errors?: T,
  init?: Omit<ResponseInit, 'status'>,
): DataWithResponseInit<{ message: string } | ({ message: string } & T)> {
  return errors
    ? data(
        { message: 'Too Many Requests', ...errors },
        { ...init, status: 429 },
      )
    : data({ message: 'Too Many Requests' }, { status: 429 });
}
