import axios from 'axios';
import * as cheerio from 'cheerio';
import { constants } from 'fs';
import { access, mkdir, readdir, readFile, writeFile } from 'fs/promises';
import { dirname } from 'path';

const BASE_URL = 'https://fencing.ophardt.online';
const ATHLETES_FILE = 'data/athletes.json';
const MATCHES_DIR = 'data/matches';

function athleteSlug(url) {
  return url.replace(/\/$/, '').split('/').pop();
}

function athleteUrl(url) {
  return url.startsWith('http') ? url : `${BASE_URL}${url}`;
}

function extractAthleteId($) {
  const action = $('form[action*="athlete-matchdetails"]').attr('action');
  const fromForm = action?.match(/athlete-matchdetails\/(\d+)/)?.[1];
  if (fromForm) return fromForm;

  const backbiosa = $('a[href*="backbiosa="]').first().attr('href');
  return backbiosa?.match(/backbiosa=(\d+)/)?.[1] ?? null;
}

function extractSeasons($) {
  return $('select[name="match_seasons"] option')
    .map((_, option) => ({
      value: $(option).attr('value'),
      label: $(option).text().trim(),
    }))
    .get();
}

function parseEventCell($, cell) {
  const $cell = $(cell);
  const discipline = $cell.find('small').text().trim() || null;
  const $clone = $cell.clone();
  $clone.find('small').remove();
  const event = $clone.text().trim().replace(/\s+/g, ' ');
  return { event, discipline };
}

function parsePersonCell($, cell) {
  const $cell = $(cell);
  const $link = $cell.find('a').first();
  return {
    name: $cell.text().trim(),
    url: $link.attr('href') ?? null,
  };
}

function parseScore(text) {
  return Number(text.trim().replace(/^[VD]/i, ''));
}

function parseMatchTable(html) {
  const $ = cheerio.load(html);
  const rows = $('table').first().find('tr').toArray();
  const matches = [];

  for (const row of rows) {
    const cells = $(row).find('td').toArray();
    if (cells.length === 0) continue;

    const { event, discipline } = parseEventCell($, cells[1]);
    const winner = parsePersonCell($, cells[5]);
    const loser = parsePersonCell($, cells[8]);
    const winnerScore = parseScore($(cells[6]).text());
    const loserScore = parseScore($(cells[7]).text());

    const win = winner.url === null;
    const opponent = win ? loser : winner;

    matches.push({
      date: $(cells[0]).text().trim(),
      event,
      discipline,
      stage: $(cells[2]).text().trim(),
      round: $(cells[3]).text().trim(),
      match: $(cells[4]).text().trim(),
      opponent: opponent.name,
      opponentUrl: opponent.url,
      win,
      scoreOwn: win ? winnerScore : loserScore,
      scoreOpponent: win ? loserScore : winnerScore,
    });
  }

  return matches;
}

async function fetchMatchDetails(athleteId, season) {
  const url = `${BASE_URL}/en/biography/athlete-matchdetails/${athleteId}`;
  const { data: html } = await axios.post(
    url,
    new URLSearchParams({ match_seasons: season }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );
  return html;
}

async function loadAthletes() {
  return JSON.parse(await readFile(ATHLETES_FILE, 'utf8'));
}

export async function resolveAthlete(name) {
  const normalized = name.toLowerCase();
  let athletes;

  try {
    athletes = await loadAthletes();
  } catch {
    athletes = [];
  }

  const bySlug = athletes.find((a) => athleteSlug(a.url).toLowerCase() === normalized);
  if (bySlug) return bySlug;

  const byName = athletes.find((a) => a.name.toLowerCase() === normalized);
  if (byName) return byName;

  const byPartial = athletes.find((a) => a.name.toLowerCase().includes(normalized));
  if (byPartial) return byPartial;

  return { name, url: `/en/biography/athlete/${name}` };
}

export async function fetchMatchesForAthlete(athlete) {
  const url = athleteUrl(athlete.url);
  const slug = athleteSlug(athlete.url);
  const { data: bioHtml } = await axios.get(url);
  const $bio = cheerio.load(bioHtml);

  const athleteId = extractAthleteId($bio);
  if (!athleteId) {
    throw new Error(`Could not find athlete id on ${url}`);
  }

  const seasons = extractSeasons($bio);
  console.log(`Athlete id: ${athleteId}`);
  console.log(`Seasons: ${seasons.map((s) => `${s.value} (${s.label})`).join(', ')}`);

  const matches = [];

  for (const season of seasons) {
    const matchHtml = await fetchMatchDetails(athleteId, season.value);
    const seasonMatches = parseMatchTable(matchHtml);
    matches.push(...seasonMatches);
    console.log(`${season.label}: ${seasonMatches.length} matches`);
  }

  const outputPath = `data/matches/${slug}.json`;
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(matches, null, 2));

  console.log(`Wrote ${matches.length} matches to ${outputPath}`);
}

export async function fetchMatches(name) {
  const athlete = await resolveAthlete(name);
  await fetchMatchesForAthlete(athlete);
}

function matchOutputPath(slug) {
  return `data/matches/${slug}.json`;
}

async function matchFileExists(slug) {
  try {
    await access(matchOutputPath(slug), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function fetchAllMatches({ reload = false } = {}) {
  const athletes = await loadAthletes();
  for (const athlete of athletes) {
    const slug = athleteSlug(athlete.url);
    if (!reload && await matchFileExists(slug)) {
      console.log(`Skipping ${athlete.name} (${slug}), already loaded`);
      continue;
    }
    console.log(`\nFetching ${athlete.name} (${slug})...`);
    await fetchMatchesForAthlete(athlete);
  }
}

export async function listMatches(name) {
  const athlete = await resolveAthlete(name);
  const slug = athleteSlug(athlete.url);
  const outputPath = `data/matches/${slug}.json`;
  const matches = JSON.parse(await readFile(outputPath, 'utf8'));

  for (const match of matches) {
    const result = match.win ? 'W' : 'L';
    const score = `${match.scoreOwn}-${match.scoreOpponent}`;
    console.log(`${match.date} ${result} ${score} vs ${match.opponent}`);
  }
}

function dedupeMatches(matches) {
  const seen = new Set();
  const unique = [];
  for (const match of matches) {
    const key = JSON.stringify(match);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(match);
  }
  return unique;
}

export async function cleanupMatches() {
  const files = (await readdir(MATCHES_DIR)).filter((f) => f.endsWith('.json')).sort();
  const total = files.length;
  let totalRemoved = 0;
  let filesChanged = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const path = `${MATCHES_DIR}/${file}`;
    const matches = JSON.parse(await readFile(path, 'utf8'));
    const unique = dedupeMatches(matches);
    const removed = matches.length - unique.length;

    if (removed > 0) {
      await writeFile(path, JSON.stringify(unique, null, 2));
      totalRemoved += removed;
      filesChanged++;
    }

    const slug = file.replace(/\.json$/, '');
    const pct = (((i + 1) / total) * 100).toFixed(1);
    process.stdout.write(`\r${pct}% (${i + 1}/${total}) ${slug}`);
  }

  console.log();
  console.log(`Removed ${totalRemoved} duplicate${totalRemoved === 1 ? '' : 's'} from ${filesChanged} file${filesChanged === 1 ? '' : 's'}`);
}
