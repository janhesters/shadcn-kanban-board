import { describe, expect, test } from 'vitest';

import {
  badRequest,
  conflict,
  created,
  forbidden,
  methodNotAllowed,
  notFound,
  tooManyRequests,
  unauthorized,
} from './http-responses.server';

describe('created()', () => {
  test('given: no arguments, should: return a 201 status with a message', () => {
    const response = created();

    expect(response.init?.status).toEqual(201);
    expect(response.data).toEqual({ message: 'Created' });
  });

  test('given: custom data object, should: return a 201 status with the custom data object', () => {
    const customData = { id: '123', name: 'Test Resource' };
    const response = created(customData);

    expect(response.init?.status).toEqual(201);
    expect(response.data).toEqual({ message: 'Created', ...customData });
  });

  test('given: custom data and headers, should: return a 201 status with the custom data and the headers', () => {
    const headers = new Headers({ Location: '/api/resources/123' });
    const customData = { id: '123', name: 'Test Resource' };
    const response = created(customData, { headers });

    expect(response.init?.status).toEqual(201);
    expect(response.data).toEqual({ message: 'Created', ...customData });
    expect((response.init?.headers as Headers).get('Location')).toEqual(
      '/api/resources/123',
    );
  });
});

describe('badRequest()', () => {
  test('given: no arguments, should: return a 400 status with a message', () => {
    const response = badRequest();

    expect(response.init?.status).toEqual(400);
    expect(response.data).toEqual({ message: 'Bad Request' });
  });

  test('given: custom error object, should: return a 400 status with the custom error object', () => {
    const customErrors = { input: 'invalid-input' };
    const response = badRequest(customErrors);

    expect(response.init?.status).toEqual(400);
    expect(response.data).toEqual({ message: 'Bad Request', ...customErrors });
  });

  test('given: custom data and headers, should: return a 400 status with the custom data and the headers', () => {
    const headers = new Headers({ 'X-Custom-Header': 'TestValue' });
    const customErrors = { input: 'invalid-input' };
    const response = badRequest(customErrors, { headers });

    expect(response.init?.status).toEqual(400);
    expect(response.data).toEqual({ message: 'Bad Request', ...customErrors });
    expect((response.init?.headers as Headers).get('X-Custom-Header')).toEqual(
      'TestValue',
    );
  });
});

describe('unauthorized()', () => {
  test('given: no arguments, should: return a 401 status with a message', () => {
    const response = unauthorized();

    expect(response.init?.status).toEqual(401);
    expect(response.data).toEqual({ message: 'Unauthorized' });
  });

  test('given: custom error object, should: return a 401 status with the custom error object', () => {
    const customErrors = { reason: 'invalid-token' };
    const response = unauthorized(customErrors);

    expect(response.init?.status).toEqual(401);
    expect(response.data).toEqual({ message: 'Unauthorized', ...customErrors });
  });

  test('given: custom data and headers, should: return a 401 status with the custom data and the headers', () => {
    const headers = new Headers({ 'WWW-Authenticate': 'Bearer' });
    const customErrors = { reason: 'token-expired' };
    const response = unauthorized(customErrors, { headers });

    expect(response.init?.status).toEqual(401);
    expect(response.data).toEqual({ message: 'Unauthorized', ...customErrors });
    expect((response.init?.headers as Headers).get('WWW-Authenticate')).toEqual(
      'Bearer',
    );
  });
});

describe('forbidden()', () => {
  test('given: no arguments, should: return a 403 status with a message', () => {
    const response = forbidden();

    expect(response.init?.status).toEqual(403);
    expect(response.data).toEqual({ message: 'Forbidden' });
  });

  test('given: custom error object, should: return a 403 status with the custom error object', () => {
    const customErrors = { reason: 'insufficient-permissions' };
    const response = forbidden(customErrors);

    expect(response.init?.status).toEqual(403);
    expect(response.data).toEqual({ message: 'Forbidden', ...customErrors });
  });

  test('given: custom data and headers, should: return a 403 status with the custom data and the headers', () => {
    const headers = new Headers({ 'X-Forbidden-Reason': 'No Access' });
    const customErrors = {
      resource: 'admin-panel',
      detail: 'requires admin role',
    };
    const response = forbidden(customErrors, { headers });

    expect(response.init?.status).toEqual(403);
    expect(response.data).toEqual({ message: 'Forbidden', ...customErrors });
    expect(
      (response.init?.headers as Headers).get('X-Forbidden-Reason'),
    ).toEqual('No Access');
  });
});

