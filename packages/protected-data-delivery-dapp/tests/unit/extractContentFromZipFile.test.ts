import path from 'path';
import extractContentFromZipFile from '../../src/extractContentFromZipFile.js';

describe('extractContentFromZipFile', () => {
  const zipPath = path.join(
    process.cwd(),
    'tests',
    '_test_inputs_',
    'data.zip'
  );

  it('should extract content from a valid .zip file', async () => {
    const contentPath = 'content.txt';
    const result = await extractContentFromZipFile(zipPath, contentPath);
    const expectedContent = 'Test content';
    expect(result.toString()).toEqual(expectedContent);
  });

  it('should throw an error if no content file is found in the zip', async () => {
    // const nonExistentContentPath = '/non/existent/content';
    const nonExistentContentPath = path.join(
      process.cwd(),
      'tests',
      '_test_inputs_',
      'not_existent.zip'
    );
    await expect(
      extractContentFromZipFile(zipPath, nonExistentContentPath)
    ).rejects.toThrow('No content file was found in the zip.');
  });

  it('should throw an error for a non-existent file', async () => {
    const noExistentPath = path.join(
      process.cwd(),
      'tests',
      '_test_inputs_',
      'not_existent.zip'
    );
    //const noExistentPath = 'tests/_test_inputs_/not_existent.zip';
    const contentPath = '/content.txt';
    await expect(
      extractContentFromZipFile(noExistentPath, contentPath)
    ).rejects.toThrow(
      `Error: ENOENT: no such file or directory, open '${noExistentPath}'`
    );
  });
});
