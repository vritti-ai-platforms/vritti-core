import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  CreateTaxRegistrationData,
  TaxRegistrationData,
  TaxRegistrationsTableResponse,
  UpdateTaxRegistrationData,
} from '@/schemas/tax-registrations';

// The current page of registrations for the data table (server-state, LE-scoped via RLS)
export function getTaxRegistrationsTable(): Promise<TaxRegistrationsTableResponse> {
  return axios
    .get<TaxRegistrationsTableResponse>('commerce-api/tax-registrations/table', { showSuccessToast: false })
    .then((r) => r.data);
}

export function getTaxRegistration(id: string): Promise<TaxRegistrationData> {
  return axios.get<TaxRegistrationData>(`commerce-api/tax-registrations/${id}`).then((r) => r.data);
}

// The workspace entity is taken from the session, so the body never names one
export function createTaxRegistration(data: CreateTaxRegistrationData): Promise<CreateResponse<TaxRegistrationData>> {
  return axios.post<CreateResponse<TaxRegistrationData>>('commerce-api/tax-registrations', data).then((r) => r.data);
}

export function updateTaxRegistration({
  id,
  data,
}: {
  id: string;
  data: UpdateTaxRegistrationData;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/tax-registrations/${id}`, data).then((r) => r.data);
}

export function deleteTaxRegistration(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/tax-registrations/${id}`).then((r) => r.data);
}
