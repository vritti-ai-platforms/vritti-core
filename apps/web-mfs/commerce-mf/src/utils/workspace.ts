// The workspace root of a host URL — `/site/<id>`, `/sg/<id>`, `/le/<id>` or `/org/<id>` — for links into another
// feature of the same workspace
export function workspaceBase(pathname: string): string {
  return `/${pathname.split('/').filter(Boolean).slice(0, 2).join('/')}`;
}
