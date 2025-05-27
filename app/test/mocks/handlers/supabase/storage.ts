import type { RequestHandler } from 'msw';
import { http, HttpResponse } from 'msw';

/*
Storage handlers
*/

const uploadMock = http.post(
  // Use a wildcard for the path
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/:bucketName/*`,
  ({ params, request }) => {
    const bucketName = params.bucketName as string;
    // Note: MSW's path matching might capture the full path after bucketName
    // in the wildcard (*). We might need to extract it if needed, but
    // for the response, constructing it simply might be enough.

    // To get the actual file path intended by the client:
    // The path is the part of the URL *after* the bucket name.
    const url = new URL(request.url);
    const pathSegments = url.pathname
      .split(`/storage/v1/object/${bucketName}/`)[1]
      ?.split('/');
    const filePath = pathSegments?.join('/'); // Reconstruct the path

    if (!filePath) {
      console.error(
        'MSW Error: Could not determine file path from URL:',
        url.pathname,
      );
      return new HttpResponse('Could not determine file path', { status: 400 });
    }

    // Simulate reading the file or form data if needed for validation,
    // but for a basic mock, just return the success response.

    // Match the typical Supabase success response structure more closely
    // The Key usually includes the bucket name and the full path.
    const fullPathKey = `${bucketName}/${filePath}`;

    // Return the expected response format (primarily the Key)
    return HttpResponse.json({ Key: fullPathKey });
  },
);

// Define a minimal FileObject type for the mock response,
// based on what the 'remove' method seems to expect in its success case.
// Adjust this based on the actual structure if needed.
type FileObject = {
  name: string;
  id: string | undefined;
  updated_at: string | undefined;
  created_at: string | undefined;
  last_accessed_at: string | undefined;
  metadata: Record<string, unknown> | undefined;
  // bucket_id?: string; // Optional: might be useful
};

// Define the expected structure of the request body for remove
type RemoveRequestBody = {
  prefixes?: string[];
};

const removeMock = http.delete(
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/:bucketId`,
  async ({ request }) => {
    try {
      // Use the generic type argument for request.json()
      // This tells TS what shape to expect *if* parsing succeeds.
      // The type of requestBody inside this try block will be RemoveRequestBody | null
      const requestBody = (await request.json()) as RemoveRequestBody | null;

      // Check if the body was parsed and has the expected structure
      const prefixes = requestBody?.prefixes; // Safely access prefixes

      if (!prefixes || !Array.isArray(prefixes) || prefixes.length === 0) {
        console.error(
          'MSW Error (remove): Missing, invalid, or empty "prefixes" in request body:',
          requestBody, // Log the actual parsed body for debugging
        );
        return HttpResponse.json(
          {
            statusCode: '400',
            error: 'Bad Request',
            message: 'Missing or invalid prefixes array',
          },
          { status: 400 },
        );
      }

      // --- Uncomment to log the prefixes ---
      // const bucketId = params.bucketId as string;
      // console.log(
      //   `MSW Mock: Simulating removal of paths in bucket ${bucketId}:`,
      //   prefixes,
      // );

      // --- Simulate Specific Error Case (Example) ---
      // if (prefixes.includes('path/that/should/fail.txt')) {
      //   console.warn('MSW Mock (remove): Simulating failure for path/that/should/fail.txt');
      //    return HttpResponse.json(
      //      { statusCode: '500', error: 'Internal Server Error', message: 'Failed to delete file' },
      //      { status: 500 }
      //    );
      // }
      // --- End Error Simulation ---

      // Simulate a successful removal response.
      const deletedFilesData: FileObject[] = prefixes.map(path => ({
        name: path.split('/').pop() ?? path,
        id: undefined,
        updated_at: undefined,
        created_at: undefined,
        last_accessed_at: undefined,
        metadata: undefined,
      }));

      return HttpResponse.json(deletedFilesData);
    } catch (error) {
      // This catch block handles errors during JSON parsing (e.g., empty body, invalid JSON)
      console.error(
        'MSW Error (remove): Could not parse request body as JSON',
        error,
      );
      return HttpResponse.json(
        {
          statusCode: '400',
          error: 'Bad Request',
          message: 'Invalid or empty JSON body',
        },
        { status: 400 },
      );
    }
  },
);

/*
  Server‐side S3 uploads (AWS SDK v3 / @supabase's S3 endpoint)
*/
const s3UploadMock: RequestHandler = http.put(
  // Path‐style S3 endpoint under Supabase:
  //   https://<project>.supabase.co/storage/v1/s3/<bucket>/<key>
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/s3/:bucketName/*`,
  ({ params, request }) => {
    const bucket = params.bucketName as string;
    const url = new URL(request.url);
    // everything after `/storage/v1/s3/<bucket>/`
    const objectKey = url.pathname.split(`/storage/v1/s3/${bucket}/`)[1];
    if (!objectKey) {
      return new HttpResponse('Missing key', { status: 400 });
    }

    // S3's PutObject returns an empty body + an ETag header
    return new HttpResponse(undefined, {
      status: 200,
      headers: { ETag: '"mocked-etag"' },
    });
  },
);

const s3DeleteMock: RequestHandler = http.delete(
  // Matches DELETE on https://<project>/storage/v1/s3/<bucket>/<key>
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/s3/:bucketName/*`,
  () => {
    // You could pull out params.bucketName and the key if you need to assert them
    return new HttpResponse(undefined, { status: 204 });
  },
);

const s3InitMultipartMock: RequestHandler = http.post(
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/s3/:bucketName/*`,
  ({ params, request }) => {
    const uploadId = 'mock-upload-id';
    const url = new URL(request.url);

    // Check if this is an uploads request
    if (url.searchParams.get('uploads') === null) {
      return new HttpResponse('Not an uploads request', { status: 400 });
    }

    if (!params.bucketName || typeof params.bucketName !== 'string') {
      return new HttpResponse('Missing bucket name', { status: 400 });
    }

    const keyPath = url.pathname.split(
      `/storage/v1/s3/${params.bucketName}/`,
    )[1];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<InitiateMultipartUploadResult>
  <Bucket>${params.bucketName}</Bucket>
  <Key>${keyPath}</Key>
  <UploadId>${uploadId}</UploadId>
</InitiateMultipartUploadResult>`;
    return new HttpResponse(xml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    });
  },
);

/*
  Server-side S3 multipart upload: upload part
*/
const s3UploadPartMock: RequestHandler = http.put(
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/s3/:bucketName/*`,
  ({ request }) => {
    const url = new URL(request.url);
    const uploadId = url.searchParams.get('uploadId');
    const partNumber = url.searchParams.get('partNumber');
    if (!uploadId || !partNumber) {
      return new HttpResponse('Missing uploadId or partNumber', {
        status: 400,
      });
    }
    return new HttpResponse(undefined, {
      status: 200,
      headers: { ETag: '"mocked-part-etag"' },
    });
  },
);

/*
  Server-side S3 multipart upload: complete
*/
const s3CompleteMultipartMock: RequestHandler = http.post(
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/s3/:bucketName/*`,
  ({ params, request }) => {
    const url = new URL(request.url);
    const uploadId = url.searchParams.get('uploadId');
    if (!uploadId) {
      return new HttpResponse('Missing uploadId', { status: 400 });
    }

    if (!params.bucketName || typeof params.bucketName !== 'string') {
      return new HttpResponse('Missing bucket name', { status: 400 });
    }

    const keyPath = url.pathname.split(
      `/storage/v1/s3/${params.bucketName}/`,
    )[1];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<CompleteMultipartUploadResult>
  <Location>${request.url.split('?')[0]}</Location>
  <Bucket>${params.bucketName}</Bucket>
  <Key>${keyPath}</Key>
  <ETag>"mocked-complete-etag"</ETag>
</CompleteMultipartUploadResult>`;
    return new HttpResponse(xml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    });
  },
);

export const supabaseStorageHandlers: RequestHandler[] = [
  uploadMock,
  removeMock,
  s3UploadMock,
  s3DeleteMock,
  s3InitMultipartMock,
  s3UploadPartMock,
  s3CompleteMultipartMock,
];
