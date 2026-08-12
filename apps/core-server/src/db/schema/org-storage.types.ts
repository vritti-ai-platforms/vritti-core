// Organization storage descriptor types — the shapes cloud-server (the control plane) hands to core-server. Kept here
// as core's own copy rather than shared through api-sdk (which stays a generic storage client); the two servers hold
// matching definitions of this small wire contract. Only the fields core-server reads are modelled.

// Just the S3 pair — sent when a credential is rotated.
export interface OrgCredential {
  accessKeyId: string;
  secretAccessKey: string;
}

// One org's own storage: its buckets and the credential scoped to them, provisioned by cloud-server and stored on the
// organization row. The endpoint is derived from accountId (https://<accountId>.r2.cloudflarestorage.com).
export interface OrgStorage {
  provider: 'r2';
  accountId: string;
  bucket: string;
  publicBucket: string;
  // Public base URL of publicBucket; null when public access could not be enabled.
  publicUrl: string | null;
  accessKeyId: string;
  // Whatever the writer stored — plaintext or ciphertext. Readers must apply the same treatment as the writer.
  secretAccessKey: string;
  createdAt: string;
}
