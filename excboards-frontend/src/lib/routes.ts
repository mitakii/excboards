/** Profile page URL; keep in sync with the `u/:username` route in App.tsx. */
export function profilePath(username: string): string {
  return `/u/${encodeURIComponent(username)}`;
}
