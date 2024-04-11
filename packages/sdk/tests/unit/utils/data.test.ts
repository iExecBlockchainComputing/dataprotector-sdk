import fsPromises from 'fs/promises';
import path from 'path';
import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import * as borsh from 'borsh';
import JSZip from 'jszip';
import { filetypeinfo } from 'magic-bytes.js';
import {
  ensureDataObjectIsValid,
  ensureDataSchemaIsValid,
  extractDataSchema,
  createZipFromObject,
} from '../../../src/utils/data.js';

const uint8ArraysAreEqual = (a: Uint8Array, b: Uint8Array) => {
  if (a.byteLength !== b.byteLength) return false;
  return a.every((val, i) => val === b[i]);
};

const uint8ArrayAndArrayBufferAreEqual = (
  uint8Array: Uint8Array,
  buffer: ArrayBuffer
): boolean => {
  const bufferUint8Array = new Uint8Array(buffer);
  if (bufferUint8Array.length !== uint8Array.length) {
    return false;
  }
  for (let i = 0; i < bufferUint8Array.length; i++) {
    if (bufferUint8Array[i] !== uint8Array[i]) {
      return false;
    }
  }
  return true;
};

const nodeBufferToArrayBuffer = (nodeBuffer: Buffer): ArrayBuffer =>
  nodeBuffer.buffer.slice(
    nodeBuffer.byteOffset,
    nodeBuffer.byteLength + nodeBuffer.byteOffset
  );

let data: any;
let pngImage: Uint8Array;
let svgImage: Uint8Array;
let pdfFile: ArrayBuffer;
let mp3AudioFile: ArrayBuffer;

beforeAll(async () => {
  // load some real data
  pngImage = await fsPromises.readFile(
    path.join(process.cwd(), 'tests', '_test_inputs_', 'image.png')
  );
  svgImage = await fsPromises.readFile(
    path.join(process.cwd(), 'tests', '_test_inputs_', 'image.svg')
  );
  pdfFile = nodeBufferToArrayBuffer(
    await fsPromises.readFile(
      path.join(process.cwd(), 'tests', '_test_inputs_', 'application.pdf')
    )
  );
  mp3AudioFile = nodeBufferToArrayBuffer(
    await fsPromises.readFile(
      path.join(process.cwd(), 'tests', '_test_inputs_', 'audio.mp3')
    )
  );
});

beforeEach(async () => {
  // create a data for the test
  data = {
    numberZero: 0,
    numberOne: 1,
    numberMinusOne: -1,
    numberPointOne: 0.1,
    bigintOne: BigInt(1),
    booleanTrue: true,
    booleanFalse: false,
    string: 'hello world!',
    nested: {
      object: {
        with: {
          binary: {
            data: {
              pngImage,
              svgImage,
              pdfFile,
              mp3AudioFile,
            },
          },
        },
      },
    },
  };
});

