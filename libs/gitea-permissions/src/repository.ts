// Gitea repository permission codes — MUST match the cloud catalog's authored codes exactly.
// One object per workspace scope the feature is exposed in; codes are scope.feature.permission.
//
// The repository itself is a CRUD record, so it keeps view/add/edit/delete. Actions are not — they are
// executions, and they split by lifecycle stage rather than by verb:
//   `actions.view`       the Actions tab itself; the two families below hang off it
//   `actions.workflows`  the definitions (.gitea/workflows/*.yaml) — `dispatch` starts one against a
//                        caller-chosen ref, `configure` enables or disables it for the whole org
//   `actions.runs`       the executions — `rerun` replays one (bumping runAttempt), `delete` removes it
//                        (Gitea has no cancel endpoint, so that doubles as the only way to stop one)
// `logs` stays top level: the endpoint is job-scoped, not run-scoped, and CI output routinely carries
// secrets and internal hostnames, so it is granted on its own.
export const ORG_REPOSITORIES = {
  featureCode: 'repositories',
  view: 'org.repositories.view',
  add: 'org.repositories.add',
  edit: 'org.repositories.edit',
  delete: 'org.repositories.delete',
  code: {
    view: 'org.repositories.code.view',
  },
  actions: {
    view: 'org.repositories.actions.view',
    workflows: {
      view: 'org.repositories.actions.workflows.view',
      dispatch: 'org.repositories.actions.workflows.dispatch',
      configure: 'org.repositories.actions.workflows.configure',
    },
    runs: {
      view: 'org.repositories.actions.runs.view',
      rerun: 'org.repositories.actions.runs.rerun',
      delete: 'org.repositories.actions.runs.delete',
    },
  },
  logs: {
    view: 'org.repositories.logs.view',
  },
  packages: {
    view: 'org.repositories.packages.view',
  },
} as const;
