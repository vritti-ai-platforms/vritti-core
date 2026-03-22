import type { AxiosResponse } from 'axios';
import axios from '@vritti/quantum-ui/axios';
import type { CreateStationInput, Station, UpdateStationInput } from '../schemas';

interface SuccessResponse {
  success: boolean;
  message: string;
}

// Fetches all stations for an org+bu
export function getStations(businessUnitId: string): Promise<Station[]> {
  return axios
    .get<Station[]>('commerce-api/stations', { params: { businessUnitId } })
    .then((r: AxiosResponse<Station[]>) => r.data);
}

// Fetches a single station by ID
export function getStationById(id: string): Promise<Station> {
  return axios.get<Station>(`commerce-api/stations/${id}`).then((r: AxiosResponse<Station>) => r.data);
}

// Creates a new station
export function createStation(
  data: CreateStationInput & { businessUnitId: string },
): Promise<Station> {
  return axios
    .post<Station>('commerce-api/stations', data, { successMessage: 'Station created' })
    .then((r: AxiosResponse<Station>) => r.data);
}

// Updates an existing station
export function updateStation(id: string, data: UpdateStationInput): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/stations/${id}`, data, { successMessage: 'Station updated' })
    .then((r: AxiosResponse<SuccessResponse>) => r.data);
}

// Deletes a station
export function deleteStation(id: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/stations/${id}`, { successMessage: 'Station deleted' })
    .then((r: AxiosResponse<SuccessResponse>) => r.data);
}
