import { zodResolver } from '@hookform/resolvers/zod';
import type { Organization } from '@prisma/client';
import { Loader2Icon } from 'lucide-react';
import type { FieldErrors } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { Form, useSubmit } from 'react-router';
import type { z } from 'zod';

import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from '~/components/dropzone';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { useSupabaseUpload } from '~/hooks/use-supabase-upload';
import { toFormData } from '~/utils/to-form-data';

import { BUCKET_NAME, LOGO_PATH_PREFIX } from '../../organization-constants';
import { UPDATE_ORGANIZATION_INTENT } from './general-settings-constants';
import type { UpdateOrganizationFormSchema } from './general-settings-schemas';
import { updateOrganizationFormSchema } from './general-settings-schemas';

export type UpdateOrganizationFormErrors =
  FieldErrors<UpdateOrganizationFormSchema>;

export type GeneralOrganizationSettingsProps = {
  errors?: UpdateOrganizationFormErrors;
  isUpdatingOrganization?: boolean;
  organization: Pick<Organization, 'name' | 'imageUrl' | 'id'>;
};

export const getStoragePathFromUrl = (
  imageUrl: string | null | undefined,
): string => {
  if (!imageUrl) return '';
  try {
    const url = new URL(imageUrl);
    // Example URL: https://<project-ref>.supabase.co/storage/v1/object/public/app-images/organization-logos/org_id/logo.png
    // We need the part after the bucket name: "organization-logos/org_id/logo.png"
    const pathSegments = url.pathname.split('/');
    const bucketIndex = pathSegments.indexOf(BUCKET_NAME);
    if (bucketIndex === -1 || bucketIndex + 1 >= pathSegments.length) {
      console.warn('Could not extract storage path from URL:', imageUrl);
      return '';
    }
    return pathSegments.slice(bucketIndex + 1).join('/');
  } catch (error) {
    console.error('Error parsing image URL:', error);
    return '';
  }
};

export function GeneralOrganizationSettings({
  errors,
  isUpdatingOrganization = false,
  organization,
}: GeneralOrganizationSettingsProps) {
  const { t } = useTranslation('organizations', {
    keyPrefix: 'settings.general.form',
  });
  const submit = useSubmit();

  // Construct the specific path for this organization's logos
  const organizationLogoPath = `${LOGO_PATH_PREFIX}/${organization.id}`;

  const uploadHandler = useSupabaseUpload({
    bucketName: BUCKET_NAME,
    path: organizationLogoPath, // Use the constructed path
    maxFiles: 1,
    maxFileSize: 1000 * 1000, // 1MB
    allowedMimeTypes: ['image/*'],
    upsert: true,
  });

  const form = useForm<UpdateOrganizationFormSchema>({
    resolver: zodResolver(updateOrganizationFormSchema),
    defaultValues: {
      intent: UPDATE_ORGANIZATION_INTENT,
      name: organization.name,
      logo: undefined,
    },
    errors,
  });

  const handleSubmit = async (
    values: z.infer<typeof updateOrganizationFormSchema>,
  ) => {
    if (uploadHandler.files.length > 0) {
      const newFile = uploadHandler.files[0];

      try {
        // --- 1. Upload the new logo ---
        // The useSupabaseUpload hook sets its own loading state,
        // but isUpdatingOrganization likely controls the button state externally.
        const isUploadSuccess = await uploadHandler.onUpload();

        if (isUploadSuccess) {
          // --- 2. Get the public URL of the newly uploaded file ---
          const newFilePath = `${organizationLogoPath}/${newFile.name}`;
          const { data: publicUrlData } = uploadHandler.supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(newFilePath);

          const newPublicUrl = publicUrlData.publicUrl;

          // --- 3. Delete the old logo (if it exists) ---
          const oldStoragePath = getStoragePathFromUrl(organization.imageUrl);

          if (oldStoragePath && oldStoragePath !== newFilePath) {
            const { error: deleteError } = await uploadHandler.supabase.storage
              .from(BUCKET_NAME)
              .remove([oldStoragePath]);

            if (deleteError) {
              form.setError('logo', {
                message: t('errors.delete-old-logo-failed'),
              });
            }
          } else if (oldStoragePath === newFilePath) {
            //New logo path is the same as the old one. Skipping deletion.
          }

          // --- 4. Submit the form with the NEW logo URL ---
          await submit(toFormData({ ...values, logo: newPublicUrl }), {
            method: 'POST',
            replace: true,
          });
        } else {
          // Upload failed (hook's onUpload returned false)
          form.setError('logo', {
            message: t('errors.upload-failed'),
          });
        }
      } catch {
        // Catch unexpected errors during the process (e.g., network issues)
        form.setError('logo', {
          message: t('errors.unexpected-error'),
        });
      }
    } else {
      await submit(toFormData(values), { method: 'POST', replace: true });
    }
  };

  const isFormDisabled = isUpdatingOrganization || uploadHandler.loading;

  return (
    <FormProvider {...form}>
      <Form
        id="update-organization-form"
        method="POST"
        onSubmit={form.handleSubmit(handleSubmit)}
        replace
      >
        <fieldset
          className="flex flex-col gap-y-6 sm:gap-y-8"
          disabled={isFormDisabled}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="grid gap-x-8 sm:grid-cols-2">
                <div className="space-y-1">
                  <FormLabel>{t('name-label')}</FormLabel>

                  <FormDescription>
                    <Trans
                      i18nKey="organizations:settings.general.form.name-description"
                      components={{
                        1: <span className="font-bold">Warning:</span>,
                      }}
                    />
                  </FormDescription>
                </div>

                <div className="grid gap-2">
                  <FormControl>
                    <Input
                      autoComplete="organization"
                      placeholder={t('name-placeholder')}
                      required
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="logo"
            render={({ field }) => (
              <FormItem className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <FormLabel htmlFor="organizationLogo">
                    {t('logo-label')}
                  </FormLabel>

                  <FormDescription>{t('logo-description')}</FormDescription>
                </div>

                <div className="grid gap-4">
                  <FormControl>
                    <Dropzone
                      {...uploadHandler}
                      getInputProps={props => ({
                        ...field,
                        ...uploadHandler.getInputProps(props),
                        id: 'organizationLogo',
                      })}
                    >
                      <DropzoneEmptyState />
                      <DropzoneContent />
                    </Dropzone>
                  </FormControl>

                  <div className="flex justify-end">
                    <Avatar className="size-32 rounded-md">
                      <AvatarImage
                        alt={t('logo-alt')}
                        className="aspect-square h-full w-full rounded-md object-cover"
                        src={organization.imageUrl}
                      />
                      <AvatarFallback className="rounded-md text-4xl">
                        {organization.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <div className="sm:col-start-2">
            <Button className="w-fit" disabled={isFormDisabled} type="submit">
              {isFormDisabled ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  {t('saving')}
                </>
              ) : (
                <>{t('save')}</>
              )}
            </Button>
          </div>
        </fieldset>
      </Form>
    </FormProvider>
  );
}
