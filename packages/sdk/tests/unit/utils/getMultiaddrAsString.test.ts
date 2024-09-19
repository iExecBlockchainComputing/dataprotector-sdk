import { getMultiaddrAsString } from '../../../src/utils/getMultiaddrAsString.js';

describe('getMultiaddrAsString', () => {
  describe('When giving undefined', () => {
    it('should not crash and return undefined', () => {
      // --- GIVEN
      const multiaddrAsHexString = undefined;

      // --- WHEN
      const decodedMultiaddr = getMultiaddrAsString({
        multiaddrAsHexString,
      });

      // --- THEN
      expect(decodedMultiaddr).toBeUndefined();
    });
  });

  describe('When giving an invalid bytes value', () => {
    it('should not crash and return undefined', () => {
      // --- GIVEN
      const multiaddrAsHexString = 'abc';

      // --- WHEN
      const decodedMultiaddr = getMultiaddrAsString({
        multiaddrAsHexString,
      });

      // --- THEN
      expect(decodedMultiaddr).toBeUndefined();
    });
  });

  describe('When giving a machine readable multiaddr', () => {
    it('should return a human readable multiaddr', () => {
      // --- GIVEN
      const multiaddrAsHexString =
        '0xa50322122038d76d7059153e707cd0951cf2ff64d17f69352a285503800c7787c3af0c63dd';

      // --- WHEN
      const decodedMultiaddr = getMultiaddrAsString({
        multiaddrAsHexString,
      });

      // --- THEN
      expect(decodedMultiaddr).toEqual(
        '/p2p/QmSAY4mYRkCvdDzcD3A3sDeN5nChyn82p88xt7HhYHqXfi'
      );
    });
  });
});
