import extractContentFromZipFile from '../../src/extractContentFromZipFile';

describe('extractContentFromZipFile', () => {
  it('should extract content from a valid .zip file', async () => {
    const zipPath = new URL('../_test_inputs_/data.zip', import.meta.url);
    const contentPath = '/content.txt';

    const result = await extractContentFromZipFile(
      zipPath.pathname,
      contentPath
    );
    const expectedContent = 'Test content';
    expect(result.toString()).toEqual(expectedContent);
  });

  it('should throw an error if no content file is found in the zip', async () => {
    const zipPath = new URL('../_test_inputs_/data.zip', import.meta.url);
    const nonExistentContentPath = '/non/existent/content';

    await expect(
      extractContentFromZipFile(zipPath.pathname, nonExistentContentPath)
    ).rejects.toThrow('No content file was found in the zip.');
  });

  it('should throw an error for a non-existent file', async () => {
    const zipPath = new URL('../_test_inputs_/test.zip', import.meta.url);
    const contentPath = '/content.txt';

    await expect(
      extractContentFromZipFile(zipPath.pathname, contentPath)
    ).rejects.toThrow(
      `Error: ENOENT: no such file or directory, open '${zipPath.pathname}'`
    );
  });
});
