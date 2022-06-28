import { GlobPattern, Uri, workspace, WorkspaceFolder } from "vscode";

export function currentfolder(): WorkspaceFolder | undefined {
  return workspace.workspaceFolders?.[0];
}

function _getExcludeList(prop: string) {
  const exclude = workspace.getConfiguration(`${prop}.exclude`);
  if (!exclude) {
    return [];
  }

  return Object.entries(exclude ?? {})
    .reduce((p: string[], [glob, enabled = true]) => {
    if (!enabled) {
      return p;
    }

    return [
      ...p,
      glob,
    ];
  }, []);
}

export function getFilesExcludeList() {
  return _getExcludeList('files');
}

export function getSearchExcludeList() {
  return _getExcludeList('search');
}

export function getFiles({
  excluding: exclude = [],
}: {
  excluding?: GlobPattern[],
} = {}): Thenable<Uri[]> {
  const excludeList = [
    ...getFilesExcludeList(),
    ...getSearchExcludeList(),
    ...exclude,
  ];

  return workspace.findFiles('**', `{${excludeList.join(',')}}`);
}