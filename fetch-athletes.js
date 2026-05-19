import axios from 'axios';
import * as cheerio from 'cheerio';
import { createWriteStream } from 'fs';
import { readFile } from 'fs/promises';
import { finished } from 'stream/promises';

const BASE_URL = 'https://fencing.ophardt.online/en/search/biographies';
const OUTPUT = 'data/athletes.json';

function buildUrl(search) {
  const params = new URLSearchParams({
    search,
    'search-firstname': '',
    'search-nation': 'FIN',
    'search-gender': '',
  });
  return `${BASE_URL}?${params}`;
}

function* twoLetterTerms() {
  for (let a = 97; a <= 122; a++) {
    for (let b = 97; b <= 122; b++) {
      yield String.fromCharCode(a, b);
    }
  }
}

async function scrape(url) {
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  const cards = $('.card');
  return cards.map((i, card) => {
    const $card = $(card);
    const image = $card.find('img').attr('src');
    return {
      name: $card.find('h6').text().trim(),
      image: image === '/img/nopicture.jpg' ? null : image,
      club: $card.find('p.card-text').first().text().trim(),
      url: $card.find('a').attr('href'),
    };
  }).get();
}

export async function fetchAthletes() {
  const searchTerms = [...twoLetterTerms()];
  const total = searchTerms.length;
  const out = createWriteStream(OUTPUT);
  let first = true;
  out.write('[');

  for (let i = 0; i < searchTerms.length; i++) {
    const athletes = await scrape(buildUrl(searchTerms[i]));
    for (const athlete of athletes) {
      if (!first) out.write(',');
      first = false;
      out.write(JSON.stringify(athlete));
    }
    const pct = (((i + 1) / total) * 100).toFixed(1);
    process.stdout.write(`\r${pct}% (${i + 1}/${total})`);
  }

  out.write(']');
  out.end();
  await finished(out);
  console.log();
}

export async function listAthletes() {
  const athletes = JSON.parse(await readFile(OUTPUT, 'utf8'));
  for (const athlete of athletes) {
    const club = athlete.club ? ` (${athlete.club})` : '';
    console.log(`${athlete.name}${club}`);
  }
}
