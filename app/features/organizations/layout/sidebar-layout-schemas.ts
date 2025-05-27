import { z } from 'zod';

import { SWITCH_ORGANIZATION_INTENT } from './sidebar-layout-constants';

export const switchOrganizationSchema = z.object({
  intent: z.literal(SWITCH_ORGANIZATION_INTENT),
  currentPath: z.string(),
  organizationId: z.string(),
});
