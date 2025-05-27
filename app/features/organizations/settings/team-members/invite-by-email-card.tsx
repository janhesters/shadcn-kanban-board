import { zodResolver } from '@hookform/resolvers/zod';
import { OrganizationMembershipRole } from '@prisma/client';
import { Loader2Icon } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Form, useSubmit } from 'react-router';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { toFormData } from '~/utils/to-form-data';

import { INVITE_BY_EMAIL_INTENT } from './team-members-constants';
import type {
  InviteByEmailErrors,
  InviteByEmailSchema,
} from './team-members-settings-schemas';
import { inviteByEmailSchema } from './team-members-settings-schemas';

export type EmailInviteCardProps = {
  currentUserIsOwner: boolean;
  errors?: InviteByEmailErrors;
  isInvitingByEmail?: boolean;
  organizationIsFull?: boolean;
  successEmail?: string;
};

export function EmailInviteCard({
  currentUserIsOwner,
  errors,
  isInvitingByEmail = false,
  organizationIsFull = false,
  successEmail,
}: EmailInviteCardProps) {
  const { t } = useTranslation('organizations', {
    keyPrefix: 'settings.team-members.invite-by-email',
  });

  const submit = useSubmit();

  const form = useForm<InviteByEmailSchema>({
    resolver: zodResolver(inviteByEmailSchema),
    defaultValues: {
      email: '',
      intent: INVITE_BY_EMAIL_INTENT,
      role: OrganizationMembershipRole.member,
    },
    errors,
  });

  const handleSubmit = async (values: InviteByEmailSchema) => {
    await submit(toFormData(values), { method: 'POST' });
  };

  // If the invite was successful, clear the email input
  useEffect(() => {
    if (successEmail) {
      form.setValue('email', '');
    }
  }, [successEmail]);

  const disabled = isInvitingByEmail || organizationIsFull;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('card-title')}</CardTitle>

        <CardDescription>{t('card-description')}</CardDescription>
      </CardHeader>

      <CardContent>
        <FormProvider {...form}>
          <Form
            method="POST"
            id="invite-by-email-form"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <fieldset disabled={disabled}>
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="min-w-0 flex-1">
                      <FormLabel>{t('form.email')}</FormLabel>

                      <FormControl>
                        <Input
                          autoComplete="email"
                          placeholder={t('form.email-placeholder')}
                          required
                          type="email"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.role')}</FormLabel>

                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="min-w-28">
                            <SelectValue
                              placeholder={t('form.role-placeholder')}
                            />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent align="end">
                          <SelectItem value={OrganizationMembershipRole.member}>
                            {t('form.role-member')}
                          </SelectItem>

                          <SelectItem value={OrganizationMembershipRole.admin}>
                            {t('form.role-admin')}
                          </SelectItem>

                          {currentUserIsOwner && (
                            <SelectItem
                              value={OrganizationMembershipRole.owner}
                            >
                              {t('form.role-owner')}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {form.formState.errors.email && (
                <FormMessage className="mt-2">
                  {form.formState.errors.email.message}
                </FormMessage>
              )}
            </fieldset>
          </Form>
        </FormProvider>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          disabled={disabled}
          form="invite-by-email-form"
          name="intent"
          type="submit"
          value={INVITE_BY_EMAIL_INTENT}
        >
          {isInvitingByEmail ? (
            <>
              <Loader2Icon className="animate-spin" />
              {t('form.inviting')}
            </>
          ) : (
            <>{t('form.submit-button')}</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