describe('ensureDataObjectIsValid()', () => {
  it('allow any key names with alphanumeric chars plus "-" and "_"', async () => {
    expect(
      ensureDataObjectIsValid({
        ...data,
        'azertyuiopqsdfghjklmwxcvbnAZERTYUIOPQSDFGHJKLMWXCVBN0123456789-_':
          'value',
      })
    ).toBeUndefined();
  });

  describe('throw when the data', () => {
    it('is an array', async () => {
      const invalidData: any = [0, 'one'];
      expect(() => ensureDataObjectIsValid(invalidData)).toThrow(
        Error('Unsupported array data')
      );
    });
    it('is null', async () => {
      const invalidData: any = null;
      expect(() => ensureDataObjectIsValid(invalidData)).toThrow(
        Error('Unsupported null data')
      );
    });
    it('is undefined', async () => {
      const invalidData: any = undefined;
      expect(() => ensureDataObjectIsValid(invalidData)).toThrow(
        Error('Unsupported undefined data')
      );
    });
  });

  describe('throw when the data keys', () => {
    it('contains an empty key', async () => {
      expect(() =>
        ensureDataObjectIsValid({
          ...data,
          '': 'this key is empty',
        })
      ).toThrow(Error('Unsupported empty key'));
    });
    it('contains an unsupported character', async () => {
      expect(() =>
        ensureDataObjectIsValid({
          ...data,
          money$: 'this key include an unsupported char',
        })
      ).toThrow(Error('Unsupported special character in key'));
      expect(() =>
        ensureDataObjectIsValid({
          ...data,
          '.': 'this key include an unsupported char',
        })
      ).toThrow(Error('Unsupported special character in key'));
      expect(() =>
        ensureDataObjectIsValid({
          ...data,
          'foo bar': 'this key include an unsupported char',
        })
      ).toThrow(Error('Unsupported special character in key'));
      expect(() =>
        ensureDataObjectIsValid({
          ...data,
          'foo\\bar': 'this key include an unsupported char',
        })
      ).toThrow(Error('Unsupported special character in key'));
      expect(() =>
        ensureDataObjectIsValid({
          ...data,
          '\n': 'this key include an unsupported char',
        })
      ).toThrow(Error('Unsupported special character in key'));
    });
  });

  describe('throw when the data values', () => {
    it('contains an array', async () => {
      data.invalid = ['foo', 'bar'];
      expect(() => ensureDataObjectIsValid(data)).toThrow(
        Error('Unsupported array data')
      );
    });
    it('contains null', async () => {
      data.invalid = null;
      expect(() => ensureDataObjectIsValid(data)).toThrow(
        Error('Unsupported null data')
      );
    });
    it('contains undefined', async () => {
      data.invalid = undefined;
      expect(() => ensureDataObjectIsValid(data)).toThrow(
        Error('Unsupported undefined data')
      );
    });
  });
});

describe('extractDataSchema()', () => {
  it('extracts the DataSchema', async () => {
    data.applicationPdf = await fsPromises.readFile(
      path.join(process.cwd(), 'tests', '_test_inputs_', 'application.pdf')
    );
    data.applicationZip = await fsPromises.readFile(
      path.join(process.cwd(), 'tests', '_test_inputs_', 'application.zip')
    );
    data.audioMid = await fsPromises.readFile(
      path.join(process.cwd(), 'tests', '_test_inputs_', 'audio.mid')
    );
    data.audioMp3 = await fsPromises.readFile(
      path.join(process.cwd(), 'tests', '_test_inputs_', 'audio.mp3')
    );
    data.audioWav = await fsPromises.readFile(
      path.join(process.cwd(), 'tests', '_test_inputs_', 'audio.wav')
    );
    data.imageBmp = await fsPromises.readFile(
      path.join(process.cwd(), 'tests', '_test_inputs_', 'image.bmp')
    );
    data.imageGif = await fsPromises.readFile(
      path.join(process.cwd(), 'tests', '_test_inputs_', 'image.gif')
    );
    data.imageJpg = await fsPromises.readFile(
      path.join(process.cwd(), 'tests', '_test_inputs_', 'image.jpg')
    );
    data.imagePng = await fsPromises.readFile(
      path.join(process.cwd(), 'tests', '_test_inputs_', 'image.png')
    );
    data.imageWebp = await fsPromises.readFile(
      path.join(process.cwd(), 'tests', '_test_inputs_', 'image.webp')
    );
    data.videoAvi = await fsPromises.readFile(
      path.join(process.cwd(), 'tests', '_test_inputs_', 'video.avi')
    );
    data.videoMp4 = await fsPromises.readFile(
      path.join(process.cwd(), 'tests', '_test_inputs_', 'video.mp4')
    );
    data.videoMpeg = await fsPromises.readFile(
      path.join(process.cwd(), 'tests', '_test_inputs_', 'video.mpeg')
    );

    const dataSchema: any = await extractDataSchema(data);
    expect(dataSchema).toBeInstanceOf(Object);
    expect(dataSchema.numberZero).toBe('f64');
    expect(dataSchema.numberOne).toBe('f64');
    expect(dataSchema.numberMinusOne).toBe('f64');
    expect(dataSchema.numberPointOne).toBe('f64');
    expect(dataSchema.bigintOne).toBe('i128');
    expect(dataSchema.booleanTrue).toBe('bool');
    expect(dataSchema.booleanFalse).toBe('bool');
    expect(dataSchema.string).toBe('string');
    expect(dataSchema.applicationPdf).toBe('application/pdf');
    expect(dataSchema.applicationZip).toBe('application/zip');
    expect(dataSchema.audioMid).toBe('audio/midi');
    expect(dataSchema.audioMp3).toBe('audio/mpeg');
    expect(dataSchema.audioWav).toBe('audio/x-wav');
    expect(dataSchema.imageBmp).toBe('image/bmp');
    expect(dataSchema.imageGif).toBe('image/gif');
    expect(dataSchema.imageJpg).toBe('image/jpeg');
    expect(dataSchema.imagePng).toBe('image/png');
    expect(dataSchema.imageWebp).toBe('image/webp');
    expect(dataSchema.videoAvi).toBe('video/x-msvideo');
    expect(dataSchema.videoMp4).toBe('video/mp4');
    expect(dataSchema.videoMpeg).toBe('video/mpeg');
    expect(dataSchema.nested.object.with.binary.data.pngImage).toBe(
      'image/png'
    );
    expect(dataSchema.nested.object.with.binary.data.svgImage).toBe(
      'application/xml'
    );
  });

  it("fallbacks to 'application/octet-stream' when the function fails to detect mime type", async () => {
    data.unknown = Buffer.from([0x01, 0x01, 0x01, 0x01]);
    const dataSchema: any = await extractDataSchema(data);
    expect(dataSchema.unknown).toBe('application/octet-stream');
  });

  it('Text-based files also considered as octet-stream for now', async () => {
    data.text = await fsPromises.readFile(
      path.join(process.cwd(), 'tests', '_test_inputs_', 'text.txt')
    );
    const dataSchema: any = await extractDataSchema(data);
    expect(dataSchema.text).toBe('application/octet-stream');
  });
});

