export function parseDateToIso(dateStr) {
  if (!dateStr) return dateStr;

  const trimmed = dateStr.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const finnish = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (finnish) {
    const [, day, month, year] = finnish;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (us) {
    const [, month, day, yearPart] = us;
    const year =
      yearPart.length === 2 ? 2000 + Number.parseInt(yearPart, 10) : Number.parseInt(yearPart, 10);
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return trimmed;
}

export function formatDateFinnish(isoDate) {
  if (!isoDate) return isoDate;

  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return isoDate;

  const [, year, month, day] = m;
  return `${day}.${month}.${year}`;
}
