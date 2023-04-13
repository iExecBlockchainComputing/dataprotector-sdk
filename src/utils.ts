import { fileTypeFromBuffer } from 'file-type';
import JSZip from 'jszip';
async function extractDataSchema(
  value: Record<string, unknown>
): Promise<string> {
  const schema: string[] = [];
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      const valueOfKey = value[key];
      const typeOfValue = typeof valueOfKey;
      if (typeOfValue === 'object') {
        if (
          valueOfKey instanceof Buffer ||
          valueOfKey instanceof ArrayBuffer ||
          valueOfKey instanceof Uint8Array
        ) {
          const type = await fileTypeFromBuffer(valueOfKey);
          if (type === undefined) {
            schema.push(`${key}: "bytes:Other"`);
          } else {
            const mime = type.mime;
            schema.push(`${key}: "bytes:${mime}"`);
          }
        } else {
          const nestedSchema = await extractDataSchema(
            valueOfKey as Record<string, unknown>
          );
          schema.push(`${key}: { ${nestedSchema} }`);
        }
      } else {
        schema.push(`${key}: "${typeOfValue}"`);
      }
    }
  }
  return schema.join(', ');
}

function createZipFromObject(obj: unknown): Promise<Uint8Array> {
  const zip = new JSZip();
  const promises: Promise<void>[] = [];

  const createFileOrDirectory = (
    key: string,
    value: unknown,
    path: string
  ): void => {
    const fullPath = path ? `${path}/${key}` : key;
    if (
      typeof value === 'object' &&
      value !== null &&
      !(value instanceof Array) &&
      !(value instanceof Buffer) &&
      !(value instanceof ArrayBuffer) &&
      !(value instanceof Uint8Array)
    ) {
      zip.folder(fullPath);
      for (const [nestedKey, nestedValue] of Object.entries(
        value as Record<string, unknown>
      )) {
        createFileOrDirectory(nestedKey, nestedValue, fullPath);
      }
    } else {
      let content;
      if (typeof value === 'number') {
        content = value.toString();
      } else if (typeof value === 'boolean') {
        value ? (value = '1') : (value = '0');
      } else {
        content = value as Uint8Array | string | ArrayBuffer | Buffer;
      }
      promises.push(
        zip
          .file(fullPath, content)
          .generateAsync({ type: 'uint8array' }) as Promise<any>
      );
    }
  };

  for (const [key, value] of Object.entries(obj)) {
    createFileOrDirectory(key, value, '');
  }

  return Promise.all(promises).then(() =>
    zip.generateAsync({ type: 'uint8array' })
  );
}

export { extractDataSchema, createZipFromObject };
