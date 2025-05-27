import { findLast, has, pipe, prop } from 'ramda';
import type { UIMatch } from 'react-router';

export const findHeaderTitle = (matches: UIMatch<{ headerTitle?: string }>[]) =>
  findLast(pipe(prop('data'), has('headerTitle')), matches)?.data?.headerTitle;
