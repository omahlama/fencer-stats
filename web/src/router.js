const routes = [];

export function route(pattern, handler) {
  routes.push({ pattern, handler });
}

export function navigate(path) {
  window.location.hash = path.startsWith('#') ? path : `#${path}`;
}

export function startRouter() {
  const run = () => {
    const hash = window.location.hash.slice(1) || '/';
    for (const { pattern, handler } of routes) {
      const match = hash.match(pattern);
      if (match) {
        handler(match);
        return;
      }
    }
    navigate('/');
  };

  window.addEventListener('hashchange', run);
  run();
}
