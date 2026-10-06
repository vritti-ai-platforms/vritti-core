import { Injectable } from '@nestjs/common';
import axios, { type AxiosInstance } from 'axios';
import { type Msg91Envelope, rejectMsg91Envelope, rethrowMsg91Error } from '../msg91-error.util';

const MSG91_BASE_URL = 'https://control.msg91.com/api';
const REQUEST_TIMEOUT_MS = 15000;
const UNREACHABLE_DETAIL = 'Unable to reach MSG91. Please try again later.';

@Injectable()
export class Msg91HttpService {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({ baseURL: MSG91_BASE_URL, timeout: REQUEST_TIMEOUT_MS });
  }

  async get<T extends Msg91Envelope>(authKey: string, path: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.client.get<T>(path, { params, headers: { authkey: authKey } });
      rejectMsg91Envelope(response.data, UNREACHABLE_DETAIL);
      return response.data;
    } catch (error) {
      rethrowMsg91Error(error, UNREACHABLE_DETAIL);
    }
  }

  async post<T extends Msg91Envelope>(authKey: string, path: string, data?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.client.post<T>(path, data, { headers: { authkey: authKey } });
      rejectMsg91Envelope(response.data, UNREACHABLE_DETAIL);
      return response.data;
    } catch (error) {
      rethrowMsg91Error(error, UNREACHABLE_DETAIL);
    }
  }
}
