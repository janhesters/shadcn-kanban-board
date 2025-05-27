import { useEffect, useState } from 'react';

/**
 * A hook that manages a preview URL for a file input.
 * Creates and revokes object URLs for file previews, with automatic cleanup.
 *
 * @param file - The File object to create a preview URL for, or undefined if no
 * file is selected
 * @param initialUrl - The initial URL to fall back to when no file is selected
 * @returns The current preview URL, either from the file or the initial URL
 */
export function usePreviewUrl(
  file: File | undefined,
  initialUrl: string | undefined,
) {
  const [previewUrl, setPreviewUrl] = useState(initialUrl);

  // Effect to create/revoke Object URL for preview when file changes
  useEffect(() => {
    let objectUrl: string | undefined;

    if (file instanceof File) {
      // Create a temporary URL for the selected file
      objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    } else {
      // If the file is removed or invalid, fall back to the initial URL
      setPreviewUrl(initialUrl);
    }

    // Cleanup function: Revoke the object URL when the component
    // unmounts or when the file changes again to prevent memory leaks
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
    // Re-run effect if file or initialUrl changes
  }, [file, initialUrl]);

  return previewUrl;
}
