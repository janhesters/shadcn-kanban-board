import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Form, useSubmit } from 'react-router';
import { z } from 'zod';

import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormProvider,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';

import { DELETE_ORGANIZATION_INTENT } from './general-settings-constants';
import { deleteOrganizationFormSchema } from './general-settings-schemas';

export type DangerZoneProps = {
  isDeletingOrganization?: boolean;
  isSubmitting?: boolean;
  organizationName: string;
};

export function DangerZone({
  isDeletingOrganization = false,
  isSubmitting = false,
  organizationName,
}: DangerZoneProps) {
  const { t } = useTranslation('organizations', {
    keyPrefix: 'settings.general.danger-zone',
  });
  const submit = useSubmit();

  const localDeleteOrganizationFormSchema = useMemo(
    () =>
      z
        .object({
          confirmation: z.string().min(1),
        })
        .merge(deleteOrganizationFormSchema)
        .refine(data => data.confirmation === organizationName, {
          message: t('dialog-confirmation-mismatch'),
          path: ['confirmation'],
        }),
    [organizationName, t],
  );

  type LocalDeleteSchema = z.infer<typeof localDeleteOrganizationFormSchema>;

  const form = useForm<LocalDeleteSchema>({
    resolver: zodResolver(localDeleteOrganizationFormSchema),
    defaultValues: {
      intent: DELETE_ORGANIZATION_INTENT,
      confirmation: '',
    },
    // Validate on change to enable/disable button dynamically.
    mode: 'onChange',
  });

  const handleSubmit = async (values: LocalDeleteSchema) => {
    await submit(values, { method: 'POST', replace: true });
  };

  return (
    <div className="flex flex-col gap-y-4">
      <h2 className="text-destructive leading-none font-semibold">
        {t('title')}
      </h2>

      <div className="border-destructive rounded-xl border px-4 py-2">
        <div className="flex flex-col justify-between gap-y-2 md:flex-row md:items-center">
          <div className="space-y-1">
            <div className="text-foreground font-medium">
              {t('delete-title')}
            </div>

            <p className="text-muted-foreground text-sm">
              {t('delete-description')}
            </p>
          </div>

          <Dialog
            // Reset form when dialog is closed
            onOpenChange={isOpen => {
              if (!isOpen) {
                form.reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="destructive">{t('delete-button')}</Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('dialog-title')}</DialogTitle>
                <DialogDescription>{t('dialog-description')}</DialogDescription>
              </DialogHeader>

              <FormProvider {...form}>
                <Form
                  id="delete-organization-form"
                  method="POST"
                  onSubmit={form.handleSubmit(handleSubmit)}
                  replace
                >
                  <fieldset className="w-full" disabled={isSubmitting}>
                    <FormField
                      control={form.control}
                      name="confirmation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('dialog-confirmation-label', {
                              organizationName: organizationName,
                            })}
                          </FormLabel>

                          <FormControl>
                            <Input
                              placeholder={t('dialog-confirmation-placeholder')}
                              required
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </fieldset>
                </Form>
              </FormProvider>

              <DialogFooter className="sm:justify-end">
                <DialogClose asChild>
                  <Button
                    className="mt-2 sm:mt-0"
                    disabled={isSubmitting}
                    type="button"
                    variant="secondary"
                  >
                    {t('cancel')}
                  </Button>
                </DialogClose>

                <Button
                  disabled={isSubmitting || !form.formState.isValid}
                  form="delete-organization-form"
                  name="intent"
                  type="submit"
                  value={DELETE_ORGANIZATION_INTENT}
                  variant="destructive"
                >
                  {isDeletingOrganization ? (
                    <>
                      <Loader2Icon className="animate-spin" />
                      {t('deleting')}
                    </>
                  ) : (
                    <>{t('delete-this-organization')}</>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
