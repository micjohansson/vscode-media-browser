import { getType } from 'mime';

const TYPESCRIPT_EXTENSION_REGEX = /.ts$/;

export function getMimeType(path: string) {
  // '.ts' is the extension of both a Typescript file and an MP2T video.
  // Since the extension is current registered as a 'video/mp2t' mime type,
  // false positives will be listed in a Typescript project...
  // Given the nature of the application, let's just assume '.ts' denotes a Typescript file!
  if (TYPESCRIPT_EXTENSION_REGEX.test(path)) { return null; }
  return getType(path);
}