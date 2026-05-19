(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=null;async function t(){if(e)return e;let t=await fetch(`/data/athletes.json`);if(!t.ok)throw Error(`Failed to load athletes`);return e=await t.json(),e}function n(t){return e?e.find(e=>e.url.replace(/\/$/,``).split(`/`).pop()===t)??null:null}async function r(e){let t=await fetch(`/data/matches/${e}.json`);if(t.status===404)return null;if(!t.ok)throw Error(`Failed to load matches for ${e}`);return t.json()}var i=[];function a(e,t){i.push({pattern:e,handler:t})}function o(e){window.location.hash=e.startsWith(`#`)?e:`#${e}`}function s(){let e=()=>{let e=window.location.hash.slice(1)||`/`;for(let{pattern:t,handler:n}of i){let r=e.match(t);if(r){n(r);return}}o(`/`)};window.addEventListener(`hashchange`,e),e()}function c(e){return e.replace(/\/$/,``).split(`/`).pop()}function l(e){return[...new Set(e.map(e=>e.club).filter(Boolean))].sort((e,t)=>e.localeCompare(t))}function u(e,t,n){let r=n.trim().toLowerCase();return e.filter(e=>!(t&&e.club!==t||r&&!e.name.toLowerCase().includes(r)))}function d(e){let t=c(e.url),n=document.createElement(`li`);if(n.className=`athlete-card`,n.tabIndex=0,n.addEventListener(`click`,()=>o(`/fencer/${t}`)),n.addEventListener(`keydown`,e=>{(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),o(`/fencer/${t}`))}),e.image){let t=document.createElement(`img`);t.className=`athlete-photo`,t.src=e.image,t.alt=``,n.appendChild(t)}let r=document.createElement(`div`);r.className=`athlete-info`;let i=document.createElement(`span`);if(i.className=`athlete-name`,i.textContent=e.name,r.appendChild(i),e.club){let t=document.createElement(`span`);t.className=`athlete-club`,t.textContent=e.club,r.appendChild(t)}return n.appendChild(r),n}function f(e,t){let n=``,r=``;e.innerHTML=`
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
  `;let i=e.querySelector(`#club-filter`),a=e.querySelector(`#name-search`),o=e.querySelector(`.athlete-list`),s=e.querySelector(`.result-count`);for(let e of l(t)){let t=document.createElement(`option`);t.value=e,t.textContent=e,i.appendChild(t)}let c=()=>{let e=u(t,n,r);o.replaceChildren(...e.map(d)),s.textContent=`${e.length} fencer${e.length===1?``:`s`}`};i.addEventListener(`change`,()=>{n=i.value,c()}),a.addEventListener(`input`,()=>{r=a.value,c()}),c()}function p(e){return e.opponentUrl??e.opponent}function m(e){if(e.opponentUrl){let t=n(c(e.opponentUrl));if(t)return t.name}return e.opponent.replace(/\s*\([^)]+\)\s*$/,``).trim()}function h(e){let t=new Map;for(let n of e){let e=p(n);t.has(e)||t.set(e,{key:e,name:m(n),wins:0,total:0});let r=t.get(e);r.total++,n.win&&r.wins++}return[...t.values()].sort((e,t)=>e.name.localeCompare(t.name))}function g(e){return`${e.date}\0${e.event}\0${e.discipline??``}`}function _(e){let t=e.filter(e=>e.stage===`Round`),n=e.filter(e=>e.stage===`DE`),r=[];if(t.length>0){let e=t.filter(e=>e.win).length,n=t.reduce((e,t)=>e+t.scoreOwn-t.scoreOpponent,0),i=n>=0?`+${n}`:`${n}`;r.push(`Pools ${e}/${t.length} ${i}`)}if(n.length>0){let e=n.filter(e=>e.win).length;r.push(`DE ${e} win${e===1?``:`s`}`);let t=n.find(e=>!e.win);t&&r.push(`eliminated at ${t.match}`)}return r.join(`, `)}function v(e){let t=e.filter(e=>e.stage===`DE`);if(t.length===0)return``;let n=t.filter(e=>!e.win).map(e=>y(e.match)).filter(Boolean);if(n.length===0)return`🥇`;let r=Math.min(...n);return r===2?`🥈`:r===4?`🥉`:``}function y(e){return parseInt(e.replace(/\D/g,``),10)||null}function b(e){let t=y(e);if(!t)return`#166534`;let n=Math.log2(256);return`hsl(142, 42%, ${(28+(1-(Math.log2(t)-0)/(n-0))*32).toFixed(0)}%)`}function x(e){let t=document.createElement(`td`);if(t.className=`stage-cell`,e.stage===`Round`)t.style.backgroundColor=`#284b63`;else if(e.stage===`DE`&&e.match){let n=y(e.match);n&&(t.textContent=String(n),t.style.backgroundColor=b(e.match))}return t}function S(e){let t=e[0],n=document.createElement(`tr`);n.className=`competition-row`;let r=document.createElement(`td`);r.colSpan=7;let i=[t.date,t.event,t.discipline].filter(Boolean).join(` · `),a=_(e),o=v(e);return r.textContent=`${i} — ${a}${o?` ${o}`:``}`,n.appendChild(r),n}function C(e,t,n){let r=new Map;if(n)for(let e of t){let t=g(e);r.has(t)||r.set(t,[]),r.get(t).push(e)}let i=[],a=null;for(let t of e){let e=g(t);n&&e!==a&&(i.push(S(r.get(e))),a=e),i.push(T(t))}return i}function w(e,t){if(!e)return t;let n=c(e),r=document.createElement(`a`);return r.href=`#/fencer/${n}`,r.textContent=t,r}function T(e){let t=document.createElement(`tr`);t.className=e.win?`win`:`loss`,t.appendChild(x(e));let n=[e.date,e.event,e.discipline??``,null,e.win?`W`:`L`,`${e.scoreOwn}–${e.scoreOpponent}`];for(let[r,i]of n.entries()){let n=document.createElement(`td`);r===3?n.appendChild(w(e.opponentUrl,e.opponent)):n.textContent=i,t.appendChild(n)}return t}async function E(e,t){let i=n(t),a=i?.name??t,o=i?.club??``;e.innerHTML=`
    <header class="page-header">
      <a href="#/" class="back-link">← All fencers</a>
      <div class="fencer-header">
        ${i?.image?`<img class="fencer-photo" src="${i.image}" alt="" />`:``}
        <div>
          <h1>${a}</h1>
          ${o?`<p class="fencer-club">${o}</p>`:``}
        </div>
      </div>
    </header>
    <p class="loading">Loading matches…</p>
  `;let s=e.querySelector(`.loading`);try{let n=await r(t);if(!n){s.textContent=`No matches cached for this fencer.`,s.className=`empty-state`;return}s.remove();let i=h(n),a=``,o=document.createElement(`div`);o.className=`filters`,o.innerHTML=`
      <label>
        Opponent
        <select id="opponent-filter">
          <option value="">All opponents</option>
        </select>
      </label>
    `;let c=o.querySelector(`#opponent-filter`);for(let{key:e,name:t,wins:n,total:r}of i){let i=document.createElement(`option`);i.value=e,i.textContent=`${t} (${n} / ${r})`,c.appendChild(i)}let l=document.createElement(`p`);l.className=`result-count`;let u=document.createElement(`table`);u.className=`match-table`,u.innerHTML=`
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
    `;let d=u.querySelector(`tbody`),f=()=>{let e=a?n.filter(e=>p(e)===a):n,t=!a;d.replaceChildren(...C(e,n,t)),l.textContent=`${e.length} match${e.length===1?``:`es`}`};c.addEventListener(`change`,()=>{a=c.value,f()}),f(),e.appendChild(o),e.appendChild(l),e.appendChild(u)}catch(e){s.textContent=e.message,s.className=`error-state`}}var D=document.getElementById(`app`);a(/^\/$/,async()=>{D.innerHTML=`<p class="loading">Loading fencers…</p>`;try{f(D,await t())}catch(e){D.innerHTML=`<p class="error-state">${e.message}</p>`}}),a(/^\/fencer\/([^/]+)$/,async([,e])=>{await t(),await E(D,e)}),s();