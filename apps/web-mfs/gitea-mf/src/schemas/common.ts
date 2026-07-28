// Response envelopes shared by every feature in this MF — they mirror api-sdk's
// CreateResponseDto / SuccessResponseDto.

export interface CreateResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}