describe('createZipFromObject()', () => {
  it('creates a zip file', async () => {
    const zipFile: any = await createZipFromObject(data);
    expect(zipFile).toBeInstanceOf(Uint8Array);
    const fileType = await filetypeinfo(zipFile);
    expect(fileType[0]?.mime).toBe('application/zip');
  });

  it('puts each leave in a dedicated file and each sub-object in a dedicated folder', async () => {
    const zipFile: any = await createZipFromObject(data);
    const zip = await new JSZip().loadAsync(zipFile);
    expect(Object.keys(zip.files)).toStrictEqual([
      'numberZero',
      'numberOne',
      'numberMinusOne',
      'numberPointOne',
      'bigintOne',
      'booleanTrue',
      'booleanFalse',
      'string',
      'nested/',
      'nested/object/',
      'nested/object/with/',
      'nested/object/with/binary/',
      'nested/object/with/binary/data/',
      'nested/object/with/binary/data/pngImage',
      'nested/object/with/binary/data/svgImage',
      'nested/object/with/binary/data/pdfFile',
      'nested/object/with/binary/data/mp3AudioFile',
    ]);
  });

  it('serializes boolean `false` as borsh "bool" file', async () => {
    const zipFile = await createZipFromObject(data);
    const zip: any = await new JSZip().loadAsync(zipFile);
    const content = await zip.file('booleanFalse')?.async('uint8array');
    expect(borsh.deserialize('bool', content)).toBe(data.booleanFalse);
  });

  it('serializes boolean `true` as borsh "bool" file', async () => {
    const zipFile = await createZipFromObject(data);
    const zip: any = await new JSZip().loadAsync(zipFile);
    const content = await zip.file('booleanTrue')?.async('uint8array');
    expect(borsh.deserialize('bool', content)).toBe(data.booleanTrue);
  });

  it('serializes strings as borsh "string" file', async () => {
    const zipFile = await createZipFromObject(data);
    const zip: any = await new JSZip().loadAsync(zipFile);
    const content = await zip.file('string')?.async('uint8array');
    expect(borsh.deserialize('string', content)).toBe(data.string);
  });

  it('serializes bigint as borsh "i128" file', async () => {
    const zipFile = await createZipFromObject(data);
    const zip: any = await new JSZip().loadAsync(zipFile);
    const bigintOneContent = await zip.file('bigintOne')?.async('uint8array');
    expect(borsh.deserialize('i128', bigintOneContent)).toBe(data.bigintOne);
  });

  it('serializes number as borsh "f64" file', async () => {
    const zipFile = await createZipFromObject(data);
    const zip: any = await new JSZip().loadAsync(zipFile);
    const numberPointOneContent = await zip
      .file('numberPointOne')
      ?.async('uint8array');
    expect(borsh.deserialize('f64', numberPointOneContent)).toBe(
      data.numberPointOne
    );
    const numberZeroContent = await zip.file('numberZero')?.async('uint8array');
    expect(borsh.deserialize('f64', numberZeroContent)).toBe(data.numberZero);
    const numberOneContent = await zip.file('numberOne')?.async('uint8array');
    expect(borsh.deserialize('f64', numberOneContent)).toBe(data.numberOne);
    const numberMinusOneContent = await zip
      .file('numberMinusOne')
      ?.async('uint8array');
    expect(borsh.deserialize('f64', numberMinusOneContent)).toBe(
      data.numberMinusOne
    );
  });

  it('serializes binary data as binary file', async () => {
    const zipFile = await createZipFromObject(data);
    expect(zipFile.length).toBeGreaterThan(0);

    // ensure some data are Uint8Array (nodejs)
    expect(
      data.nested.object.with.binary.data.pngImage instanceof ArrayBuffer
    ).toBe(false);
    expect(
      data.nested.object.with.binary.data.pngImage instanceof Uint8Array
    ).toBe(true);
    // ensure some data are ArrayBuffer (web)
    expect(
      data.nested.object.with.binary.data.pdfFile instanceof ArrayBuffer
    ).toBe(true);
    expect(
      data.nested.object.with.binary.data.pdfFile instanceof Uint8Array
    ).toBe(false);

    const zip: any = await new JSZip().loadAsync(zipFile);
    const pngImageContent = await zip
      .file('nested/object/with/binary/data/pngImage')
      ?.async('uint8array');
    expect(uint8ArraysAreEqual(pngImageContent, pngImage)).toBe(true);
    const svgImageContent = await zip
      .file('nested/object/with/binary/data/svgImage')
      ?.async('uint8array');
    expect(uint8ArraysAreEqual(svgImageContent, svgImage)).toBe(true);
    const pdfFileContent: Uint8Array = await zip
      .file('nested/object/with/binary/data/pdfFile')
      ?.async('uint8array');
    expect(uint8ArrayAndArrayBufferAreEqual(pdfFileContent, pdfFile)).toBe(
      true
    );
    const mp3AudioFileContent: Uint8Array = await zip
      .file('nested/object/with/binary/data/mp3AudioFile')
      ?.async('uint8array');
    expect(
      uint8ArrayAndArrayBufferAreEqual(mp3AudioFileContent, mp3AudioFile)
    ).toBe(true);
  });

  describe('throw when the data values', () => {
    it('contains non finite number', async () => {
      await expect(
        createZipFromObject({ ...data, invalid: Infinity })
      ).rejects.toThrow(Error('Unsupported number value: infinity'));
    });
    it('contains integer out of "i128" boundaries', async () => {
      await expect(
        createZipFromObject({
          ...data,
          invalid: BigInt(
            '123456789012345678901234567890123456789012345678901234567890'
          ),
        })
      ).rejects.toThrow(Error('Unsupported integer value: out of i128 range'));
    });
    it('contains something that is not a boolean|number[bigint|string|Uint8Array|ArrayBuffer', async () => {
      await expect(
        createZipFromObject({ ...data, invalid: () => {} })
      ).rejects.toThrow(Error('Unexpected data format'));
      await expect(
        createZipFromObject({ ...data, invalid: Symbol('foo') })
      ).rejects.toThrow(Error('Unexpected data format'));
    });
  });
});

