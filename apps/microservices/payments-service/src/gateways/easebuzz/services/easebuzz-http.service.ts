import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { type AxiosInstance } from 'axios';
import { GATEWAY_HTTP_TIMEOUT_DEFAULT_MS } from '@/config/env.validation';
import { rethrowEasebuzzError } from '../easebuzz-error.util';

export type EasebuzzEnvironment = 'test' | 'production';

// Easebuzz serves checkout and its APIs from two hosts per environment: `pay` opens payments, `dashboard` reads
// transactions and refunds them
export type EasebuzzHost = 'pay' | 'dashboard';

const HOSTS: Record<EasebuzzEnvironment, Record<EasebuzzHost, string>> = {
  test: { pay: 'https://testpay.easebuzz.in', dashboard: 'https://testdashboard.easebuzz.in' },
  production: { pay: 'https://pay.easebuzz.in', dashboard: 'https://dashboard.easebuzz.in' },
};

// HTTP client for the Easebuzz payment gateway. Owns transport concerns only — which host, how long to wait, how a
// failed connection maps to a problem — and stores no merchant credentials: the key and the hash made with the salt
// arrive in each call's form and are never logged
@Injectable()
export class EasebuzzHttpService {
  private readonly client: AxiosInstance;

  constructor(configService: ConfigService) {
    this.client = axios.create({
      timeout: configService.get<number>('GATEWAY_HTTP_TIMEOUT_MS') ?? GATEWAY_HTTP_TIMEOUT_DEFAULT_MS,
    });
  }

  // Where the shopper's browser pays an opened payment
  checkoutUrl(environment: EasebuzzEnvironment, accessKey: string): string {
    return `${HOSTS[environment].pay}/pay/${encodeURIComponent(accessKey)}`;
  }

  // Posts a form and returns Easebuzz's JSON answer, whatever its status flag says
  async postForm<T>(
    environment: EasebuzzEnvironment,
    host: EasebuzzHost,
    path: string,
    fields: Record<string, string>,
  ): Promise<T> {
    try {
      const response = await this.client.post<T>(`${HOSTS[environment][host]}${path}`, new URLSearchParams(fields), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      });
      return response.data;
    } catch (error) {
      rethrowEasebuzzError(error);
    }
  }
}
