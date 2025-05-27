import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
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
  AVATAR_PATH_PREFIX,
  BUCKET_NAME,
} from '~/features/user-accounts/user-account-constants';
import { useSupabaseUpload } from '~/hooks/use-supabase-upload';
import { toFormData } from '~/utils/to-form-data';

import { ONBOARDING_USER_ACCOUNT_INTENT } from './onboarding-user-account-constants';
import type {
  OnboardingUserAccountErrors,
  OnboardingUserAccountSchema,
} from './onboarding-user-account-schemas';
import { onboardingUserAccountSchema } from './onboarding-user-account-schemas';

export type OnboardingUserAccountFormCardProps = {
  errors?: OnboardingUserAccountErrors;
  isCreatingUserAccount?: boolean;
  userId: string;
};

export function OnboardingUserAccountFormCard({
  errors,
  isCreatingUserAccount = false,
  userId,
}: OnboardingUserAccountFormCardProps) {
  const { t } = useTranslation('onboarding', { keyPrefix: 'user-account' });
  const submit = useSubmit();

  const path = `${AVATAR_PATH_PREFIX}/${userId}`;
  const uploadHandler = useSupabaseUpload({
    bucketName: BUCKET_NAME,
    path,
    maxFiles: 1,
    maxFileSize: 1000 * 1000, // 1MB
    allowedMimeTypes: ['image/*'],
    upsert: false,
  });

  const form = useForm<OnboardingUserAccountSchema>({
    resolver: zodResolver(onboardingUserAccountSchema),
    defaultValues: {
      intent: ONBOARDING_USER_ACCOUNT_INTENT,
      name: '',
      avatar: undefined,
    },
    errors,
  });

  const handleSubmit = async (
    values: z.infer<typeof onboardingUserAccountSchema>,
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
        // Submit the form with the avatar URL
        await submit(toFormData({ ...values, avatar: publicUrl }), {
          method: 'POST',
        });
      }
    } else {
      // No avatar to upload, just submit the form as is
      await submit(toFormData(values), { method: 'POST' });
    }
  };

  const isFormDisabled = isCreatingUserAccount || uploadHandler.loading;

  return (
    <Card className="m-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('card-title')}</CardTitle>

        <CardDescription>{t('card-description')}</CardDescription>
      </CardHeader>

      <CardContent>
        <FormProvider {...form}>
          <Form
            id="user-account-form"
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
                    <FormLabel>{t('user-name-label')}</FormLabel>

                    <FormControl>
                      <Input
                        autoComplete="name"
                        autoFocus
                        placeholder={t('user-name-placeholder')}
                        required
                        {...field}
                      />
                    </FormControl>

                    <FormDescription>
                      {t('user-name-description')}
                    </FormDescription>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="userAvatar">
                      {t('avatar-label')}
                    </FormLabel>

                    <FormControl>
                      <Dropzone
                        {...uploadHandler}
                        getInputProps={props => ({
                          ...field,
                          ...uploadHandler.getInputProps(props),
                          id: 'userAvatar',
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
          form="user-account-form"
          name="intent"
          type="submit"
          value={ONBOARDING_USER_ACCOUNT_INTENT}
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
