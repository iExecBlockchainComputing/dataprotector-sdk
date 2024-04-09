export const getEventFromLogs = (eventName, logs, { strict = true }) => {
  const eventFound = logs.find(log => log.eventName === eventName);
  if (!eventFound) {
    if (strict) throw new Error(`Unknown event ${eventName}`);
    return undefined;
  }
  return eventFound;
};
