import { createHash, timingSafeEqual } from 'node:crypto';

// The ten user-defined fields every Easebuzz hash runs through; this integration leaves them all empty
export const EASEBUZZ_UDF_COUNT = 10;

// The fields a payment is opened with that its request hash covers
export interface EasebuzzRequestFields {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf: readonly string[];
}

// What Easebuzz posts back about a transaction — to the return URLs, to the webhook, and from the Transaction API
export type EasebuzzTransactionFields = Readonly<Record<string, string | undefined>>;

function sha512Hex(parts: readonly string[]): string {
  return createHash('sha512').update(parts.join('|')).digest('hex');
}

function udfs(udf: readonly string[]): string[] {
  return Array.from({ length: EASEBUZZ_UDF_COUNT }, (_, index) => udf[index] ?? '');
}

// Opening a payment: SHA-512 of key|txnid|amount|productinfo|firstname|email|udf1..udf10|salt
export function requestHash(fields: EasebuzzRequestFields, salt: string): string {
  return sha512Hex([
    fields.key,
    fields.txnid,
    fields.amount,
    fields.productinfo,
    fields.firstname,
    fields.email,
    ...udfs(fields.udf),
    salt,
  ]);
}

// A transaction Easebuzz reports back: SHA-512 of salt|status|udf10..udf1|email|firstname|productinfo|amount|txnid|key,
// led by additional_charges| when Easebuzz added a convenience fee
export function reverseHash(fields: EasebuzzTransactionFields, salt: string): string {
  const reversedUdfs = Array.from(
    { length: EASEBUZZ_UDF_COUNT },
    (_, index) => fields[`udf${EASEBUZZ_UDF_COUNT - index}`] ?? '',
  );
  const charges = fields.additional_charges?.trim();
  return sha512Hex([
    ...(charges ? [charges] : []),
    salt,
    fields.status ?? '',
    ...reversedUdfs,
    fields.email ?? '',
    fields.firstname ?? '',
    fields.productinfo ?? '',
    fields.amount ?? '',
    fields.txnid ?? '',
    fields.key ?? '',
  ]);
}

// Reading a transaction: SHA-512 of key|txnid|salt
export function transactionHash(key: string, txnid: string, salt: string): string {
  return sha512Hex([key, txnid, salt]);
}

// Refunding a payment: SHA-512 of key|merchant_refund_id|easebuzz_id|refund_amount|salt
export function refundHash(key: string, refundId: string, easebuzzId: string, amount: string, salt: string): string {
  return sha512Hex([key, refundId, easebuzzId, amount, salt]);
}

// Checks a reported transaction's hash against the salt, in constant time
export function verifyReverseHash(fields: EasebuzzTransactionFields, salt: string): boolean {
  const received = fields.hash?.trim().toLowerCase();
  if (!received) return false;
  const expected = Buffer.from(reverseHash(fields, salt), 'utf8');
  const actual = Buffer.from(received, 'utf8');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
