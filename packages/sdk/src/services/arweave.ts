import {
  DEFAULT_ARWEAVE_GATEWAY,
  DEFAULT_ARWEAVE_UPLOAD_API,
} from '../config/config.js';

interface AddOptions {
  arweaveUploadApi?: string;
  arweaveGateway?: string;
}

const add = async (
  content: Uint8Array,
  { arweaveGateway, arweaveUploadApi }: AddOptions = {}
): Promise<string> => {
  let arweaveId: string;

  try {
    const payload = new FormData();
    payload.append('file', new Blob([content]));
    const res = await fetch(
      `${arweaveUploadApi || DEFAULT_ARWEAVE_UPLOAD_API}/upload`,
      {
        method: 'POST',
        body: payload,
      }
    );
    if (!res.ok) {
      throw Error(`Arweave upload API answered with status ${res.status}`);
    }
    try {
      const data = await res.json();
      arweaveId = data?.arweaveId;
      if (!arweaveId) {
        throw Error('missing arweaveId');
      }
    } catch (e) {
      throw Error('Arweave upload API answered with an invalid response', {
        cause: e,
      });
    }
  } catch (e) {
    throw Error('Failed to add file on Arweave', { cause: e });
  }
  const publicUrl = `${arweaveGateway || DEFAULT_ARWEAVE_GATEWAY}/${arweaveId}`;
  await fetch(publicUrl)
    .then((res) => {
      if (!res.ok) {
        throw Error(`Arweave gateway answered with status ${res.status}`);
      }
    })
    .catch((e) => {
      throw Error(`Failed to load uploaded file at ${publicUrl}`, { cause: e });
    });

  return arweaveId;
};

export { add };
