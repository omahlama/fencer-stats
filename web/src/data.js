let athletesCache = null;

export async function loadAthletes() {
  if (athletesCache) return athletesCache;
  const res = await fetch('/data/athletes.json');
  if (!res.ok) throw new Error('Failed to load athletes');
  athletesCache = await res.json();
  return athletesCache;
}

export function findAthlete(slug) {
  if (!athletesCache) return null;
  return athletesCache.find((a) => a.url.replace(/\/$/, '').split('/').pop() === slug) ?? null;
}

export async function loadMatches(slug) {
  const res = await fetch(`/data/matches/${slug}.json`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load matches for ${slug}`);
  return res.json();
}
