import { Uri, Webview } from "vscode";
import {
  getMimeType,
  getUri,
  useContentPath,
  useMimeTypeRegex,
} from ".";
import {
  AudioItem,
  ImageItem,
  MediaItem,
  MediaType,
  MediaTypeUtil,
  MiscMediaItem,
  VideoItem,
} from "../types";

export function getMediaItem(
  resource: Uri,
  webview: Webview,
  extensionUri: Uri,
  onMediaUpdated: ((item: MediaItem) => void)
): MediaItem | undefined {
  const mime = getMimeType(resource.fsPath);

  if (!(typeof mime === "string" && useMimeTypeRegex().test(`${mime}`))) { return; }

  let item: MediaItem | undefined;
  let placeholderUri: Uri | undefined;

  let itemType;

  switch (MediaTypeUtil.typeFromMime(mime)) {
    case MediaType.image:
      itemType = ImageItem;
      break;
    case MediaType.audio:
      itemType = AudioItem;
      // TODO: Rework setting placeholder
      placeholderUri = getUri(webview, extensionUri, [useContentPath(), "sound.svg"]);
      break;
    case MediaType.video:
      itemType = VideoItem;
      break;
    default:
      itemType = MiscMediaItem;
      break;
  }

  if (item === undefined) {
    item = new itemType(resource, (uri) => {
      return webview.asWebviewUri(uri);
    }, placeholderUri, (item) => onMediaUpdated(item));
  }

  return item;
}