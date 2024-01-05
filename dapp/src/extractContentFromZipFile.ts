import { promises as fs } from 'fs';
import JSZip from 'jszip';
import { pathSchema } from './validateInputs';

async function extractContentFromZipFile(zipPath, contentPath) {
  try {
    const vZipPath = pathSchema.label('zipPath').validateSync(zipPath);
    const vContentPath = pathSchema
      .label('contentPath')
      .validateSync(contentPath);

    const data = await fs.readFile(vZipPath);
    const zip = await JSZip.loadAsync(data);

    let content;
    zip.forEach((relativePath, file) => {
      if (!file.dir && relativePath.includes(vContentPath)) {
        content = file.async('nodebuffer');
      }
    });

    if (!content) {
      throw new Error('No content file was found in the zip.');
    }
    return content;
  } catch (error) {
    throw new Error(error);
  }
}

export default extractContentFromZipFile;
