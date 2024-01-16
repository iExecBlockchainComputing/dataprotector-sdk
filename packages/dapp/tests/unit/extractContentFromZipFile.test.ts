import extractContentFromZipFile from '../../src/extractContentFromZipFile.js';
import getDynamicZipPath from '../utils/dynamicZipPath.js';

describe('extractContentFromZipFile', () => {
  const zipPathSuffix = '/tests/_test_inputs_/data.zip';
  const dappSuffix = '/dapp';
  const zipPath = getDynamicZipPath(zipPathSuffix, dappSuffix);

  it('should extract content from a valid .zip file', async () => {
    const contentPath = '/content.txt';
    const result = await extractContentFromZipFile(zipPath, contentPath);
    const expectedContent = 'Test content';
    expect(result.toString()).toEqual(expectedContent);
  });

  it('should throw an error if no content file is found in the zip', async () => {
    const nonExistentContentPath = '/non/existent/content';
    await expect(
      extractContentFromZipFile(zipPath, nonExistentContentPath)
    ).rejects.toThrow('No content file was found in the zip.');
  });

  it('should throw an error for a non-existent file', async () => {
    const noExistentPath = '/dapp/tests/_test_inputs_/not_existent.zip';

    const contentPath = '/content.txt';

    await expect(
      extractContentFromZipFile(noExistentPath, contentPath)
    ).rejects.toThrow(
      `Error: ENOENT: no such file or directory, open '${noExistentPath}'`
    );
  });
});
