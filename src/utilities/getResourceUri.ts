import { Uri } from 'vscode';

export function getResourceUri(path: string) {
	return Uri.file(path);
}