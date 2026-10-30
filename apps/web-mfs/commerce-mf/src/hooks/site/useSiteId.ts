import { useParams } from 'react-router-dom';

// The site of a site-workspace page — the host mounts site features under `/site/:workspaceId/*`
export function useSiteId(): string {
  return useParams<{ workspaceId: string }>().workspaceId ?? '';
}
