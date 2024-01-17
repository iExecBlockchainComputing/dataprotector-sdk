import * as path from 'path';

function getDynamicZipPath(zipPathSuffix: string, dappSuffix: string): string {
  const cwd = process.cwd();
  const shouldAppendDapp = cwd.endsWith(dappSuffix);
  return path.join(
    cwd,
    shouldAppendDapp ? zipPathSuffix : `dapp${zipPathSuffix}`
  );
}

export default getDynamicZipPath;
