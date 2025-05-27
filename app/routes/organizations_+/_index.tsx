import { OrganizationMembershipRole } from '@prisma/client';
import { AvatarFallback } from '@radix-ui/react-avatar';
import { useTranslation } from 'react-i18next';
import { href, Link, redirect } from 'react-router';
import { promiseHash } from 'remix-utils/promise';

import { Avatar, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { buttonVariants } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { ThemeToggle } from '~/features/color-scheme/theme-toggle';
import { requireOnboardedUserAccountExists } from '~/features/onboarding/onboarding-helpers.server';
import { cn } from '~/lib/utils';
import { getPageTitle } from '~/utils/get-page-title.server';
import i18next from '~/utils/i18next.server';

import type { Route } from './+types/_index';

export const handle = { i18n: 'organizations' };

export async function loader({ request }: Route.LoaderArgs) {
  const {
    data: { user },
    t,
  } = await promiseHash({
    data: requireOnboardedUserAccountExists(request),
    t: i18next.getFixedT(request, ['organizations', 'common']),
  });

  if (user.memberships.length === 1) {
    return redirect(`/organizations/${user.memberships[0].organization.slug}`);
  }

  return {
    memberships: user.memberships,
    title: getPageTitle(t, 'organizations-list.title'),
  };
}

export const meta: Route.MetaFunction = ({ data }) => [{ title: data?.title }];

export default function OrganizationsRoute({
  loaderData,
}: Route.ComponentProps) {
  const { memberships } = loaderData;
  const { t } = useTranslation('organizations', {
    keyPrefix: 'organizations-list',
  });

  return (
    <>
      <header className="flex h-(--header-height) items-center border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between p-2">
          <h1 className="text-base font-medium">{t('page-title')}</h1>

          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-xl p-4 md:px-0 md:py-12">
        <Card>
          <CardHeader>
            <CardTitle>{t('card-title')}</CardTitle>

            <CardDescription>{t('card-description')}</CardDescription>
          </CardHeader>

          <CardContent>
            <ul className="grid gap-4">
              {memberships.map(membership => (
                <li key={membership.organization.id}>
                  <Link
                    className={cn(
                      buttonVariants({ variant: 'outline' }),
                      'flex h-auto w-full items-center gap-2 px-4 py-2 text-left',
                    )}
                    to={href('/organizations/:organizationSlug', {
                      organizationSlug: membership.organization.slug,
                    })}
                  >
                    <Avatar className="size-10 shrink-0 items-center justify-center rounded-md border">
                      <AvatarImage
                        alt={membership.organization.name}
                        src={membership.organization.imageUrl}
                      />
                      <AvatarFallback>
                        {membership.organization.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <span className="block whitespace-normal">
                        {membership.organization.name}
                      </span>
                    </div>

                    <Badge
                      variant={
                        membership.role === OrganizationMembershipRole.owner
                          ? 'default'
                          : membership.role === OrganizationMembershipRole.admin
                            ? 'secondary'
                            : 'outline'
                      }
                      className="shrink-0"
                    >
                      {membership.role === OrganizationMembershipRole.owner
                        ? t('roles.owner')
                        : membership.role === OrganizationMembershipRole.admin
                          ? t('roles.admin')
                          : t('roles.member')}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
