import { formatDateFinnish } from '../../../format-date.js';
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

function competitionKey(match) {
  return `${match.date}\0${match.event}\0${match.discipline ?? ''}`;
}

function summarizeCompetition(compMatches) {
  const roundMatches = compMatches.filter((m) => m.stage === 'Round');
  const deMatches = compMatches.filter((m) => m.stage === 'DE');
  const parts = [];

  if (roundMatches.length > 0) {
    const wins = roundMatches.filter((m) => m.win).length;
    const index = roundMatches.reduce((sum, m) => sum + m.scoreOwn - m.scoreOpponent, 0);
    const indexStr = index >= 0 ? `+${index}` : `${index}`;
    parts.push(`Pools ${wins}/${roundMatches.length} ${indexStr}`);
  }

  if (deMatches.length > 0) {
    const deWins = deMatches.filter((m) => m.win).length;
    parts.push(`DE ${deWins} win${deWins === 1 ? '' : 's'}`);
    const loss = deMatches.find((m) => !m.win);
    if (loss) {
      parts.push(`eliminated at ${loss.match}`);
    }
  }

  return parts.join(', ');
}

function competitionMedal(compMatches) {
  const deMatches = compMatches.filter((m) => m.stage === 'DE');
  if (deMatches.length === 0) return '';

  const lossRounds = deMatches
    .filter((m) => !m.win)
    .map((m) => deMatchNumber(m.match))
    .filter(Boolean);

  if (lossRounds.length === 0) return '🥇';

  const eliminatedAt = Math.min(...lossRounds);
  if (eliminatedAt === 2) return '🥈';
  if (eliminatedAt === 4) return '🥉';
  return '';
}

function deMatchNumber(matchCode) {
  return parseInt(matchCode.replace(/\D/g, ''), 10) || null;
}

function deMatchColor(matchCode) {
  const n = deMatchNumber(matchCode);
  if (!n) return '#166534';
  const minLog = 0;
  const maxLog = Math.log2(256);
  const log = Math.log2(n);
  const t = 1 - (log - minLog) / (maxLog - minLog);
  const lightness = 28 + t * 32;
  return `hsl(142, 42%, ${lightness.toFixed(0)}%)`;
}

function renderStageCell(match) {
  const td = document.createElement('td');
  td.className = 'stage-cell';
  if (match.stage === 'Round') {
    td.style.backgroundColor = '#284b63';
  } else if (match.stage === 'DE' && match.match) {
    const n = deMatchNumber(match.match);
    if (n) {
      td.textContent = String(n);
      td.style.backgroundColor = deMatchColor(match.match);
    }
  }
  return td;
}

function renderCompetitionRow(compMatches) {
  const first = compMatches[0];
  const tr = document.createElement('tr');
  tr.className = 'competition-row';
  const td = document.createElement('td');
  td.colSpan = 7;
  const label = [formatDateFinnish(first.date), first.event, first.discipline]
    .filter(Boolean)
    .join(' · ');
  const summary = summarizeCompetition(compMatches);
  const medal = competitionMedal(compMatches);
  td.textContent = `${label} — ${summary}${medal ? ` ${medal}` : ''}`;
  tr.appendChild(td);
  return tr;
}

function buildTableRows(filtered, allMatches, showCompetitionHeaders) {
  const competitionGroups = new Map();
  if (showCompetitionHeaders) {
    for (const match of allMatches) {
      const key = competitionKey(match);
      if (!competitionGroups.has(key)) competitionGroups.set(key, []);
      competitionGroups.get(key).push(match);
    }
  }

  const rows = [];
  let lastKey = null;
  for (const match of filtered) {
    const key = competitionKey(match);
    if (showCompetitionHeaders && key !== lastKey) {
      rows.push(renderCompetitionRow(competitionGroups.get(key)));
      lastKey = key;
    }
    rows.push(renderMatchRow(match));
  }
  return rows;
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

  tr.appendChild(renderStageCell(match));

  const cells = [
    formatDateFinnish(match.date),
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
          <th></th>
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
      const showCompetitionHeaders = !selectedOpponent;
      tbody.replaceChildren(...buildTableRows(filtered, matches, showCompetitionHeaders));
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
