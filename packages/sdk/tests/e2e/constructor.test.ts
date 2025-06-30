import { describe, it, expect } from '@jest/globals';
import { IExecDataProtector } from '../../src/index.js';
import { getTestConfig } from '../test-utils.js';

describe('When instantiating SDK without a signer', () => {
  describe('When calling a read method', () => {
    it('should work as expected', async () => {
      // --- GIVEN
      const dataProtector = new IExecDataProtector(...getTestConfig());

      // --- WHEN/THEN
      await expect(
        dataProtector.core.getProtectedData()
      ).resolves.not.toThrow();
    });
  });
});
