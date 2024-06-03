import { describe, it, expect } from '@jest/globals';
import { IExecDataProtector } from '../../src/index.js';

describe('When instantiating SDK without a signer', () => {
  describe('When calling a read method', () => {
    it('should work as expected', async () => {
      // --- GIVEN
      const dataProtector = new IExecDataProtector();

      // --- WHEN/THEN
      await expect(
        dataProtector.core.getProtectedData()
      ).resolves.not.toThrow();
    });
  });
});
