import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Form, useSubmit } from 'react-router';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

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
import { Textarea } from '~/components/ui/textarea';

import type {
  ContactSalesFormErrors,
  ContactSalesFormSchema,
} from './contact-sales-schemas';
import { contactSalesFormSchema } from './contact-sales-schemas';

export type ContactSalesTeamProps = {
  errors?: ContactSalesFormErrors;
  isContactingSales?: boolean;
};

export function ContactSalesTeam({
  errors,
  isContactingSales = false,
}: ContactSalesTeamProps) {
  const { t } = useTranslation('billing', { keyPrefix: 'contact-sales' });

  const form = useForm<ContactSalesFormSchema>({
    resolver: zodResolver(contactSalesFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      companyName: '',
      workEmail: '',
      phoneNumber: '',
      message: '',
    },
    errors,
  });

  const submit = useSubmit();
  const onSubmit = async (data: ContactSalesFormSchema) => {
    await submit(data, { method: 'POST', replace: true });
  };

  return (
    <Card>
      <CardHeader className="space-y-6">
        <CardTitle className="text-primary text-5xl">
          {t('contact-sales-title')}
        </CardTitle>

        <CardDescription className="text-2xl">
          {t('contact-sales-description')}
        </CardDescription>
      </CardHeader>

      <FormProvider {...form}>
        <Form method="POST" onSubmit={form.handleSubmit(onSubmit)}>
          <fieldset className="space-y-6" disabled={isContactingSales}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('first-name-label')}</FormLabel>

                    <FormControl>
                      <Input
                        autoComplete="given-name"
                        placeholder={t('first-name-placeholder')}
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('last-name-label')}</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="family-name"
                        placeholder={t('last-name-placeholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('company-name-label')}</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="organization"
                        placeholder={t('company-name-placeholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="workEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('work-email-label')}</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="email"
                        placeholder={t('work-email-placeholder')}
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('phone-number-label')}</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="tel"
                        placeholder={t('phone-number-placeholder')}
                        type="tel"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('message-label')}</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-[90px] resize-none"
                        placeholder={t('message-placeholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <HoneypotInputs label="Please leave this field blank" />
            </CardContent>

            <CardFooter className="flex flex-col items-start space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <p className="text-muted-foreground text-sm">
                {t('submit-disclaimer')}
              </p>

              <Button
                {...form.register('intent', { value: 'contactSales' })}
                type="submit"
              >
                {isContactingSales ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    {t('submit-button-loading')}
                  </>
                ) : (
                  <>{t('submit-button')}</>
                )}
              </Button>
            </CardFooter>
          </fieldset>
        </Form>
      </FormProvider>
    </Card>
  );
}
