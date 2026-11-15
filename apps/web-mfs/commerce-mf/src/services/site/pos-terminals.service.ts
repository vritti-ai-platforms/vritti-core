import axios from '@vritti/quantum-ui/axios';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  CreatePosTerminalData,
  CreatePosTerminalResponse,
  PosTerminalData,
  PosTerminalTableResponse,
  UpdatePosTerminalData,
} from '@/schemas/pos-terminals';

export function getPosTerminalsTable(): Promise<PosTerminalTableResponse> {
  return axios
    .get<PosTerminalTableResponse>('commerce-api/site/pos-terminals/table', { showSuccessToast: false })
    .then((r) => r.data);
}

export function getPosTerminal(id: string): Promise<PosTerminalData> {
  return axios
    .get<PosTerminalData>(`commerce-api/site/pos-terminals/${id}`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function createPosTerminal(data: CreatePosTerminalData): Promise<CreatePosTerminalResponse> {
  return axios.post<CreatePosTerminalResponse>('commerce-api/site/pos-terminals', data).then((r) => r.data);
}

export function updatePosTerminal({ id, data }: { id: string; data: UpdatePosTerminalData }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/site/pos-terminals/${id}`, data).then((r) => r.data);
}

export function deletePosTerminal(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/site/pos-terminals/${id}`).then((r) => r.data);
}
