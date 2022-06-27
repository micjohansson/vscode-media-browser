import { MediaItem } from './MediaItem';

export class MiscMediaItem extends MediaItem {
	protected _loadPreviewHtml(): string {
		return /*html*/ `<div class="preview overflow-wrap-anywhere">${this.description}</div>`;
	}
}
