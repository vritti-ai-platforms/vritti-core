import axios from '@vritti/quantum-ui/axios';
import type { ChannelOverviewData } from '@/schemas/catalog-channels';

const BASE = 'commerce-api/site/catalog-channels';

export function getCatalogChannelsOverview(): Promise<ChannelOverviewData[]> {
  return axios.get<ChannelOverviewData[]>(BASE, { showSuccessToast: false }).then((r) => r.data);
}
