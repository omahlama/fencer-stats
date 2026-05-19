import { athleteSlug } from '../slug.js';
import { findAthlete, loadMatches } from '../data.js';

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
    tbody.replaceChildren(...matches.map(renderMatchRow));

    const summary = document.createElement('p');
    summary.className = 'result-count';
    summary.textContent = `${matches.length} match${matches.length === 1 ? '' : 'es'}`;

    root.appendChild(summary);
    root.appendChild(table);
  } catch (err) {
    loading.textContent = err.message;
    loading.className = 'error-state';
  }
}
