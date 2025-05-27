import { OrganizationMembershipRole } from '@prisma/client';
import confetti from 'canvas-confetti';
import { BadgeCheckIcon } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { data, href, Link } from 'react-router';
import { promiseHash } from 'remix-utils/promise';

import { Button } from '~/components/ui/button';
import { requireUserIsMemberOfOrganization } from '~/features/organizations/organizations-helpers.server';
import { getPageTitle } from '~/utils/get-page-title.server';
import { notFound } from '~/utils/http-responses.server';
import i18next from '~/utils/i18next.server';

import type { Route } from './+types/billing_.success';

export const handle = { i18n: 'billing' };

export async function loader({ request, params }: Route.LoaderArgs) {
  const {
    auth: { headers, role },
    t,
  } = await promiseHash({
    auth: requireUserIsMemberOfOrganization(request, params.organizationSlug),
    t: i18next.getFixedT(request, ['billing', 'common']),
  });

  if (role === OrganizationMembershipRole.member) {
    throw notFound();
  }

  return data(
    { title: getPageTitle(t, 'billing-success-page.page-title') },
    { headers },
  );
}

export const meta: Route.MetaFunction = ({ data }) => [{ title: data?.title }];

export default function BillingSuccessRoute({ params }: Route.ComponentProps) {
  const { t } = useTranslation('billing', {
    keyPrefix: 'billing-success-page',
  });
  const { organizationSlug } = params;

  useEffect(() => {
    const end = Date.now() + 2 * 1000; // 3 seconds
    const colors = ['#3b82f6', '#22c55e', '#eab308', '#ef4444'];
    let everyOther = true;

    const frame = () => {
      if (Date.now() > end) return;

      if (everyOther) {
        void confetti({
          particleCount: colors.length,
          angle: 60,
          spread: 55,
          startVelocity: 60,
          origin: { x: 0, y: 0.5 },
          colors: colors,
        });
        void confetti({
          particleCount: colors.length,
          angle: 120,
          spread: 55,
          startVelocity: 60,
          origin: { x: 1, y: 0.5 },
          colors: colors,
        });
      }

      everyOther = !everyOther;
      requestAnimationFrame(frame);
    };

    frame();
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-4 md:py-6 lg:px-6">
      <div className="flex max-w-xl flex-col items-center px-4 text-center">
        <BadgeCheckIcon className="mx-auto size-16 text-green-400 dark:text-green-500" />

        <h3 className="text-foreground mt-2 text-lg font-semibold">
          {t('payment-successful')}
        </h3>

        <p className="text-muted-foreground mt-2 text-base text-balance">
          {t('product-ready')}
        </p>

        <p className="text-muted-foreground mt-2 text-base text-balance">
          {t('thank-you')}
        </p>

        <Button asChild>
          <Link
            className="mt-6"
            to={href('/organizations/:organizationSlug/dashboard', {
              organizationSlug,
            })}
          >
            {t('go-to-dashboard')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
