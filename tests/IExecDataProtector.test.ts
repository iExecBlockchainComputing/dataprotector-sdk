import { describe, it, expect } from '@jest/globals';
import { IExecDataProtector } from '../dist/index';

describe('IExecDataProtector()', () => {
  it('throw when instantiated with an invalid ethProvider', async () => {
    const invalidProvider = null;
    expect(() => new IExecDataProtector(invalidProvider)).toThrow(
      Error('Unsupported ethProvider')
    );
  });
});
