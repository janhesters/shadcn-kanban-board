import type { LucideIcon } from 'lucide-react';
import { ChevronRightIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { NavLink, useLocation } from 'react-router';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '~/components/ui/sidebar';

type NavGroupItem = {
  title: string;
  icon?: LucideIcon;
  isActive?: boolean;
};

export type NavGroupItemWithoutChildren = NavGroupItem & {
  url: string;
};

type NavGroupItemWithChildren = NavGroupItem & {
  items: {
    isActive?: boolean;
    title: string;
    url: string;
  }[];
};

export type NavGroupProps = {
  className?: string;
  items: (NavGroupItemWithoutChildren | NavGroupItemWithChildren)[];
  size?: ComponentProps<typeof SidebarMenuButton>['size'];
  title?: string;
};

export function NavGroup({ className, items, size, title }: NavGroupProps) {
  const location = useLocation();

  return (
    <SidebarGroup className={className}>
      {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}

      <SidebarMenu>
        {items.map(item => {
          if ('items' in item) {
            const isParentActive = item.items.some(
              subItem => location.pathname === subItem.url,
            );

            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={isParentActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      size={size}
                      isActive={isParentActive}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map(subItem => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <NavLink end to={subItem.url}>
                            {({ isActive: childIsActive }) => (
                              <SidebarMenuSubButton
                                isActive={childIsActive}
                                asChild
                              >
                                <div>
                                  <span>{subItem.title}</span>
                                </div>
                              </SidebarMenuSubButton>
                            )}
                          </NavLink>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          return (
            <SidebarMenuItem key={item.title}>
              <NavLink to={item.url}>
                {({ isActive }) => (
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    size={size}
                    isActive={isActive}
                  >
                    <div>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </div>
                  </SidebarMenuButton>
                )}
              </NavLink>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
