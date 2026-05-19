import { athleteSlug } from '../slug.js';
import { findAthlete, loadMatches } from '../data.js';

function opponentKey(match) {
  return match.opponentUrl ?? match.opponent;
}

function opponentDisplayName(match) {
  if (match.opponentUrl) {
    const athlete = findAthlete(athleteSlug(match.opponentUrl));
    if (athlete) return athlete.name;
  }
  return match.opponent.replace(/\s*\([^)]+\)\s*$/, '').trim();
}

function buildOpponentStats(matches) {
  const stats = new Map();
  for (const match of matches) {
    const key = opponentKey(match);
    if (!stats.has(key)) {
      stats.set(key, { key, name: opponentDisplayName(match), wins: 0, total: 0 });
    }
    const entry = stats.get(key);
    entry.total++;
    if (match.win) entry.wins++;
  }
  return [...stats.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function opponentLink(opponentUrl, opponent) {
  if (!opponentUrl) return opponent;
  const slug = athleteSlug(opponentUrl);
  const a = document.createElement('a');
  a.href = `#/fencer/${slug}`;
  a.textContent = opponent;
  return a;
}

function renderMatchRow(match) {
  const tr = document.createElement('tr');
  tr.className = match.win ? 'win' : 'loss';

  const cells = [
    match.date,
    match.event,
    match.discipline ?? '',
    null,
    match.win ? 'W' : 'L',
    `${match.scoreOwn}–${match.scoreOpponent}`,
  ];

  for (const [i, value] of cells.entries()) {
    const td = document.createElement('td');
    if (i === 3) {
      td.appendChild(opponentLink(match.opponentUrl, match.opponent));
    } else {
      td.textContent = value;
    }
    tr.appendChild(td);
  }

  return tr;
}

export async function renderFencerPage(root, slug) {
  const athlete = findAthlete(slug);
  const name = athlete?.name ?? slug;
  const club = athlete?.club ?? '';

  root.innerHTML = `
    <header class="page-header">
      <a href="#/" class="back-link">← All fencers</a>
      <div class="fencer-header">
        ${athlete?.image ? `<img class="fencer-photo" src="${athlete.image}" alt="" />` : ''}
        <div>
          <h1>${name}</h1>
          ${club ? `<p class="fencer-club">${club}</p>` : ''}
        </div>
      </div>
    </header>
    <p class="loading">Loading matches…</p>
  `;

  const loading = root.querySelector('.loading');

  try {
    const matches = await loadMatches(slug);

    if (!matches) {
      loading.textContent = 'No matches cached for this fencer.';
      loading.className = 'empty-state';
      return;
    }

    loading.remove();

    const opponentStats = buildOpponentStats(matches);
    let selectedOpponent = '';

    const filters = document.createElement('div');
    filters.className = 'filters';
    filters.innerHTML = `
      <label>
        Opponent
        <select id="opponent-filter">
          <option value="">All opponents</option>
        </select>
      </label>
    `;

    const opponentSelect = filters.querySelector('#opponent-filter');
    for (const { key, name, wins, total } of opponentStats) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = `${name} (${wins} / ${total})`;
      opponentSelect.appendChild(opt);
    }

    const summary = document.createElement('p');
    summary.className = 'result-count';

    const table = document.createElement('table');
    table.className = 'match-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Date</th>
          <th>Event</th>
          <th>Discipline</th>
          <th>Opponent</th>
          <th>Result</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    const update = () => {
      const filtered = selectedOpponent
        ? matches.filter((m) => opponentKey(m) === selectedOpponent)
        : matches;
      tbody.replaceChildren(...filtered.map(renderMatchRow));
      summary.textContent = `${filtered.length} match${filtered.length === 1 ? '' : 'es'}`;
    };

    opponentSelect.addEventListener('change', () => {
      selectedOpponent = opponentSelect.value;
      update();
    });

    update();

    root.appendChild(filters);
    root.appendChild(summary);
    root.appendChild(table);
  } catch (err) {
    loading.textContent = err.message;
    loading.className = 'error-state';
  }
}
