import { getEventFromLogs } from '../../../src/utils/getEventFromLogs.js';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('getEventFromLogs', () => {
  let mockContract;
  let mockEventFragment;
  let logs;

  beforeEach(() => {
    // Mock the event fragment
    mockEventFragment = {
      topicHash:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    };

    // Mock the contract interface
    mockContract = {
      getEvent: jest.fn().mockReturnValue({
        fragment: mockEventFragment,
      }),
      interface: {
        decodeEventLog: jest.fn(),
      },
    };

    // Mock the logs
    logs = [
      {
        topics: [
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        ],
        data: '0xdata',
        args: null, // Simulating a non-decoded log
      },
    ];
  });

  it('should throw an error if the event filter is not found', () => {
    mockContract.getEvent.mockReturnValue(null);

    expect(() =>
      getEventFromLogs({
        contract: mockContract,
        eventName: 'NonExistentEvent',
        logs,
      })
    ).toThrow('Event filter not found for NonExistentEvent');
  });

  it('should throw an error if the event is not found in logs', () => {
    logs = []; // No logs

    expect(() =>
      getEventFromLogs({ contract: mockContract, eventName: 'TestEvent', logs })
    ).toThrow('Event TestEvent not found in logs');
  });

  it('should return the event if it is already decoded', () => {
    const decodedLog = {
      ...logs[0],
      args: { someArg: 'value' }, // Simulating an already decoded log
    };

    logs[0] = decodedLog;

    const result = getEventFromLogs({
      contract: mockContract,
      eventName: 'TestEvent',
      logs,
    });
    expect(result).toEqual(decodedLog);
  });

  it('should decode the event if it is not already decoded', () => {
    const decodedArgs = { someArg: 'value' };
    mockContract.interface.decodeEventLog.mockReturnValue(decodedArgs);

    const result = getEventFromLogs({
      contract: mockContract,
      eventName: 'TestEvent',
      logs,
    });

    expect(result.args).toEqual(decodedArgs);
    expect(mockContract.interface.decodeEventLog).toHaveBeenCalledWith(
      mockEventFragment,
      logs[0].data,
      logs[0].topics
    );
  });

  it('should throw an error if decoding the event fails', () => {
    mockContract.interface.decodeEventLog.mockImplementation(() => {
      throw new Error('Decoding failed');
    });

    expect(() =>
      getEventFromLogs({ contract: mockContract, eventName: 'TestEvent', logs })
    ).toThrow('Failed to decode event TestEvent: Decoding failed');
  });
});
