import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';

export type OrganizationInfoProps = {
  organizationName: string;
  organizationLogoUrl: string;
};

export function OrganizationInfo({
  organizationName,
  organizationLogoUrl,
}: OrganizationInfoProps) {
  return (
    <div className="flex flex-col gap-y-6 sm:gap-y-8">
      <div className="grid gap-x-8 sm:grid-cols-2">
        <div className="space-y-1">
          <h2 className="text-sm font-medium">Organization Name</h2>
          <p className="text-muted-foreground text-sm">
            The name of your organization as it appears to others.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <p className="text-sm">{organizationName}</p>
        </div>
      </div>

      <div className="grid gap-x-8 sm:grid-cols-2">
        <div className="space-y-1">
          <h2 className="text-sm font-medium">Organization Logo</h2>
          <p className="text-muted-foreground text-sm">
            The logo that represents your organization.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Avatar className="size-16 rounded-md">
            <AvatarImage
              alt="Organization logo"
              className="aspect-square h-full rounded-md object-cover"
              src={organizationLogoUrl}
            />
            <AvatarFallback className="rounded-md text-2xl">
              {organizationName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
