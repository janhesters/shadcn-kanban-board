import { S3Client } from '@aws-sdk/client-s3';
import type { Session } from '@supabase/supabase-js';

/**
 * Creates an S3 client with full admin credentials from environment variables.
 * Intended for server-side use only, as it bypasses Row Level Security (RLS).
 *
 * @returns A configured S3Client instance with admin access.
 */
export function createAdminS3Client() {
  return new S3Client({
    forcePathStyle: true,
    region: process.env.STORAGE_REGION,
    endpoint: `${process.env.VITE_SUPABASE_URL}/storage/v1/s3`,
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
    },
  });
}

/**
 * Creates an S3 client scoped to a specific user session token.
 * This client respects Supabase RLS policies and only allows operations
 * permitted to the authenticated user.
 *
 * @param accessToken - A valid Supabase user JWT access token.
 * @returns A configured S3Client instance scoped to the user.
 */
export function createUserS3Client(accessToken: Session['access_token']) {
  return new S3Client({
    forcePathStyle: true,
    region: process.env.STORAGE_REGION,
    endpoint: `${process.env.VITE_SUPABASE_URL}/storage/v1/s3`,
    credentials: {
      accessKeyId: process.env.SUPABASE_PROJECT_ID!, // project ref
      secretAccessKey: process.env.VITE_SUPABASE_ANON_KEY!,
      sessionToken: accessToken,
    },
  });
}
