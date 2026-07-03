/**
 * Events page — client-side search & category filter.
 */
(function () {
  'use strict';

  const feed = document.getElementById('events-feed');
  const searchInput = document.getElementById('events-search');
  const categoryFilter = document.getElementById('events-category-filter');
  if (!feed) return;

  const cards = Array.prototype.slice.call(feed.querySelectorAll('.event-card'));

  function normalizeCategory(text) {
    return String(text || '').trim().toLowerCase();
  }

  function cardMatches(card) {
    const q = (searchInput && searchInput.value || '').trim().toLowerCase();
    const cat = categoryFilter ? categoryFilter.value : 'all';
    const title = (card.querySelector('.event-title') || {}).textContent || '';
    const summary = (card.querySelector('.event-summary') || {}).textContent || '';
    const category = normalizeCategory(
      (card.querySelector('.event-category') || {}).textContent
    );

    if (cat !== 'all' && category !== cat) return false;
    if (!q) return true;
    return (title + ' ' + summary + ' ' + category).toLowerCase().indexOf(q) !== -1;
  }

  function applyFilters() {
    let visible = 0;
    cards.forEach(function (card) {
      const show = cardMatches(card);
      card.hidden = !show;
      if (show) visible++;
    });

    let empty = document.getElementById('events-empty');
    if (!empty) {
      empty = document.createElement('p');
      empty.id = 'events-empty';
      empty.className = 'events-empty';
      feed.appendChild(empty);
    }
    empty.hidden = visible > 0;
    empty.textContent = 'No events match your filters.';
  }

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);

  const loadMore = document.getElementById('events-load-more');
  if (loadMore) {
    loadMore.addEventListener('click', function () {
      loadMore.textContent = "That's all for now!";
      loadMore.disabled = true;
    });
  }
})();
