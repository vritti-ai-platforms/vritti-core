export interface KotItem {
  id: string;
  orderId: string;
  name: string;
  quantity: number;
  notes: string | null;
  kotNumber: number | null;
  status: string;
  stationId: string | null;
  stationName: string | null;
}
