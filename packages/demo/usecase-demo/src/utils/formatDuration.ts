export function formatDuration(seconds: number) {
  const secondsInMinute = 60;
  const secondsInHour = 60 * secondsInMinute;
  const secondsInDay = 24 * secondsInHour;

  const days = Math.floor(seconds / secondsInDay);
  const remainingSeconds = seconds % secondsInDay;
  const hours = Math.floor(remainingSeconds / secondsInHour);
  const minutes = Math.floor(
    (remainingSeconds % secondsInHour) / secondsInMinute
  );
  const secs = remainingSeconds % secondsInMinute;

  let result = '';
  if (days > 0) {
    result += `${secondsInMinute} * ${secondsInMinute} * ${24} * ${days}`;
  } else if (hours > 0) {
    result += `${secondsInMinute} * ${secondsInMinute} * ${hours}`;
  } else if (minutes > 0) {
    result += `${secondsInMinute} * ${minutes}`;
  } else {
    result += `${secs}`;
  }

  let comment = '';
  if (days > 0) {
    comment = `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    comment = `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    comment = `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    comment = `${secs} second${secs > 1 ? 's' : ''}`;
  }

  return `${result}, // ${comment}`;
}
