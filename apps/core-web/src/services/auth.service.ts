import axios from '@vritti/quantum-ui/axios';

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken?: string;
  expiresIn?: number;
  isAuthenticated?: boolean;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  expiresIn?: number;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  accessToken: string;
  expiresIn: number;
}

// Authenticates with email and password
export function login(data: LoginDto): Promise<LoginResponse> {
  return axios
    .post<LoginResponse>('auth/login', data)
    .then((r: { data: LoginResponse }) => r.data);
}

// Sends password reset OTP and creates a RESET session
export function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  return axios
    .post<ForgotPasswordResponse>('auth/forgot-password', { email })
    .then((r: { data: ForgotPasswordResponse }) => r.data);
}

// Resends OTP using the RESET session Bearer token
export function resendResetOtp(): Promise<SuccessResponse> {
  return axios
    .post<SuccessResponse>('auth/resend-reset-otp', {})
    .then((r: { data: SuccessResponse }) => r.data);
}

// Verifies OTP using the RESET session Bearer token
export function verifyResetOtp(otp: string): Promise<SuccessResponse> {
  return axios
    .post<SuccessResponse>('auth/verify-reset-otp', { otp })
    .then((r: { data: SuccessResponse }) => r.data);
}

// Resets password and creates a new session
export function resetPassword(newPassword: string): Promise<ResetPasswordResponse> {
  return axios
    .post<ResetPasswordResponse>('auth/reset-password', { newPassword })
    .then((r: { data: ResetPasswordResponse }) => r.data);
}
