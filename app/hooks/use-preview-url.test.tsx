import { renderHook } from '@testing-library/react';
// Make sure to import afterEach if you use it, though clearAllMocks in beforeEach is often sufficient
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { usePreviewUrl } from './use-preview-url';

type PreviewUrlProps = {
  file: File | undefined;
  initialUrl: string | undefined;
};

const renderPreviewUrlHook = (props: PreviewUrlProps) => {
  return renderHook(
    (hookProps: PreviewUrlProps) =>
      usePreviewUrl(hookProps.file, hookProps.initialUrl),
    { initialProps: props },
  );
};

describe('usePreviewUrl Hook', () => {
  let urlCounter = 0;
  const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');
  const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

  beforeEach(() => {
    vi.clearAllMocks();
    urlCounter = 0;
    createObjectURLSpy.mockImplementation(() => {
      urlCounter++;
      return `blob:test-url-${urlCounter}`; // Return unique URLs
    });
  });

  test('given: no file and no initial URL, should: return undefined', () => {
    const { result } = renderPreviewUrlHook({
      file: undefined,
      initialUrl: undefined,
    });

    expect(result.current).toBeUndefined();
    expect(createObjectURLSpy).not.toHaveBeenCalled();
  });

  test('given: no file but initial URL provided, should: return initial URL', () => {
    const initialUrl = 'https://example.com/image.jpg';
    const { result } = renderPreviewUrlHook({
      file: undefined,
      initialUrl,
    });

    expect(result.current).toEqual(initialUrl);
    expect(createObjectURLSpy).not.toHaveBeenCalled();
  });

  test('given: file provided, should: create and return object URL', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const { result } = renderPreviewUrlHook({
      file,
      initialUrl: undefined,
    });

    const expectedUrl = 'blob:test-url-1';
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(createObjectURLSpy).toHaveBeenCalledWith(file);
    expect(result.current).toEqual(expectedUrl);
    expect(revokeObjectURLSpy).not.toHaveBeenCalled();
  });

  test('given: file changes, should: revoke old URL and create new one', () => {
    const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });

    const { result, rerender } = renderPreviewUrlHook({
      file: file1,
      initialUrl: undefined,
    });

    const initialMockUrl = 'blob:test-url-1';
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(createObjectURLSpy).toHaveBeenCalledWith(file1);
    expect(result.current).toEqual(initialMockUrl);
    expect(revokeObjectURLSpy).not.toHaveBeenCalled();

    // --- Rerender with new file ---
    rerender({ file: file2, initialUrl: undefined });

    // 1. Check revocation of the *old* URL
    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith(initialMockUrl);

    // 2. Check creation of the *new* URL
    const newMockUrl = 'blob:test-url-2';
    expect(createObjectURLSpy).toHaveBeenCalledTimes(2);
    expect(createObjectURLSpy).toHaveBeenCalledWith(file2);

    // 3. Check the current URL is the new one
    expect(result.current).toEqual(newMockUrl);
  });

  test('given: component unmounts, should: revoke object URL', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const { unmount, result } = renderPreviewUrlHook({
      file,
      initialUrl: undefined,
    });

    const initialMockUrl = 'blob:test-url-1';
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(createObjectURLSpy).toHaveBeenCalledWith(file);
    expect(result.current).toEqual(initialMockUrl);
    expect(revokeObjectURLSpy).not.toHaveBeenCalled();

    // --- Unmount ---
    unmount();

    // Check revocation happened on unmount
    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith(initialMockUrl);
  });

  test('given: file is removed, should: revoke URL and return to initial URL', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const initialUrl = 'https://example.com/image.jpg';

    const { result, rerender } = renderPreviewUrlHook({
      file,
      initialUrl,
    });

    const initialMockUrl = 'blob:test-url-1';
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(createObjectURLSpy).toHaveBeenCalledWith(file);
    expect(result.current).toEqual(initialMockUrl);
    expect(revokeObjectURLSpy).not.toHaveBeenCalled();

    // --- Rerender with file removed ---
    rerender({ file: undefined, initialUrl });

    // 1. Check revocation of the *old* URL
    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith(initialMockUrl);

    // 2. Check createObjectURL was *not* called again
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);

    // 3. Check the current URL is the initial fallback URL
    expect(result.current).toEqual(initialUrl);
  });
});
