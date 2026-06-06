// TEMPORARY diagnostic — MF runtime plugin that names the failing shared module behind
// "getter is not a function". Logs every share resolution + remote-load error, then remove.
export default function shareLogger() {
  return {
    name: 'share-logger',
    resolveShare(args: any) {
      console.log(
        '[MF resolveShare]',
        args.pkgName,
        'required=',
        args.version,
        'scopeHas=',
        Object.keys(args.shareScopeMap?.[args.scope]?.[args.pkgName] ?? {}),
      );
      return args;
    },
    errorLoadRemote(args: any) {
      console.log('[MF errorLoadRemote]', args.id ?? args.pkgName, '→', args.error?.message);
      return args;
    },
  };
}