describe('ensureDataSchemaIsValid()', () => {
  let schema: any;
  beforeEach(() => {
    schema = {
      booleanTrue: 'bool',
      numberZero: 'i128',
      numberPointOne: 'f64',
      string: 'string',
      nested: {
        object: {
          with: {
            binary: {
              data: {
                pngImage: 'image/png',
                svgImage: 'application/xml',
              },
            },
          },
        },
      },
    };
  });

  it('allow any key names with alphanumeric chars plus "-" and "_"', async () => {
    expect(
      ensureDataSchemaIsValid({
        ...schema,
        'azertyuiopqsdfghjklmwxcvbnAZERTYUIOPQSDFGHJKLMWXCVBN0123456789-_':
          'string',
      })
    ).toBeUndefined();
  });

  describe('throw when a nested type is not supported', () => {
    it('when the nested type is not correct', async () => {
      const invalidSchema: any = { foo: { bar: { baz: 42 } } };
      expect(() => ensureDataSchemaIsValid(invalidSchema)).toThrow(
        Error('Unsupported type "42" in schema')
      );
    });
  });

  describe('throw when the schema', () => {
    it('is an array', async () => {
      const invalidSchema: any = [0, 'one'];
      expect(() => ensureDataSchemaIsValid(invalidSchema)).toThrow(
        Error('Unsupported array schema')
      );
    });
    it('is null', async () => {
      const invalidSchema: any = null;
      expect(() => ensureDataSchemaIsValid(invalidSchema)).toThrow(
        Error('Unsupported null schema')
      );
    });
    it('is undefined', async () => {
      const invalidSchema: any = undefined;
      expect(() => ensureDataSchemaIsValid(invalidSchema)).toThrow(
        Error('Unsupported undefined schema')
      );
    });
  });

  describe('throw when the schema keys', () => {
    it('contains an empty key', async () => {
      expect(() =>
        ensureDataSchemaIsValid({
          ...schema,
          '': 'this key is empty',
        })
      ).toThrow(Error('Unsupported empty key'));
    });
    it('contains an unsupported character', async () => {
      expect(() =>
        ensureDataSchemaIsValid({
          ...schema,
          money$: 'this key include an unsupported char',
        })
      ).toThrow(Error('Unsupported special character in key'));
      expect(() =>
        ensureDataSchemaIsValid({
          ...schema,
          '.': 'this key include an unsupported char',
        })
      ).toThrow(Error('Unsupported special character in key'));
      expect(() =>
        ensureDataSchemaIsValid({
          ...schema,
          'foo bar': 'this key include an unsupported char',
        })
      ).toThrow(Error('Unsupported special character in key'));
      expect(() =>
        ensureDataSchemaIsValid({
          ...schema,
          'foo\\bar': 'this key include an unsupported char',
        })
      ).toThrow(Error('Unsupported special character in key'));
      expect(() =>
        ensureDataSchemaIsValid({
          ...schema,
          '\n': 'this key include an unsupported char',
        })
      ).toThrow(Error('Unsupported special character in key'));
    });
  });

  describe('throw when the schema type', () => {
    it('contains null', async () => {
      expect(() =>
        ensureDataSchemaIsValid({
          ...schema,
          nullType: null,
        })
      ).toThrow(Error('Unsupported null schema'));
    });
    it('contains undefined', async () => {
      expect(() =>
        ensureDataSchemaIsValid({
          ...schema,
          undefinedType: undefined,
        })
      ).toThrow(Error('Unsupported type "undefined" in schema'));
    });
    it('contains array', async () => {
      expect(() =>
        ensureDataSchemaIsValid({
          ...schema,
          arrayOfTypes: ['boolean', 'string'],
        })
      ).toThrow(Error('Unsupported array schema'));
    });
    it('contains unknown type', async () => {
      expect(() =>
        ensureDataSchemaIsValid({
          ...schema,
          unknownType: 'foo',
        })
      ).toThrow(Error('Unsupported type "foo" in schema'));
    });
  });
});
