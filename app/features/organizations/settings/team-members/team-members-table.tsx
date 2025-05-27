import type { OrganizationMembership, UserAccount } from '@prisma/client';
import { OrganizationMembershipRole } from '@prisma/client';
import type { ColumnDef } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { ChevronDownIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TbChevronLeft,
  TbChevronRight,
  TbChevronsLeft,
  TbChevronsRight,
  TbCircleCheckFilled,
  TbLoader,
} from 'react-icons/tb';
import { useFetcher } from 'react-router';

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '~/components/ui/command';
import { Label } from '~/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';

import { CHANGE_ROLE_INTENT } from './team-members-constants';

export type Member = {
  avatar: UserAccount['imageUrl'];
  deactivatedAt?: OrganizationMembership['deactivatedAt'];
  email: UserAccount['email'];
  id: UserAccount['id'];
  isCurrentUser?: boolean;
  name: UserAccount['name'];
  role: OrganizationMembership['role'];
  status:
    | 'createdTheOrganization'
    | 'emailInvitePending'
    | 'joinedViaEmailInvite'
    | 'joinedViaLink';
};

type RoleSwitcherProps = {
  currentUserIsOwner: boolean;
  member: Member;
};

function RoleSwitcher({ currentUserIsOwner, member }: RoleSwitcherProps) {
  const { t } = useTranslation('organizations', {
    keyPrefix: 'settings.team-members.table.role-switcher',
  });

  const [open, setOpen] = useState(false);
  const fetcher = useFetcher();
  const role =
    (fetcher.formData?.get('role') as string) ||
    (member.deactivatedAt ? 'deactivated' : member.role);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className="w-36 justify-between" size="sm" variant="outline">
          {t(role)}

          <ChevronDownIcon
            aria-hidden="true"
            className="text-muted-foreground size-4"
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent asChild align="end" className="p-0">
        <fetcher.Form
          method="POST"
          onSubmit={() => {
            setOpen(false);
          }}
        >
          <input name="userId" value={member.id} type="hidden" />
          <input name="intent" value={CHANGE_ROLE_INTENT} type="hidden" />

          <Command label={t('command-label')}>
            <CommandInput placeholder={t('roles-placeholder')} />

            <CommandList>
              <CommandEmpty>{t('no-roles-found')}</CommandEmpty>

              <CommandGroup>
                <CommandItem className="teamaspace-y-1 flex flex-col items-start px-4 py-2">
                  <button
                    className="text-start"
                    name="role"
                    value={OrganizationMembershipRole.member}
                    type="submit"
                  >
                    <p>{t('member')}</p>

                    <p className="text-muted-foreground text-sm">
                      {t('member-description')}
                    </p>
                  </button>
                </CommandItem>

                <CommandItem className="teamaspace-y-1 flex flex-col items-start px-4 py-2">
                  <button
                    className="text-start"
                    name="role"
                    value={OrganizationMembershipRole.admin}
                    type="submit"
                  >
                    <p>{t('admin')}</p>

                    <p className="text-muted-foreground text-sm">
                      {t('admin-description')}
                    </p>
                  </button>
                </CommandItem>

                {currentUserIsOwner && (
                  <CommandItem className="teamaspace-y-1 flex flex-col items-start px-4 py-2">
                    <button
                      className="text-start"
                      name="role"
                      value={OrganizationMembershipRole.owner}
                      type="submit"
                    >
                      <p>{t('owner')}</p>

                      <p className="text-muted-foreground text-sm">
                        {t('owner-description')}
                      </p>
                    </button>
                  </CommandItem>
                )}

                <CommandSeparator />

                <CommandItem className="teamaspace-y-1 flex flex-col items-start px-4 py-2">
                  <button
                    className="text-start"
                    name="role"
                    value="deactivated"
                    type="submit"
                  >
                    <p>{t('deactivated')}</p>

                    <p className="text-muted-foreground text-sm">
                      {t('deactivated-description')}
                    </p>
                  </button>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </fetcher.Form>
      </PopoverContent>
    </Popover>
  );
}

const createColumns = ({
  currentUsersRole,
  t,
}: {
  currentUsersRole: OrganizationMembership['role'];
  t: TFunction;
}): ColumnDef<Member>[] => [
  {
    header: () => <div className="sr-only">{t('avatar-header')}</div>,
    accessorKey: 'avatar',
    cell: ({ row }) => {
      return (
        <Avatar>
          <AvatarImage src={row.original.avatar} alt={row.original.name} />
          <AvatarFallback>
            {row.original.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      );
    },
  },
  {
    header: t('name-header'),
    accessorKey: 'name',
    cell: ({ row }) => {
      return <div className="text-sm font-medium">{row.original.name}</div>;
    },
  },
  {
    header: t('email-header'),
    accessorKey: 'email',
  },
  {
    header: t('status-header'),
    accessorKey: 'status',
    cell: ({ row }) => {
      return (
        <Badge
          variant="outline"
          className="text-muted-foreground px-1.5 font-normal"
        >
          {row.original.status === 'emailInvitePending' ? (
            <TbLoader />
          ) : (
            <TbCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
          )}
          {t(`status.${row.original.status}`)}
        </Badge>
      );
    },
  },
  {
    header: t('role-header'),
    accessorKey: 'role',
    cell: ({ row }) =>
      // Hide the role switcher if:
      // 1. Its the current user's own role (can't change your own role)
      row.original.isCurrentUser ||
      // 2. If the current user is a member (members can't change roles)
      currentUsersRole === 'member' ||
      // 3. If the current user is an admin and the row is an owner (admins
      // can't change owners' roles)
      (currentUsersRole === 'admin' && row.original.role === 'owner') ||
      // 4. If the member is pending email invite (can't change roles of pending invites)
      row.original.status === 'emailInvitePending' ? (
        <div className="text-muted-foreground">
          {row.original.deactivatedAt
            ? t('role-switcher.deactivated')
            : t(`role-switcher.${row.original.role}`)}
        </div>
      ) : (
        <RoleSwitcher
          currentUserIsOwner={
            currentUsersRole === OrganizationMembershipRole.owner
          }
          member={row.original}
        />
      ),
  },
];

export type TeamMembersTableProps = {
  currentUsersRole: OrganizationMembership['role'];
  members: Member[];
};

export function TeamMembersTable({
  currentUsersRole,
  members,
}: TeamMembersTableProps) {
  const { t } = useTranslation('organizations', {
    keyPrefix: 'settings.team-members.table',
  });

  const columns = useMemo(
    () => createColumns({ currentUsersRole, t }),
    [currentUsersRole, t],
  );

  const table = useReactTable({
    data: members,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10 rounded-lg">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? undefined
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody className="**:data-[slot=table-cell]:font-light **:data-[slot=table-cell]:first:w-12 **:data-[slot=table-cell]:last:w-40">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t('no-results')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-4">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            {t('pagination.rows-per-page')}
          </Label>

          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={value => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger size="sm" className="w-20" id="rows-per-page">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>

            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map(pageSize => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            {t('pagination.page-info', {
              current: table.getState().pagination.pageIndex + 1,
              total: table.getPageCount(),
            })}
          </div>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">{t('pagination.go-to-first')}</span>
              <TbChevronsLeft />
            </Button>

            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">{t('pagination.go-to-previous')}</span>
              <TbChevronLeft />
            </Button>

            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">{t('pagination.go-to-next')}</span>
              <TbChevronRight />
            </Button>

            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">{t('pagination.go-to-last')}</span>
              <TbChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
