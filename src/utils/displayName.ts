import { User } from '../types';
import { getTitleByKey } from '../constants/titles';

export function displayName(user: User | null | undefined): string {
  if (!user) return '';
  if (!user.title) return user.name;
  const title = getTitleByKey(user.title);
  return title ? `${title.label} ${user.name}` : user.name;
}
