import { useEffect } from 'react';
import { toast as showToast } from 'sonner';

import type { Toast } from '~/utils/toast.server';

/**
 * Custom hook for displaying a toast notification.
 * If a `toast` object is provided, it triggers a toast notification with the
 * specified type, title, and description after a brief delay. The toast is
 * displayed using the `showToast` function, which is based on the `toast.type`.
 *
 * @param toast - Optional. The toast object containing the type, title, and
 * description of the notification. If null or undefined, no toast is shown.
 */
export function useToast(toast?: Toast | null) {
  useEffect(() => {
    if (toast) {
      setTimeout(() => {
        showToast[toast.type](toast.title, {
          id: toast.id,
          description: toast.description,
        });
      }, 0);
    }
  }, [toast]);
}
