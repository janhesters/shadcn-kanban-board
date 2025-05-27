import { zodResolver } from '@hookform/resolvers/zod';
import { createId } from '@paralleldrive/cuid2';
import { Loader2Icon } from 'lucide-react';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Form, useSubmit } from 'react-router';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import {
  BUCKET_NAME,
  LOGO_PATH_PREFIX,
} from '~/features/organizations/organization-constants';
import { useSupabaseUpload } from '~/hooks/use-supabase-upload';
import { toFormData } from '~/utils/to-form-data';

import { ONBOARDING_ORGANIZATION_INTENT } from './onboarding-organization-consants';
import type {
  OnboardingOrganizationErrors,
  OnboardingOrganizationSchema,
} from './onboarding-organization-schemas';
import { onboardingOrganizationSchema } from './onboarding-organization-schemas';

export type OnboardingOrganizationFormCardProps = {
  errors?: OnboardingOrganizationErrors;
  isCreatingOrganization?: boolean;
};

export function OnboardingOrganizationFormCard({
  errors,
  isCreatingOrganization = false,
}: OnboardingOrganizationFormCardProps) {
  const { t } = useTranslation('onboarding', { keyPrefix: 'organization' });
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

  const form = useForm<OnboardingOrganizationSchema>({
    resolver: zodResolver(onboardingOrganizationSchema),
    defaultValues: {
      intent: ONBOARDING_ORGANIZATION_INTENT,
      name: '',
      organizationId: organizationId.current,
      logo: undefined,
    },
    errors,
  });

  const handleSubmit = async (
    values: z.infer<typeof onboardingOrganizationSchema>,
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
    <Card className="m-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('card-title')}</CardTitle>

        <CardDescription>{t('card-description')}</CardDescription>
      </CardHeader>

      <CardContent>
        <FormProvider {...form}>
          <Form
            id="organization-form"
            method="POST"
            replace
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <fieldset className="flex flex-col gap-6" disabled={isFormDisabled}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('organization-name-label')}</FormLabel>

                    <FormControl>
                      <Input
                        autoComplete="organization"
                        autoFocus
                        placeholder={t('organization-name-placeholder')}
                        required
                        {...field}
                      />
                    </FormControl>

                    <FormDescription>
                      {t('organization-name-description')}
                    </FormDescription>

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
          form="organization-form"
          name="intent"
          type="submit"
          value={ONBOARDING_ORGANIZATION_INTENT}
        >
          {isFormDisabled ? (
            <>
              <Loader2Icon className="animate-spin" />
              {t('saving')}
            </>
          ) : (
            <>{t('save')}</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