describe('methodNotAllowed()', () => {
  test('given: no arguments, should: return a 405 status with a message', () => {
    const response = methodNotAllowed();

    expect(response.init?.status).toEqual(405);
    expect(response.data).toEqual({ message: 'Method Not Allowed' });
  });

  test('given: custom error object, should: return a 405 status with the custom error object', () => {
    const customErrors = { method: 'POST', allowedMethods: 'GET, PUT' };
    const response = methodNotAllowed(customErrors);

    expect(response.init?.status).toEqual(405);
    expect(response.data).toEqual({
      message: 'Method Not Allowed',
      ...customErrors,
    });
  });

  test('given: custom data and headers, should: return a 405 status with the custom data and the headers', () => {
    const headers = new Headers({ Allow: 'GET, PUT' });
    const customErrors = { method: 'POST', detail: 'method not supported' };
    const response = methodNotAllowed(customErrors, { headers });

    expect(response.init?.status).toEqual(405);
    expect(response.data).toEqual({
      message: 'Method Not Allowed',
      ...customErrors,
    });
    expect((response.init?.headers as Headers).get('Allow')).toEqual(
      'GET, PUT',
    );
  });
});

describe('conflict()', () => {
  test('given: no arguments, should: return a 409 status with a message', () => {
    const response = conflict();

    expect(response.init?.status).toEqual(409);
    expect(response.data).toEqual({ message: 'Conflict' });
  });

  test('given: custom error object, should: return a 409 status with the custom error object', () => {
    const customErrors = { resource: 'user', detail: 'already exists' };
    const response = conflict(customErrors);

    expect(response.init?.status).toEqual(409);
    expect(response.data).toEqual({ message: 'Conflict', ...customErrors });
  });

  test('given: custom data and headers, should: return a 409 status with the custom data and the headers', () => {
    const headers = new Headers({ 'X-Conflict-Version': '1.2.3' });
    const customErrors = { resource: 'document', detail: 'version conflict' };
    const response = conflict(customErrors, { headers });

    expect(response.init?.status).toEqual(409);
    expect(response.data).toEqual({ message: 'Conflict', ...customErrors });
    expect(
      (response.init?.headers as Headers).get('X-Conflict-Version'),
    ).toEqual('1.2.3');
  });
});

describe('tooManyRequests()', () => {
  test('given: no arguments, should: return a 429 status with a message', () => {
    const response = tooManyRequests();

    expect(response.init?.status).toEqual(429);
    expect(response.data).toEqual({ message: 'Too Many Requests' });
  });

  test('given: custom error object, should: return a 429 status with the custom error object', () => {
    const customErrors = {
      retryAfter: '60 seconds',
      limit: '100 requests per hour',
    };
    const response = tooManyRequests(customErrors);

    expect(response.init?.status).toEqual(429);
    expect(response.data).toEqual({
      message: 'Too Many Requests',
      ...customErrors,
    });
  });

  test('given: custom data and headers, should: return a 429 status with the custom data and the headers', () => {
    const headers = new Headers({ 'Retry-After': '60' });
    const customErrors = { limit: '100 requests per hour' };
    const response = tooManyRequests(customErrors, { headers });

    expect(response.init?.status).toEqual(429);
    expect(response.data).toEqual({
      message: 'Too Many Requests',
      ...customErrors,
    });
    expect((response.init?.headers as Headers).get('Retry-After')).toEqual(
      '60',
    );
  });
});

describe('notFound()', () => {
  test('given: no arguments, should: return a 404 status with a message', () => {
    const response = notFound();

    expect(response.init?.status).toEqual(404);
    expect(response.data).toEqual({ message: 'Not Found' });
  });

  test('given: custom error object, should: return a 404 status with the custom error object', () => {
    const customErrors = { resource: 'user', detail: 'does not exist' };
    const response = notFound(customErrors);

    expect(response.init?.status).toEqual(404);
    expect(response.data).toEqual({ message: 'Not Found', ...customErrors });
  });

  test('given: custom data and headers, should: return a 404 status with the custom data and the headers', () => {
    const headers = new Headers({ 'X-Resource-Type': 'User' });
    const customErrors = { resource: 'user', id: '123', detail: 'not found' };
    const response = notFound(customErrors, { headers });

    expect(response.init?.status).toEqual(404);
    expect(response.data).toEqual({ message: 'Not Found', ...customErrors });
    expect((response.init?.headers as Headers).get('X-Resource-Type')).toEqual(
      'User',
    );
  });
});
