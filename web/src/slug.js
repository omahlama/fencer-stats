export function athleteSlug(url) {
  return url.replace(/\/$/, '').split('/').pop();
}
