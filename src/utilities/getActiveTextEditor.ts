import { window } from 'vscode';

export function getActiveTextEditor() {
	return window.activeTextEditor;
}