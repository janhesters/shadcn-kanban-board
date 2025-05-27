import { notFound } from './http-responses.server';

/**
 * Ensures that something exists.
 *
 * @param entity - The entity to check - possibly null or undefined.
 * @returns The same entity if it exists.
 * @throws A '404 not found' HTTP response if the entity is missing.
 */
export function throwIfEntityIsMissing<EntityType>(
  entity: EntityType | null | undefined,
) {
  if (!entity) {
    throw notFound();
  }

  return entity;
}
