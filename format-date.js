import { format, isValid, parse, parseISO } from 'date-fns';

const ISO_DATE = 'yyyy-MM-dd';
const FINNISH_DATE = 'dd.MM.yyyy';
const PARSE_REF = new Date(2020, 0, 1);

function toIso(date) {
  return format(date, ISO_DATE);
}

export function parseDateToIso(dateStr) {
  if (!dateStr) return dateStr;

  const trimmed = dateStr.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = parseISO(trimmed);
    return isValid(date) ? toIso(date) : trimmed;
  }

  const finnish = parse(trimmed, 'd.M.yyyy', PARSE_REF);
  if (isValid(finnish)) return toIso(finnish);

  if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(trimmed)) {
    const usShortYear = parse(trimmed, 'M/d/yy', PARSE_REF);
    if (isValid(usShortYear)) return toIso(usShortYear);
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const usLongYear = parse(trimmed, 'M/d/yyyy', PARSE_REF);
    if (isValid(usLongYear)) return toIso(usLongYear);
  }

  return trimmed;
}

export function formatDateFinnish(isoDate) {
  if (!isoDate) return isoDate;

  const date = parseISO(isoDate);
  if (!isValid(date)) return isoDate;

  return format(date, FINNISH_DATE);
}
