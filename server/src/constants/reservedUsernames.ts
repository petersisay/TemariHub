/**
 * Protected and reserved system usernames that cannot be claimed by regular users.
 */
export const RESERVED_USERNAMES = new Set<string>([
  'admin',
  'administrator',
  'root',
  'api',
  'auth',
  'support',
  'help',
  'security',
  'temarihub',
  'moderator',
  'system',
  'null',
  'undefined',
  'anonymous',
  'guest',
  'login',
  'register',
  'settings',
  'profile',
  'opportunities',
  'tracker',
  'dashboard',
  'feed',
  'explore',
  'submit',
  'about',
  'contact',
  'terms',
  'privacy',
  'official',
  'staff',
]);

export function isReservedUsername(username: string): boolean {
  if (!username) return false;
  return RESERVED_USERNAMES.has(username.toLowerCase().trim());
}
