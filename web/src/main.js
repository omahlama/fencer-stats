import { loadAthletes } from './data.js';
import { route, startRouter } from './router.js';
import { renderListPage } from './pages/list.js';
import { renderFencerPage } from './pages/fencer.js';

const app = document.getElementById('app');

route(/^\/$/, async () => {
  app.innerHTML = '<p class="loading">Loading fencers…</p>';
  try {
    const athletes = await loadAthletes();
    renderListPage(app, athletes);
  } catch (err) {
    app.innerHTML = `<p class="error-state">${err.message}</p>`;
  }
});

route(/^\/fencer\/([^/]+)$/, async ([, slug]) => {
  await loadAthletes();
  await renderFencerPage(app, slug);
});

startRouter();
