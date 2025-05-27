import { z } from 'zod';

import { getIsDataWithResponseInit } from '~/utils/get-is-data-with-response-init.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import type { Payload } from '~/utils/to-form-data';
import { validateFormData } from '~/utils/validate-form-data.server';

import { saveContactSalesFormSubmissionToDatabase } from './contact-sales-form-submission-model.server';
import type { ContactSalesFormErrors } from './contact-sales-schemas';
import { contactSalesFormSchema } from './contact-sales-schemas';
import type { Route } from '.react-router/types/app/routes/+types/contact-sales';

const schema = z.discriminatedUnion('intent', [
  contactSalesFormSchema.passthrough(),
]);

export async function contactSalesAction({ request }: Route.ActionArgs) {
  try {
    const body = await validateFormData(request, schema);

    switch (body.intent) {
      case 'contactSales': {
        const { intent, ...data } = body;
        await checkHoneypot(data as Payload);
        await saveContactSalesFormSubmissionToDatabase(data);
        return { success: true };
      }
    }
  } catch (error) {
    if (getIsDataWithResponseInit<{ errors: ContactSalesFormErrors }>(error)) {
      return error;
    }

    throw error;
  }
}
