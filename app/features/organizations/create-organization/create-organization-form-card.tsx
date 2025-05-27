import { zodResolver } from '@hookform/resolvers/zod';
import { createId } from '@paralleldrive/cuid2';
import { Loader2Icon } from 'lucide-react';
import { useRef } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { Form, href, Link, useSubmit } from 'react-router';
import type { z } from 'zod';

import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from '~/components/dropzone';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { useSupabaseUpload } from '~/hooks/use-supabase-upload';
import { toFormData } from '~/utils/to-form-data';

import { BUCKET_NAME, LOGO_PATH_PREFIX } from '../organization-constants';
import { CREATE_ORGANIZATION_INTENT } from './create-organization-constants';
import type { CreateOrganizationFormSchema } from './create-organization-schemas';
import { createOrganizationFormSchema } from './create-organization-schemas';

export type CreateOrganizationFormErrors =
  FieldErrors<CreateOrganizationFormSchema>;

export type CreateOrganizationFormCardProps = {
  errors?: CreateOrganizationFormErrors;
  isCreatingOrganization?: boolean;
};

export function CreateOrganizationFormCard({
  errors,
  isCreatingOrganization = false,
}: CreateOrganizationFormCardProps) {
  const { t } = useTranslation('organizations', { keyPrefix: 'new.form' });
  const submit = useSubmit();

  // Since you upload the logo before creating the organization, we need to
  // generate a unique ID for the organization.
  const organizationId = useRef(createId());
  const path = `${LOGO_PATH_PREFIX}/${organizationId.current}`;
  const uploadHandler = useSupabaseUpload({
    bucketName: BUCKET_NAME,
    path,
    maxFiles: 1,
    maxFileSize: 1000 * 1000, // 1MB
    allowedMimeTypes: ['image/*'],
    upsert: false,
  });

  const form = useForm<CreateOrganizationFormSchema>({
    resolver: zodResolver(createOrganizationFormSchema),
    defaultValues: {
      intent: CREATE_ORGANIZATION_INTENT,
      name: '',
      organizationId: organizationId.current,
      logo: undefined,
    },
    errors,
  });

  const handleSubmit = async (
    values: z.infer<typeof createOrganizationFormSchema>,
  ) => {
    if (uploadHandler.files.length > 0) {
      const isUploadSuccess = await uploadHandler.onUpload();

      if (isUploadSuccess) {
        // Get the public URL of the uploaded file
        const {
          data: { publicUrl },
        } = uploadHandler.supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(`${path}/${uploadHandler.files[0].name}`, {
            transform: { width: 128, height: 128, resize: 'cover' },
          });
        // Submit the form with the logo URL
        await submit(toFormData({ ...values, logo: publicUrl }), {
          method: 'POST',
        });
      }
    } else {
      // No logo to upload, just submit the form as is
      await submit(toFormData(values), { method: 'POST' });
    }
  };

  const isFormDisabled = isCreatingOrganization || uploadHandler.loading;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('card-title')}</CardTitle>
          <CardDescription>{t('card-description')}</CardDescription>
        </CardHeader>

        <CardContent>
          <FormProvider {...form}>
            <Form
              id="create-organization-form"
              method="POST"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <fieldset
                className="flex flex-col gap-6"
                disabled={isFormDisabled}
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('name-label')}</FormLabel>

                      <FormControl>
                        <Input
                          autoComplete="organization"
                          autoFocus
                          placeholder={t('name-placeholder')}
                          required
                          {...field}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="organizationLogo">
                        {t('logo-label')}
                      </FormLabel>

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

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </fieldset>
            </Form>
          </FormProvider>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            disabled={isFormDisabled}
            form="create-organization-form"
            name="intent"
            type="submit"
          >
            {isFormDisabled ? (
              <>
                <Loader2Icon className="animate-spin" />
                {t('saving')}
              </>
            ) : (
              <>{t('submit-button')}</>
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="text-muted-foreground [&_a]:hover:text-primary text-center text-xs text-balance [&_a]:underline [&_a]:underline-offset-4">
        <Trans
          components={{
            1: <Link to={href('/terms-of-service')} />,
            2: <Link to={href('/privacy-policy')} />,
          }}
          i18nKey="organizations:new.form.terms-and-privacy"
        />
      </div>
    </div>
  );
}
