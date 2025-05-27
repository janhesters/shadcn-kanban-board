// storage.server.ts
import type { Readable } from 'node:stream';

import type { S3Client } from '@aws-sdk/client-s3';
import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import type { FileUpload } from '@mjackson/form-data-parser';

/**
 * Downloads a file from Supabase Storage using the S3 compatible API.
 *
 * @param bucket - The name of the bucket to download from.
 * @param client - The S3 client to use.
 * @param key - The key of the file to download.
 * @returns The file as a Readable stream.
 */
export async function downloadFromStorage({
  bucket,
  client,
  key,
}: {
  bucket: string;
  client: S3Client;
  key: string;
}) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await client.send(command);
  return response.Body;
}

/**
 * Our “uploadable” body types, matching
 * what @aws-sdk/client-s3 actually accepts.
 */
export type Uploadable =
  | File
  | FileUpload
  | Buffer
  | Uint8Array
  | Readable
  | ReadableStream<Uint8Array>;

/**
 * Type‐guard to detect your FileUpload objects.
 */
function isFileUpload(file: Uploadable): file is FileUpload {
  return typeof (file as FileUpload).stream === 'function';
}

/**
 * Uploads a file to Supabase Storage using the S3 compatible API.
 * Uses the multipart Upload helper to avoid upstream stream hashing issues.
 *
 * @param bucket - The name of the bucket to upload to.
 * @param client - The S3 client to use.
 * @param contentType - The content type of the file.
 * @param file - The file to upload.
 * @param key - The key of the file to upload.
 * @returns The key of the uploaded file.
 */
export async function uploadToStorage({
  bucket,
  client,
  contentType,
  file,
  key,
}: {
  bucket: string;
  client: S3Client;
  contentType: string;
  file: Uploadable;
  key: string;
}) {
  // Normalize custom FileUpload -> Readable; everything else we pass straight through
  const body = isFileUpload(file) ? file.stream() : file;

  // Use multipart upload helper to avoid stream hashing errors
  const uploader = new Upload({
    client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    },
  });

  await uploader.done();
  return key;
}

/**
 * Deletes a file from Supabase Storage using the S3 compatible API.
 *
 * @param bucket - The name of the bucket to delete from.
 * @param client - The S3 client to use.
 * @param key - The key of the file to delete.
 */
export async function deleteFromStorage({
  bucket,
  client,
  key,
}: {
  bucket: string;
  client: S3Client;
  key: string;
}) {
  const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
  await client.send(command);
}
