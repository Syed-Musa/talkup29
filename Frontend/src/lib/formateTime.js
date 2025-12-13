export const formateTime = (dateString) => {
    if (!dateString) return "Offline";

  const date = new Date(dateString);
  const now = new Date();

  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);

  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  // ----- Less than 1 minute -----
  if (diffSec < 60) return "just now";

  // ----- Minutes -----
  if (diffMin < 60) return `${diffMin} min ago`;

  // ----- Hours -----
  if (diffHr < 24) return `${diffHr} hr ago`;

  // **Today**
  if (isSameDay) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  // **Yesterday**
  if (isYesterday) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  // **Older than yesterday**
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return `${date.toLocaleDateString([], options)} at ${time}`;
}