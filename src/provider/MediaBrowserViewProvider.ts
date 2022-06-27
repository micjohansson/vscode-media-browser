import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {
	MediaType,
	MediaTypeUtil,
	MIME_TYPE, IListOptions,
	NoItemError,
	MediaItem,
	AudioItem,
	ImageItem,
	VideoItem,
	MiscMediaItem,
	SearchableMediaItem,
} from '../types';
import {
	getUri,
	getNonce,
	getResourceUri,
	useExtensionKey,
	useMimeTypeRegex,
	getActiveTextEditor,
	useContentPath,
	getMimeType,
} from '../utilities';

export class MediaBrowserViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = useExtensionKey('view');

	private media: MediaItem[] = [];
	private listOptions: IListOptions = {
		searchTerm: undefined,
		caseInsensitiveSearch: true,
		omit: new Set(),
	};

	private _view?: vscode.WebviewView | undefined;
	public get view(): vscode.WebviewView | undefined {
		return this._view;
	}

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _workspaceUri: vscode.Uri | undefined
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
		};

		webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

		this.refresh();

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'refresh':
					{
						this.refresh();
						break;
					}
				case 'insert':
					{
						const { id } = data;
						const item = this.getMediaItem(id);

						try {
							if (!item) {
								throw new NoItemError(`No item for id ${id}`);
							}

							try {
								this.insertMediaReference(item);
								return;
							} catch (error) {
								// No active text editor
							}

							this.copyFilePath(item);
						} catch (error) {
							console.error(error);
						}
						break;
					}
				case 'open':
					{
						const { id } = data;
						const item = this.getMediaItem(id);

						if (!item) {
							throw new NoItemError(`No item for id ${id}`);
						}

						this.openMediaItem(item);
						break;
					}
				case 'explorer':
					{
						const { id } = data;
						const item = this.getMediaItem(id);

						if (!item) {
							throw new NoItemError(`No item for id ${id}`);
						}

						this.revealInExplorer(item);
						break;
					}
				case 'search':
					{
						const { value } = data;
						this.searchMedia(value);
						break;
					}
				case 'filter':
					{
						const { value = "", show = true } = data;
						this.filter(value, show);
						break;
					}
			}
		});
	}

	public refresh() {
		this.loadMedia();
		this.listMedia();
	}

	private loadMedia() {
		this.media = this.getMediaFromWorkspace();
	}

	private getMediaItem(id: string): MediaItem | undefined {
		return this.media.find(({ id: _id }) => _id === id);
	}

	private openMediaItem({ resourceUri }: MediaItem) {
		vscode.commands.executeCommand('vscode.open', resourceUri);
	}

	private revealInExplorer({ resourceUri }: MediaItem) {
		vscode.commands.executeCommand('revealInExplorer', resourceUri);
	}

	private copyFilePath({ resourceUri }: MediaItem) {
		vscode.commands.executeCommand('copyFilePath', resourceUri);
	}

	private insertMediaReference(item: MediaItem, refType = 'relative') {
		const activeTextEditor = getActiveTextEditor();
		if (!activeTextEditor) {
			throw new EvalError(`no-active-text-editor`);
		}

		let filePath: string;

		if (refType === 'relative') {
			filePath = path.relative(activeTextEditor.document.uri.fsPath, item.resourceUri.fsPath);
		} else {
			filePath = item.resourceUri.path;
		}

		activeTextEditor.insertSnippet(new vscode.SnippetString(filePath));
	}

	private searchMedia(term: string) {
		this.listOptions.searchTerm = term;
		this.listMedia();
	}

	private filter(type: string, show: boolean) {
		const mediaType = MediaTypeUtil.typeFromMime(type.toLowerCase());
		if (mediaType === MediaType.unknown) {

			console.warn(`${type}, ${mediaType}`);
			return;
		}

		if (show) {
			this.listOptions.omit.delete(mediaType);
		} else {
			this.listOptions.omit.add(mediaType);
		}

		this.listMedia();
	}

	private onMediaUpdated(item: MediaItem) {
		if (!this.media) { return; }
		this.media = this.media.map((_item) => _item.id === item.id ? item : _item);
		this.listMedia();
	}

	private webviewUriConveter(uri: vscode.Uri): vscode.Uri {
		if (!this.view) { throw new ReferenceError(`WebviewView has not been assigned`); }
		return this.view.webview.asWebviewUri(uri);
	}

	private getMediaFromWorkspace(): MediaItem[] {
		const workspacePath = this._workspaceUri?.fsPath;

		if (!workspacePath) { return []; }

		const _concat = (fsPath: string): MediaItem[] => {
			let fileStatus;
			try {
				fileStatus = fs.statSync(fsPath);
			} catch (error) {
				return [];
			}

			if (fileStatus.isDirectory()) {
				return _getFiles(fsPath);
			}

			if (!fileStatus.isFile()) { return []; }

			const mime = getMimeType(fsPath);

			if (typeof mime === "string" && useMimeTypeRegex().test(`${mime}`)) {
				if (!this.view) { throw new EvalError(`View not available`); }

				const uri = getResourceUri(fsPath), webviewUri = this.view.webview.asWebviewUri;

				if (!webviewUri) { throw new ReferenceError(`Could not get asWebviewUri`); }

				let item: MediaItem | undefined;
				let placeholderUri: vscode.Uri | undefined;

				let itemType;

				switch (MediaTypeUtil.typeFromMime(mime)) {
					case MediaType.image:
						itemType = ImageItem;
						break;
					case MediaType.audio:
						itemType = AudioItem;
						placeholderUri = getUri(this.view.webview, this._extensionUri, [useContentPath(), "sound.svg"]);
						break;
					case MediaType.video:
						itemType = VideoItem;
						break;
					default:
						itemType = MiscMediaItem;
						break;
				}

				if (item === undefined) {
					item = new itemType(uri, (uri) => {
						return this.webviewUriConveter(uri);
					}, placeholderUri, (item) => this.onMediaUpdated(item));
				}

				return [item];
			}

			return [];
		};

		const _getFiles = (fsPath: string): MediaItem[] => {
			const content = fs.readdirSync(fsPath);

			return content.reduce((p: MediaItem[], c: string): MediaItem[] => {
				return [
					...p,
					...(_concat(path.join(fsPath, c))),
				];
			}, []);
		};

		return _getFiles(workspacePath);
	}

	private listMedia({
		media: _media = this.media, options = this.listOptions,
	} = {}) {
		const type = 'media';
		const {
			searchTerm, omit, caseInsensitiveSearch = true,
		} = options;

		let media: SearchableMediaItem[] = _media
			.map(item => item as SearchableMediaItem)
			.filter(({ mimeType }) => {
				return !omit.has(MediaTypeUtil.typeFromMime(mimeType));
			}).sort(({ label: labelA }, { label: labelB }) => {
				return `${labelA}`.localeCompare(`${labelB}`);
			});

		if (searchTerm && searchTerm.length > 0) {
			media = media.reduce((p: SearchableMediaItem[], item) => {
				const regex = new RegExp(`${searchTerm}`, `g${caseInsensitiveSearch ? 'i' : ''}`);
				const match = regex.exec(`${item.label}`);
				if (!match) {
					return p;
				}

				item.matchIndex = match.index;
				return [
					...p,
					item,
				];
			}, []);
		}

		this.view?.webview.postMessage({
			type,
			media,
			options: {
				...options,
				omit: [...omit.values()],
			},
		});
	}

	private getHtmlForWebview(webview: vscode.Webview) {
		const contentPath = useContentPath();

		// Extension injectables
		const scriptMainUri = getUri(webview, this._extensionUri, [
			contentPath,
			"main.js",
		]);
		const styleMainUri = getUri(webview, this._extensionUri, [
			contentPath,
			"main.css",
		]);
		const styleFontIconssUri = getUri(webview, this._extensionUri, [
			contentPath,
			"fontello",
			"css",
			"media-browser.css",
		]);

		// Node injectables
		const scriptToolkitUri = getUri(webview, this._extensionUri, [
			"node_modules",
			"@vscode",
			"webview-ui-toolkit",
			"dist",
			"toolkit.js",
		]);
		const styleCodiconsUri = getUri(webview, this._extensionUri, [
			"node_modules",
			"@vscode",
			"codicons",
			"dist",
			"codicon.css",
		]);

		const nonce = getNonce();

		return /*html*/ `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!-- Content security policy -->
				<meta http-equiv="Content-Security-Policy"
					content="default-src 'none';
					media-src ${webview.cspSource};
					img-src ${webview.cspSource} data:;
					style-src ${webview.cspSource} 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=';
					font-src ${webview.cspSource};
					connect-src ${webview.cspSource};
					script-src 'nonce-${nonce}';"
					>

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<!-- Stylesheets -->
				<link href="${styleCodiconsUri}" rel="stylesheet">
				<link href="${styleFontIconssUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
				
				<title>Cat Colors</title>
			</head>
			<body>
				<div class="browser-view">
				<!-- Media list options -->
					<div class="media-browser-header column">
						<vscode-text-field class="search" placeholder="Search">
							<span slot="start" class="codicon codicon-search"></span>
							<!-- TODO: Support case sensitive search -->
							<!-- <span slot="end" class="codicon codicon-case-sensitive"></span> -->
						</vscode-text-field>
						<div class="list-options expandable">
							<div class="codicon codicon-ellipsis float-right expand-toggler" tabindex="0" role="button" title="Toggle filter options" aria-expanded="false"></div>
							<div class="search-options column expanded-visible">
								<section class="column">
									<p>Filter:</p>
									<vscode-checkbox class="checkbox filter ${MIME_TYPE.audio}" value="${MediaType.audio}">
										<span class="icon-${MIME_TYPE.audio}"></span> ${MediaType.audio}
									</vscode-checkbox>
									<vscode-checkbox class="checkbox filter ${MIME_TYPE.image}" value="${MediaType.image}">
										<span class="icon-${MIME_TYPE.image}"></span> ${MediaType.image}
									</vscode-checkbox>
									<vscode-checkbox class="checkbox filter ${MIME_TYPE.video}" value="${MediaType.video}">
										<span class="icon-${MIME_TYPE.video}"></span> ${MediaType.video}
									</vscode-checkbox>
								</section>
							<!-- TODO: Sort options -->
							</div>
						</div>
					</div>
					<!-- Media list -->
					<ul class="media-list bordered-children" data-insertable="${getActiveTextEditor() !== undefined}">
					</ul>
				</div>

				<!-- Scripts -->
				<script nonce="${nonce}" type="module" src="${scriptToolkitUri}"></script>
				<script nonce="${nonce}" src="${scriptMainUri}"></script>
			</body>
			</html>`;
	}
}
