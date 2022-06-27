import * as vscode from 'vscode';
import { useExtensionKey } from './utilities';
import { MediaBrowserViewProvider } from './provider';

export function activate(context: vscode.ExtensionContext) {
	const workspaceUri = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri : undefined;

	const provider = new MediaBrowserViewProvider(context.extensionUri, workspaceUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(MediaBrowserViewProvider.viewType, provider));

	context.subscriptions.push(
		vscode.commands.registerCommand(useExtensionKey('refresh'), () => {
			provider.refresh();
		}));
}
