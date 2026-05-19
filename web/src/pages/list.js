import { athleteSlug } from '../slug.js';
import { navigate } from '../router.js';

function uniqueClubs(athletes) {
  return [...new Set(athletes.map((a) => a.club).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function filterAthletes(athletes, club, query) {
  const q = query.trim().toLowerCase();
  return athletes.filter((a) => {
    if (club && a.club !== club) return false;
    if (q && !a.name.toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderAthlete(athlete) {
  const slug = athleteSlug(athlete.url);
  const li = document.createElement('li');
  li.className = 'athlete-card';
  li.tabIndex = 0;
  li.addEventListener('click', () => navigate(`/fencer/${slug}`));
  li.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/fencer/${slug}`);
    }
  });

  if (athlete.image) {
    const img = document.createElement('img');
    img.className = 'athlete-photo';
    img.src = athlete.image;
    img.alt = '';
    li.appendChild(img);
  }

  const info = document.createElement('div');
  info.className = 'athlete-info';

  const name = document.createElement('span');
  name.className = 'athlete-name';
  name.textContent = athlete.name;
  info.appendChild(name);

  if (athlete.club) {
    const club = document.createElement('span');
    club.className = 'athlete-club';
    club.textContent = athlete.club;
    info.appendChild(club);
  }

  li.appendChild(info);
  return li;
}

export function renderListPage(root, athletes) {
  let club = '';
  let query = '';

  root.innerHTML = `
    <header class="page-header">
      <h1>Finnish Fencers</h1>
    </header>
    <div class="filters">
      <label>
        Search
        <input type="search" id="name-search" placeholder="Name..." autocomplete="off" />
      </label>
      <label>
        Club
        <select id="club-filter">
          <option value="">All clubs</option>
        </select>
      </label>
    </div>
    <p class="result-count"></p>
    <ul class="athlete-list"></ul>
  `;

  const clubSelect = root.querySelector('#club-filter');
  const searchInput = root.querySelector('#name-search');
  const list = root.querySelector('.athlete-list');
  const count = root.querySelector('.result-count');

  for (const c of uniqueClubs(athletes)) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    clubSelect.appendChild(opt);
  }

  const update = () => {
    const filtered = filterAthletes(athletes, club, query);
    list.replaceChildren(...filtered.map(renderAthlete));
    count.textContent = `${filtered.length} fencer${filtered.length === 1 ? '' : 's'}`;
  };

  clubSelect.addEventListener('change', () => {
    club = clubSelect.value;
    update();
  });

  searchInput.addEventListener('input', () => {
    query = searchInput.value;
    update();
  });

  update();
}
