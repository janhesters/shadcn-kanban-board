import { supabaseAdminClient } from '~/features/user-authentication/supabase.server';

/**
 * Extracts the bucket and key from a storage URL.
 *
 * @param url - The storage URL.
 * @returns The bucket and key.
 */
export function getBucketAndKeyFromUrl(url?: string | null) {
  if (!url) {
    return { bucket: undefined, key: undefined };
  }

  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    throw new Error('Invalid URL');
  }

  // Match both object URLs and render/image URLs under public
  const regex =
    /\/storage\/v1\/(?:object|render\/image)\/public\/([^/]+)\/(.+)$/;
  const match = regex.exec(pathname);

  if (!match) {
    console.error('Invalid storage URL format', pathname);
    return { bucket: undefined, key: undefined };
  }

  const bucket = match[1];
  const key = match[2];
  return { bucket, key };
}

/**
 * Removes an image from Supabase Storage.
 * NOTE: This helper function is needed because of the "hybrid" approach
 * of how we handle uploads in this repository. Some are done client-side
 * with the `Dropzone` component, and others are done server-side with
 * the `DragAndDrop` component and `uploadToStorage` function. If you'd only
 * use the latter, you could just use the `deleteFromStorage` function
 * directly.
 *
 * @param imageUrl - The URL of the image to remove.
 */
export async function removeImageFromStorage(imageUrl: string) {
  const { bucket, key } = getBucketAndKeyFromUrl(imageUrl);

  if (!bucket || !key) {
    return;
  }

  await supabaseAdminClient.storage.from(bucket).remove([key]);
}
