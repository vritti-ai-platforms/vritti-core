import type { Readable } from 'node:stream';

export interface UploadParams {
  key: string;
  body: Buffer | Readable;
  contentType: string;
  bucket?: string;
}

export interface StorageProvider {
  upload(params: UploadParams): Promise<string>;
  uploadPublic(key: string, body: Buffer, contentType: string): Promise<string>;
  getPublicUrl(key: string): string;
  delete(key: string, bucket?: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds?: number, bucket?: string): Promise<string>;
  getStream(key: string, bucket?: string): Promise<Readable>;
}
