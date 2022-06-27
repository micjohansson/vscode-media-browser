import * as vscode from 'vscode';
import * as mm from 'music-metadata';
import { MediaTypeUtil } from '.';
import { MediaItem } from './MediaItem';

export class AudioItem extends MediaItem {
	mimeType = MediaTypeUtil.mimeType.audio;

	public render: string | undefined;
	private _metadata: mm.IAudioMetadata | undefined;
	public get metadata(): mm.IAudioMetadata | undefined {
		return this._metadata;
	}

	private _imageSrc: string | undefined;

	constructor(
		public readonly resourceUri: vscode.Uri,
		public readonly webviewUriConverter: ((uri: vscode.Uri) => vscode.Uri),
		public readonly placeholderUri: vscode.Uri | undefined,
		protected onUpdate: ((item: MediaItem) => void)
	) {
		super(resourceUri, webviewUriConverter, placeholderUri, onUpdate);

		this._loadMetadata();
	}

	protected _loadCoverImage({ common }: mm.IAudioMetadata): void {
		const picture = mm.selectCover(common.picture);
		this._imageSrc = picture ? `data:${picture.format};base64,${picture.data.toString('base64')}` : undefined;
		if (this._imageSrc) {
			this.updatePreview();
		}
	}

	protected async _loadMetadata() {
		try {
			this._metadata = await mm.parseFile(this.resourceUri.fsPath);
			if (this.metadata) {
				this._loadCoverImage(this.metadata);
			}
		} catch (error) {
			console.error(`_loadMetadata: ${error}`);
		}
	}

	protected _loadPreviewHtml(): string {
		return /*html*/ `<div class="preview image">
		<img class="scale-down" src="${this._imageSrc ?? this.placeholderUri}">
		</div>`;
	}
}
