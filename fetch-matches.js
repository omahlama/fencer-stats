import axios from 'axios';
import * as cheerio from 'cheerio';
import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';

const ATHLETE_URL = 'https://fencing.ophardt.online/en/biography/athlete/calles-taponen-oscar';

function athleteSlug(url) {
  return url.replace(/\/$/, '').split('/').pop();
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
  const url = `https://fencing.ophardt.online/en/biography/athlete-matchdetails/${athleteId}`;
  const { data: html } = await axios.post(
    url,
    new URLSearchParams({ match_seasons: season }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );
  return html;
}

const slug = athleteSlug(ATHLETE_URL);
const { data: bioHtml } = await axios.get(ATHLETE_URL);
const $bio = cheerio.load(bioHtml);

const athleteId = extractAthleteId($bio);
if (!athleteId) {
  throw new Error(`Could not find athlete id on ${ATHLETE_URL}`);
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
