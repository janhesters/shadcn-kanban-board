import { redirect } from 'react-router';

import { saveOrganizationWithOwnerToDatabase } from '~/features/organizations/organizations-model.server';
import { getIsDataWithResponseInit } from '~/utils/get-is-data-with-response-init.server';
import { slugify } from '~/utils/slugify.server';
import { validateFormData } from '~/utils/validate-form-data.server';

import { requireUserNeedsOnboarding } from '../onboarding-helpers.server';
import type { OnboardingOrganizationErrors } from './onboarding-organization-schemas';
import { onboardingOrganizationSchema } from './onboarding-organization-schemas';
import type { Route } from '.react-router/types/app/routes/onboarding+/+types/organization';

export async function onboardingOrganizationAction({
  request,
}: Route.ActionArgs) {
  try {
    const { user, headers } = await requireUserNeedsOnboarding(request);
    const data = await validateFormData(request, onboardingOrganizationSchema);

    const organization = await saveOrganizationWithOwnerToDatabase({
      organization: {
        name: data.name,
        slug: slugify(data.name),
        imageUrl: data.logo,
        id: data.organizationId,
      },
      userId: user.id,
    });

    return redirect(`/organizations/${organization.slug}`, { headers });
  } catch (error) {
    if (
      getIsDataWithResponseInit<{ errors: OnboardingOrganizationErrors }>(error)
    ) {
      return error;
    }

    throw error;
  }
}
