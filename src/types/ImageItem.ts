import { MediaTypeUtil } from '.';
import { MediaItem } from './MediaItem';

export class ImageItem extends MediaItem {
	mimeType = MediaTypeUtil.mimeType.image;

	protected _loadPreviewHtml(): string {
		return /*html*/ `<div class="preview image">
		<img class="scale-down" src="${this.webviewUri}">
		</div>`;
	}
}
