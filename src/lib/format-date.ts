// Lightweight date formatting helper for BCS timestamps
export function formatBCSTimestamp(isoOrDate: string | Date | null | undefined, locale?: string) {
  if (!isoOrDate) return null;
  try {
    const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
    if (!(d instanceof Date) || isNaN(d.getTime())) return String(isoOrDate);

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    // If future date, just show formatted date
    if (diffMs < 0) {
      return new Intl.DateTimeFormat(locale || undefined, {
        year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
      }).format(d);
    }

    const seconds = Math.round(diffMs / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);

    const rtf = new Intl.RelativeTimeFormat(locale || undefined, { numeric: 'auto' });

    // Recent thresholds: under 60 seconds -> "just now"; under 60 minutes -> minutes ago; under 24 hours -> hours ago
    if (seconds < 10) return 'just now';
    if (seconds < 60) return rtf.format(-seconds, 'second');
    if (minutes < 60) return rtf.format(-minutes, 'minute');
    if (hours < 24) return rtf.format(-hours, 'hour');

    // Determine Monday-based week range for "this week"
    const day = now.getDay(); // 0 (Sun) - 6 (Sat)
    const daysSinceMonday = (day === 0 ? 6 : day - 1);
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - daysSinceMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const inThisWeek = d >= monday && d <= sunday;

    if (inThisWeek) {
      // Show weekday name and time, e.g. "Tuesday, 3:12 PM"
      const weekday = new Intl.DateTimeFormat(locale || undefined, { weekday: 'long' }).format(d);
      const time = new Intl.DateTimeFormat(locale || undefined, { hour: 'numeric', minute: '2-digit' }).format(d);
      return `${weekday}, ${time}`;
    }

    // Else show date and time e.g. "Dec 2, 2025, 3:12 PM"
    return new Intl.DateTimeFormat(locale || undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(d);
  } catch (e) {
    return String(isoOrDate);
  }
}

export default formatBCSTimestamp;
