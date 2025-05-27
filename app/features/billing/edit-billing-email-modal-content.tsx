import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Form, useSubmit } from 'react-router';

import { Button } from '~/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';

import { UPDATE_BILLING_EMAIL_INTENT } from './billing-constants';
import type {
  UpdateBillingEmailErrors,
  UpdateBillingEmailSchema,
} from './billing-schemas';
import { updateBillingEmailSchema } from './billing-schemas';

type EditBillingEmailModalContentProps = {
  billingEmail: string;
  errors?: UpdateBillingEmailErrors;
  isUpdatingBillingEmail?: boolean;
};

export function EditBillingEmailModalContent({
  billingEmail,
  errors,
  isUpdatingBillingEmail = false,
}: EditBillingEmailModalContentProps) {
  const { t } = useTranslation('billing', {
    keyPrefix: 'billing-page.update-billing-email-modal',
  });
  const submit = useSubmit();

  const form = useForm<UpdateBillingEmailSchema>({
    resolver: zodResolver(updateBillingEmailSchema),
    defaultValues: {
      intent: UPDATE_BILLING_EMAIL_INTENT,
      billingEmail,
    },
    errors,
  });

  const handleSubmit = async (values: UpdateBillingEmailSchema) => {
    await submit(values, { method: 'POST' });
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{t('title')}</DialogTitle>

        <DialogDescription>{t('description')}</DialogDescription>
      </DialogHeader>

      <FormProvider {...form}>
        <Form
          className="py-2"
          id="edit-billing-email-form"
          method="POST"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <fieldset disabled={isUpdatingBillingEmail}>
            <FormField
              control={form.control}
              name="billingEmail"
              render={({ field }) => (
                <FormItem className="grid-cols-4 items-center">
                  <FormLabel className="text-right">
                    {t('email-label')}
                  </FormLabel>

                  <FormControl>
                    <Input
                      className="col-span-3"
                      placeholder={t('email-placeholder')}
                      {...field}
                    />
                  </FormControl>

                  <FormMessage className="col-span-4 text-right" />
                </FormItem>
              )}
            />
          </fieldset>
        </Form>
      </FormProvider>

      <DialogFooter>
        <Button
          form="edit-billing-email-form"
          disabled={isUpdatingBillingEmail}
          name="intent"
          type="submit"
          value={UPDATE_BILLING_EMAIL_INTENT}
        >
          {isUpdatingBillingEmail ? (
            <>
              <Loader2Icon className="animate-spin" />
              {t('saving-changes')}
            </>
          ) : (
            t('submit-button')
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
