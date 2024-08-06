export const getEventFromLogs = ({ contract, eventName, logs }) => {
  const filter = contract.getEvent(eventName);
  if (!filter) {
    throw new Error(`Event filter not found for ${eventName}`);
  }

  const eventTopic = filter.fragment.topicHash;
  console.log('🚀 ~ getEventFromLogs ~ eventTopic:', eventTopic);

  const eventFound = logs.find((log) => log.topics[0] === eventTopic);
  console.log('🚀 ~ getEventFromLogs ~ eventFound:', eventFound);

  if (!eventFound) {
    throw new Error(`Event ${eventName} not found in logs`);
  }

  return eventFound;
};
