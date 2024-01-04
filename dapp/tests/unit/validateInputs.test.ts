import { pathSchema } from './../../src/validateInputs';

describe('pathSchema', () => {
  it('should validate a valid content path', async () => {
    const validPath = '/data.txt';
    await expect(pathSchema.validate(validPath)).resolves.toEqual(validPath);
  });

  it('should reject an empty content path', async () => {
    const invalidPath = '';
    await expect(pathSchema.validate(invalidPath)).rejects.toThrow(
      Error('Invalid path format')
    );
  });

  it('should reject a non-string content path', async () => {
    const invalidPath = 123; // Invalid type, expects a string
    await expect(pathSchema.validate(invalidPath)).rejects.toThrow(
      'Invalid path format'
    );
  });

  it('should reject a content path with leading whitespace', async () => {
    const invalidPath = ' /path/to/content'; // Contains leading whitespace
    await expect(pathSchema.validate(invalidPath)).rejects.toThrow(
      Error('Invalid path format')
    );
  });

  it('should reject a content path with trailing whitespace', async () => {
    const invalidPath = '/path/to/content '; // Contains trailing whitespace
    await expect(pathSchema.validate(invalidPath)).rejects.toThrow(
      Error('Invalid path format')
    );
  });
});
