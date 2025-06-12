import { describe, it } from '@jest/globals';
import { ARWEAVE_FREE_UPLOAD_MAX_SIZE } from '../../../src/config/config.js';
import * as arweave from '../../../src/services/arweave.js';

describe('arweave.add()', () => {
  describe('when content to upload is too large', () => {
    it('throws an error', async () => {
      const content = Buffer.alloc(ARWEAVE_FREE_UPLOAD_MAX_SIZE, 0);
      await expect(arweave.add(content)).rejects.toThrow(
        Error('Arweave upload 100kb size limit reached')
      );
    });
  });
});
