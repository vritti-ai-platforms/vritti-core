import type { PushScreenConfig } from '@vritti/quantum-ui-native/PushNavigator';
import { WorkspaceSelectionScreen } from '../../screens/workspace/WorkspaceSelectionScreen';

export type WorkspaceRoute = 'SelectWorkspace';

// Sibling of HomeTabs in the authenticated native-stack. The detached tab-bar "workspace" button pushes
// this (native slide-in); selecting a workspace pops back to HomeTabs. It's also the initial route on a
// fresh login before any workspace is chosen.
export const workspaceRoutes: ReadonlyArray<PushScreenConfig<WorkspaceRoute>> = [
  { name: 'SelectWorkspace', component: WorkspaceSelectionScreen, title: 'Switch workspace' },
];
