import type { LinkProps } from 'react-router';
import { Link } from 'react-router';

export type DisableableLinkComponentProps = LinkProps & { disabled?: boolean };

export function DisableableLink(props: DisableableLinkComponentProps) {
  const { disabled, children, ...rest } = props;

  return disabled ? (
    <span aria-disabled="true" {...rest}>
      {children}
    </span>
  ) : (
    <Link {...rest}>{children}</Link>
  );
}
