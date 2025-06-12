import { AddressInfo } from 'net';
import express from 'express';

// stub for https://github.com/iExecBlockchainComputing/iexec-arweave-api
const app = express();
app.use('/upload', (req, res) => {
  const fileId = 'd1BnXCOft0eM8usWdgd172zLaktRTmjmTp2RoX-Gb1M';
  res
    .status(200)
    .json({ arweaveId: fileId, url: `https://arweave.net/${fileId}` });
});

export type ArweaveUploadStubServer = {
  url: string;
  stop: () => Promise<void>;
};

export const getArweaveUploadStubServer: () => Promise<ArweaveUploadStubServer> =
  async () =>
    new Promise((resolve, reject) => {
      const server = app.listen((listenErr) => {
        if (listenErr) {
          reject(listenErr);
        } else {
          const addressInfo = server.address() as AddressInfo;
          const url = `http://127.0.0.1:${addressInfo.port}`;
          const stop = () =>
            new Promise<void>((res, rej) =>
              server.close((closeErr) => {
                if (closeErr) {
                  rej(closeErr);
                } else {
                  res();
                }
              })
            );
          resolve({
            url,
            stop,
          });
        }
      });
    });
