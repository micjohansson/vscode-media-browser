import * as vscode from 'vscode';
import { useExtensionKey } from './utilities';
import { MediaBrowserViewProvider } from './provider';

export function activate(context: vscode.ExtensionContext) {
	const provider = new MediaBrowserViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(MediaBrowserViewProvider.viewType, provider));

	context.subscriptions.push(
		vscode.commands.registerCommand(useExtensionKey('refresh'), () => {
			provider.refresh();
		}));
}
