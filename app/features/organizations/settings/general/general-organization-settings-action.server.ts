import { OrganizationMembershipRole } from '@prisma/client';
import { data, href } from 'react-router';
import { promiseHash } from 'remix-utils/promise';
import { z } from 'zod';

import { updateStripeCustomer } from '~/features/billing/stripe-helpers.server';
import { combineHeaders } from '~/utils/combine-headers.server';
import { getIsDataWithResponseInit } from '~/utils/get-is-data-with-response-init.server';
import { forbidden } from '~/utils/http-responses.server';
import i18next from '~/utils/i18next.server';
import { slugify } from '~/utils/slugify.server';
import { removeImageFromStorage } from '~/utils/storage-helpers.server';
import { createToastHeaders, redirectWithToast } from '~/utils/toast.server';
import { validateFormData } from '~/utils/validate-form-data.server';

import {
  deleteOrganization,
  requireUserIsMemberOfOrganization,
} from '../../organizations-helpers.server';
import { updateOrganizationInDatabaseBySlug } from '../../organizations-model.server';
import type { UpdateOrganizationFormErrors } from './general-organization-settings';
import {
  DELETE_ORGANIZATION_INTENT,
  UPDATE_ORGANIZATION_INTENT,
} from './general-settings-constants';
import {
  deleteOrganizationFormSchema,
  updateOrganizationFormSchema,
} from './general-settings-schemas';
import type { Route } from '.react-router/types/app/routes/organizations_+/$organizationSlug+/settings+/+types/general';

const generalOrganizationSettingsActionSchema = z.discriminatedUnion('intent', [
  deleteOrganizationFormSchema,
  updateOrganizationFormSchema,
]);

export async function generalOrganizationSettingsAction({
  request,
  params,
}: Route.ActionArgs) {
  try {
    const { auth, t } = await promiseHash({
      auth: requireUserIsMemberOfOrganization(request, params.organizationSlug),
      t: i18next.getFixedT(request, 'organizations', {
        keyPrefix: 'settings.general.toast',
      }),
    });
    const { headers, organization, role } = auth;
    const body = await validateFormData(
      request,
      generalOrganizationSettingsActionSchema,
    );

    if (role !== OrganizationMembershipRole.owner) {
      return forbidden();
    }

    switch (body.intent) {
      case UPDATE_ORGANIZATION_INTENT: {
        const updates: { name?: string; slug?: string; imageUrl?: string } = {};

        if (body.name && body.name !== organization.name) {
          const newSlug = slugify(body.name);
          updates.name = body.name;
          updates.slug = newSlug;
        }

        if (body.logo) {
          await removeImageFromStorage(organization.imageUrl);
          updates.imageUrl = body.logo;
        }

        if (Object.keys(updates).length > 0) {
          await updateOrganizationInDatabaseBySlug({
            slug: params.organizationSlug,
            organization: updates,
          });

          if (updates.name && organization.stripeCustomerId) {
            await updateStripeCustomer({
              customerId: organization.stripeCustomerId,
              customerName: updates.name,
            });
          }

          if (updates.slug) {
            return redirectWithToast(
              href(`/organizations/:organizationSlug/settings/general`, {
                organizationSlug: updates.slug,
              }),
              { title: t('organization-profile-updated'), type: 'success' },
              { headers },
            );
          }
        }

        const toastHeaders = await createToastHeaders({
          title: t('organization-profile-updated'),
          type: 'success',
        });
        return data({}, { headers: combineHeaders(headers, toastHeaders) });
      }

      case DELETE_ORGANIZATION_INTENT: {
        await deleteOrganization(organization.id);
        return redirectWithToast(
          href('/organizations'),
          { title: t('organization-deleted'), type: 'success' },
          { headers },
        );
      }
    }
  } catch (error) {
    if (
      getIsDataWithResponseInit<{ errors: UpdateOrganizationFormErrors }>(error)
    ) {
      return error;
    }

    throw error;
  }
}
