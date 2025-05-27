import { zodResolver } from '@hookform/resolvers/zod';
import type { UserAccount } from '@prisma/client';
import { Loader2Icon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { TbUserFilled } from 'react-icons/tb';
import { Form, useSubmit } from 'react-router';

import {
  DragAndDropContent,
  DragAndDropDescription,
  DragAndDropHeading,
  DragAndDropIcon,
  DragAndDropProvider,
  DragAndDropSelectedFiles,
  DrapAndDropButton,
} from '~/components/drag-and-drop';
import { DragAndDrop } from '~/components/drag-and-drop';
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
import { usePreviewUrl } from '~/hooks/use-preview-url';
import { toFormData } from '~/utils/to-form-data';

import {
  ACCEPTED_IMAGE_TYPES,
  acceptedFileExtensions,
  UPDATE_USER_ACCOUNT_INTENT,
} from './account-settings-constants';
import type { UpdateUserAccountFormSchema } from './account-settings-schemas';
import { updateUserAccountFormSchema } from './account-settings-schemas';

export type UpdateUserAccountFormErrors =
  FieldErrors<UpdateUserAccountFormSchema>;

export type AccountSettingsProps = {
  errors?: UpdateUserAccountFormErrors;
  isUpdatingUserAccount?: boolean;
  user: {
    email: UserAccount['email'];
    imageUrl?: UserAccount['imageUrl'];
    name: UserAccount['name'];
  };
  success?: string;
};

function AvatarDragAndDrop({ isInvalid }: { isInvalid: boolean }) {
  const { t } = useTranslation('drag-and-drop');

  return (
    // The real input of the form is the hidden input above the drag and drop
    // component.
    <DragAndDrop aria-hidden="true" className="flex-grow" isInvalid={isInvalid}>
      <DragAndDropContent>
        <div className="mx-auto flex items-center gap-2">
          <DragAndDropIcon />

          <DragAndDropSelectedFiles />
        </div>

        <DragAndDropHeading>
          <Trans
            components={{ 1: <DrapAndDropButton /> }}
            i18nKey="drag-and-drop:heading"
          />
        </DragAndDropHeading>

        <DragAndDropDescription>
          {t('extensions', {
            extensions: acceptedFileExtensions.join(', '),
            maxFileSize: '1MB',
          })}
        </DragAndDropDescription>
      </DragAndDropContent>
    </DragAndDrop>
  );
}

export function AccountSettings({
  errors,
  isUpdatingUserAccount = false,
  user,
  success,
}: AccountSettingsProps) {
  const { t } = useTranslation('settings', {
    keyPrefix: 'user-account.form',
  });
  const submit = useSubmit();

  const hiddenInputReference = useRef<HTMLInputElement>(null);

  const form = useForm<UpdateUserAccountFormSchema>({
    resolver: zodResolver(updateUserAccountFormSchema),
    defaultValues: {
      intent: UPDATE_USER_ACCOUNT_INTENT,
      avatar: undefined,
      email: user.email,
      name: user.name,
    },
    errors,
  });

  const avatarFile = form.watch('avatar');

  const previewUrl = usePreviewUrl(avatarFile, user.imageUrl);

  const handleSubmit = async (values: UpdateUserAccountFormSchema) => {
    await submit(toFormData(values), {
      method: 'POST',
      replace: true,
      encType: 'multipart/form-data',
    });
  };

  // 1️⃣ watch for success
  useEffect(() => {
    if (success) {
      // clear react-hook-form’s avatar field
      form.resetField('avatar'); // :contentReference[oaicite:0]{index=0}

      // clear the actual file-input DOM element (mobile)
      if (hiddenInputReference.current) {
        hiddenInputReference.current.value = '';
      }
    }
  }, [success, form]);

  return (
    <FormProvider {...form}>
      <Form
        encType="multipart/form-data"
        id="update-user-account-form"
        method="POST"
        onSubmit={form.handleSubmit(handleSubmit)}
        replace
      >
        <fieldset
          className="flex flex-col gap-y-6 sm:gap-y-8"
          disabled={isUpdatingUserAccount}
        >
          {/* Name Field */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="grid gap-x-8 sm:grid-cols-2">
                <div className="space-y-1">
                  <FormLabel>{t('name-label')}</FormLabel>

                  <FormDescription>{t('name-description')}</FormDescription>
                </div>

                <div className="grid gap-2">
                  <FormControl>
                    <Input
                      autoComplete="name"
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

          {/* Email Field - Read Only */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="grid gap-x-8 sm:grid-cols-2">
                <div className="space-y-1">
                  <FormLabel>{t('email-label')}</FormLabel>
                  <FormDescription>{t('email-description')}</FormDescription>
                </div>

                <div className="grid gap-2">
                  <FormControl>
                    <Input
                      autoComplete="email"
                      disabled
                      readOnly
                      placeholder={t('email-placeholder')}
                      {...field}
                      value={user.email}
                    />
                  </FormControl>

                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {/* Avatar Field */}
          <FormField
            control={form.control}
            name="avatar"
            render={({ field }) => {
              // We only need the ref and other props from field,
              // onChange is handled manually below to update preview.
              const { onChange, value: _1, ref: _2, ...rest } = field;
              return (
                <div className="flex flex-col gap-2">
                  <div className="flex items-end gap-4">
                    <FormItem className="grid w-full gap-x-8 sm:grid-cols-2">
                      <div className="space-y-1">
                        <FormLabel>{t('avatar-label')}</FormLabel>

                        <FormDescription>
                          {t('avatar-description')}
                        </FormDescription>
                      </div>

                      <div className="w-full">
                        <FormControl>
                          <Input
                            accept={Object.keys(ACCEPTED_IMAGE_TYPES).join(',')}
                            className="sm:hidden"
                            multiple={false}
                            type="file"
                            {...rest}
                            onChange={event => {
                              const file = event.target.files?.[0];
                              if (file) {
                                onChange(file);
                              }
                            }}
                            ref={hiddenInputReference}
                          />
                        </FormControl>

                        <div className="hidden flex-grow gap-3 md:flex">
                          <DragAndDropProvider
                            accept={ACCEPTED_IMAGE_TYPES}
                            key={String(success ?? 'first-render')} // 2️⃣ remount on success
                            noClick={true}
                            onDrop={incomingFiles => {
                              onChange(incomingFiles[0]);
                              if (hiddenInputReference.current) {
                                // Note the specific way we need to munge the
                                // file into the hidden input
                                // https://stackoverflow.com/a/68182158/1068446
                                const dataTransfer = new DataTransfer();
                                for (const file of incomingFiles) {
                                  dataTransfer.items.add(file);
                                }
                                hiddenInputReference.current.files =
                                  dataTransfer.files;
                              }
                            }}
                            multiple={false}
                          >
                            <AvatarDragAndDrop
                              isInvalid={!!form.formState.errors.avatar}
                            />
                          </DragAndDropProvider>

                          <Avatar className="size-30.5 rounded-md">
                            <AvatarFallback className="bg-muted-foreground/30 dark:bg-muted md:rounded-md">
                              <TbUserFilled className="text-background size-full p-0.5" />
                            </AvatarFallback>

                            <AvatarImage
                              alt="Avatar"
                              className="rounded-md object-cover"
                              src={previewUrl}
                            />
                          </Avatar>
                        </div>

                        <FormMessage className="mt-2 hidden md:block" />
                      </div>
                    </FormItem>

                    <Avatar className="size-21 md:hidden">
                      <AvatarFallback className="bg-muted-foreground/30 dark:bg-muted md:rounded-md">
                        <TbUserFilled className="text-background size-full p-0.5" />
                      </AvatarFallback>

                      <AvatarImage
                        alt="Avatar"
                        className="object-cover md:rounded-md"
                        src={previewUrl}
                      />
                    </Avatar>
                  </div>

                  <FormMessage className="md:hidden" />
                </div>
              );
            }}
          />

          <div className="sm:col-start-2">
            <Button
              className="w-fit"
              disabled={isUpdatingUserAccount}
              type="submit"
            >
              {isUpdatingUserAccount ? (
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
