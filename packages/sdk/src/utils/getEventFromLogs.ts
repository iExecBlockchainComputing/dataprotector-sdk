export const getEventFromLogs = ({ contract, eventName, logs }) => {
  const filter = contract.getEvent(eventName);
  if (!filter) {
    throw new Error(`Event filter not found for ${eventName}`);
  }

  const eventTopic = filter.fragment.topicHash;
  // Find the event in the logs based on the topic
  const eventFound = logs.find((log) => log.topics[0] === eventTopic);
  if (!eventFound) {
    throw new Error(`Event ${eventName} not found in logs`);
  }

  // Check if the event is already decoded
  if (eventFound.args) {
    return eventFound;
  }

  // If not decoded, decode the event
  try {
    return {
      ...eventFound,
      args: contract.interface.decodeEventLog(
        filter.fragment,
        eventFound.data,
        eventFound.topics
      ),
    };
  } catch (error) {
    throw new Error(`Failed to decode event ${eventName}: ${error.message}`);
  }
};
