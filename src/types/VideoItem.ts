import { MediaTypeUtil } from '.';
import { MediaItem } from './MediaItem';

export class VideoItem extends MediaItem {
	mimeType = MediaTypeUtil.mimeType.video;

	protected _loadPreviewHtml(): string {
		return /*html*/ `<div class="preview video">
		<video muted loop>
			<source src="${this.webviewUri}">
		</video>
		</div>`;
	}
}
