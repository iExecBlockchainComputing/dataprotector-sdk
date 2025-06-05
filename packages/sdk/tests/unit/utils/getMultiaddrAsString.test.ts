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

  describe('When giving hex encoded URL', () => {
    it('should return a human readable URL', () => {
      // --- GIVEN
      const multiaddrAsHexString =
        '0x68747470733a2f2f617277656176652e6e65742f6431426e58434f667430654d387573576467643137327a4c616b7452546d6a6d547032526f582d4762314d';

      // --- WHEN
      const decodedMultiaddr = getMultiaddrAsString({
        multiaddrAsHexString,
      });

      // --- THEN
      expect(decodedMultiaddr).toEqual(
        'https://arweave.net/d1BnXCOft0eM8usWdgd172zLaktRTmjmTp2RoX-Gb1M'
      );
    });
  });
});
