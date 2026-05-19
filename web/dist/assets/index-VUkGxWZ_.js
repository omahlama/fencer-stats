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
  `;let i=e.querySelector(`#club-filter`),a=e.querySelector(`#name-search`),o=e.querySelector(`.athlete-list`),s=e.querySelector(`.result-count`);for(let e of l(t)){let t=document.createElement(`option`);t.value=e,t.textContent=e,i.appendChild(t)}let c=()=>{let e=u(t,n,r);o.replaceChildren(...e.map(d)),s.textContent=`${e.length} fencer${e.length===1?``:`s`}`};i.addEventListener(`change`,()=>{n=i.value,c()}),a.addEventListener(`input`,()=>{r=a.value,c()}),c()}function p(e,t){if(!e)return t;let n=c(e),r=document.createElement(`a`);return r.href=`#/fencer/${n}`,r.textContent=t,r}function m(e){let t=document.createElement(`tr`);t.className=e.win?`win`:`loss`;let n=[e.date,e.event,e.discipline??``,null,e.win?`W`:`L`,`${e.scoreOwn}–${e.scoreOpponent}`];for(let[r,i]of n.entries()){let n=document.createElement(`td`);r===3?n.appendChild(p(e.opponentUrl,e.opponent)):n.textContent=i,t.appendChild(n)}return t}async function h(e,t){let i=n(t),a=i?.name??t,o=i?.club??``;e.innerHTML=`
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
  `;let s=e.querySelector(`.loading`);try{let n=await r(t);if(!n){s.textContent=`No matches cached for this fencer.`,s.className=`empty-state`;return}s.remove();let i=document.createElement(`table`);i.className=`match-table`,i.innerHTML=`
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
    `,i.querySelector(`tbody`).replaceChildren(...n.map(m));let a=document.createElement(`p`);a.className=`result-count`,a.textContent=`${n.length} match${n.length===1?``:`es`}`,e.appendChild(a),e.appendChild(i)}catch(e){s.textContent=e.message,s.className=`error-state`}}var g=document.getElementById(`app`);a(/^\/$/,async()=>{g.innerHTML=`<p class="loading">Loading fencers…</p>`;try{f(g,await t())}catch(e){g.innerHTML=`<p class="error-state">${e.message}</p>`}}),a(/^\/fencer\/([^/]+)$/,async([,e])=>{await t(),await h(g,e)}),s();