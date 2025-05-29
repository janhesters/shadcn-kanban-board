import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { TbBrightness } from 'react-icons/tb';
import { Form } from 'react-router';

import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { cn } from '~/lib/utils';

import {
  COLOR_SCHEME_FORM_KEY,
  colorSchemes,
  THEME_TOGGLE_INTENT,
} from './color-scheme-constants';
import { useColorScheme } from './use-color-scheme';

function ColorSchemeButton({
  className,
  value,
  ...props
}: ComponentProps<'button'>) {
  const currentColorScheme = useColorScheme();
  const isActive = currentColorScheme === value;

  return (
    <DropdownMenuItem asChild className="w-full">
      <button
        {...props}
        className={cn(
          className,
          isActive && 'text-primary [&_svg]:!text-primary',
        )}
        disabled={isActive}
        name={COLOR_SCHEME_FORM_KEY}
        type="submit"
        value={value}
      />
    </DropdownMenuItem>
  );
}

export function ThemeToggle() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Open theme menu"
          className="size-8"
          size="icon"
          variant="outline"
        >
          <TbBrightness />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={4}>
        <DropdownMenuLabel className="sr-only">Appearance</DropdownMenuLabel>

        <DropdownMenuSeparator className="sr-only" />

        <DropdownMenuGroup asChild>
          <Form action="/color-scheme" method="post" navigate={false}>
            <input name="intent" type="hidden" value={THEME_TOGGLE_INTENT} />

            <ColorSchemeButton value={colorSchemes.light}>
              <SunIcon />
              Light
            </ColorSchemeButton>

            <ColorSchemeButton value={colorSchemes.dark}>
              <MoonIcon />
              Dark
            </ColorSchemeButton>

            <ColorSchemeButton value={colorSchemes.system}>
              <MonitorIcon />
              System
            </ColorSchemeButton>
          </Form>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
