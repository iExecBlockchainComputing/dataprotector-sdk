import { describe, it, expect, beforeEach } from '@jest/globals';
import { IExecDataProtector } from '../dist/index';
import { ValidationError, WorkflowError } from '../dist/utils/errors';
import { Wallet } from 'ethers';
import { getSignerFromPrivateKey } from 'iexec/utils';

describe('IExecDataProtector()', () => {
  it('throw when instantiated with an invalid ethProvider', async () => {
    const invalidProvider = null;
    expect(() => new IExecDataProtector(invalidProvider)).toThrow(
      Error('Unsupported ethProvider')
    );
  });

  describe('when a valid provider is passed', () => {
    let dataProtector: IExecDataProtector;
    let wallet: Wallet;
    beforeEach(async () => {
      wallet = Wallet.createRandom();
      dataProtector = new IExecDataProtector(
        getSignerFromPrivateKey('bellecour', wallet.privateKey)
      );
    });
    describe('protectDataObservable()', () => {
      it('throw immediately if the data is not suitable', () => {
        expect(() =>
          dataProtector.protectDataObservable({
            data: {
              'invalid.key': 'value',
            },
          })
        ).toThrow(new ValidationError('Unsupported special character in key'));
      });
      describe('subscribe()', () => {
        it('calls error if the data schema cannot be extracted', async () => {
          const observable = dataProtector.protectDataObservable({
            data: {
              unknownBytes: Buffer.from([0x01, 0x01, 0x01, 0x01]),
            },
          });
          const messages: Array<any> = [];
          let completed = false;
          let error: any = undefined;
          await new Promise<void>((resolve) => {
            observable.subscribe(
              (message: any) => messages.push(message),
              (err) => {
                error = err;
                resolve();
              },
              () => {
                completed = true;
                resolve();
              }
            );
          });
          expect(completed).toBe(false);
          expect(error).toBeInstanceOf(WorkflowError);
          expect(error.message).toBe('Failed to extract data schema');
          expect(error.originalError).toStrictEqual(
            new Error('Failed to detect mime type')
          );
        });
        it('calls error if the data cannot be serialized', async () => {
          const observable = dataProtector.protectDataObservable({
            data: {
              unsupportedNumber: 1.1,
            },
          });
          const messages: Array<any> = [];
          let completed = false;
          let error: any = undefined;
          await new Promise<void>((resolve) => {
            observable.subscribe(
              (message: any) => messages.push(message),
              (err) => {
                error = err;
                resolve();
              },
              () => {
                completed = true;
                resolve();
              }
            );
          });
          expect(completed).toBe(false);
          expect(error).toBeInstanceOf(WorkflowError);
          expect(error.message).toBe('Failed to serialize data object');
          expect(error.originalError).toStrictEqual(
            new Error('Unsupported non safe integer number')
          );
        });
      });
    });
    describe('protectData()', () => {
      it('throw if the data is not suitable', async () => {
        await expect(() =>
          dataProtector.protectData({
            data: {
              'invalid.key': 'value',
            },
          })
        ).rejects.toThrow(
          new ValidationError('Unsupported special character in key')
        );
      });
      it('throw if the data schema cannot be extracted', async () => {
        await expect(() =>
          dataProtector.protectData({
            data: {
              unknownBytes: Buffer.from([0x01, 0x01, 0x01, 0x01]),
            },
          })
        ).rejects.toThrow(
          new WorkflowError('Failed to extract data schema', new Error())
        );
      });
      it('throw if the data contains unsupported values', async () => {
        await expect(() =>
          dataProtector.protectData({
            data: {
              unsupportedNumber: 1.1,
            },
          })
        ).rejects.toThrow(
          new WorkflowError('Failed to serialize data object', new Error())
        );
      });
    });
  });
});
