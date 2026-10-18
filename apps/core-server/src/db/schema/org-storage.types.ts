// Organization storage descriptor types — the shapes cloud-server (the control plane) hands to core-server.

export interface OrgCredential {
  accessKeyId: string;
  secretAccessKey: string;
}

export interface OrgStorage {
  provider: 'r2';
  accountId: string;
  bucket: string;
  publicBucket: string;
  publicUrl: string | null;
  accessKeyId: string;
  secretAccessKey: string;
  createdAt: string;
}
