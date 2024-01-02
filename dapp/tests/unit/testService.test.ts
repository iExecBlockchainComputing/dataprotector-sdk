import { testVariable } from '../../src/testService.js';

describe('index.ts', () => {
  it('should be Hello dapp!', () => {
    expect(testVariable).toBe('Hello dapp!');
  });
});
