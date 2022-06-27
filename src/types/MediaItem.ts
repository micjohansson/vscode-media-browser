import * as vscode from 'vscode';
import * as crypto from 'node:crypto';

export abstract class MediaItem extends vscode.TreeItem {
	mimeType = 'unknown';

	public readonly webviewUri: vscode.Uri | undefined;
	protected previewHtml: string;

	constructor(
		public readonly resourceUri: vscode.Uri,
		public readonly webviewUriConverter: ((uri: vscode.Uri) => vscode.Uri),
		public readonly placeholderUri: vscode.Uri | undefined,
		protected onUpdate: ((item: MediaItem) => void)
	) {
		super(resourceUri, vscode.TreeItemCollapsibleState.None);

		this.description = resourceUri.fsPath;
		this.webviewUri = this.webviewUriConverter(this.resourceUri);
		this.label = resourceUri.path.split('/').reverse()[0];
		this.previewHtml = this._loadPreviewHtml();
		this.id = crypto.createHash('sha1').update(this.description).digest('hex');
	}

	protected abstract _loadPreviewHtml(): string;

	protected updated() {
		this.onUpdate(this);
	}

	protected updatePreview() {
		this.previewHtml = this._loadPreviewHtml();
		this.updated();
	}
}
