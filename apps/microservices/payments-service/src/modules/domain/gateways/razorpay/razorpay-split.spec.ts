import { Logger } from '@nestjs/common';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import type { RazorpayAuth, RazorpayHttpService } from '@/gateways/razorpay/services/razorpay-http.service';
import type { CreateLinkedAccountInput } from '../gateway-transport';
import { RazorpaySplit } from './razorpay-split';

const CREDENTIALS = { key_id: 'rzp_test_abc', key_secret: 'key-secret' };

const input: CreateLinkedAccountInput = {
  referenceId: 'pla-1',
  email: 'accounts@acme.in',
  phone: '9876543210',
  legalBusinessName: 'Acme Kitchens Pvt Ltd',
  businessType: 'private_limited',
  contactName: 'Asha Rao',
  category: 'ecommerce',
  subcategory: 'ecommerce_marketplace',
  address: { street1: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', postalCode: '560038', country: 'IN' },
  bank: { accountNumber: '50100123456789', ifscCode: 'HDFC0001234', beneficiaryName: 'Acme Kitchens Pvt Ltd' },
};

describe('RazorpaySplit', () => {
  const post = jest.fn();
  const patch = jest.fn();
  const get = jest.fn();
  const http = { post, patch, get } as unknown as RazorpayHttpService;
  const auth = (credentials: Record<string, string>): RazorpayAuth => ({
    keyId: credentials.key_id,
    keySecret: credentials.key_secret,
  });
  const split = new RazorpaySplit(http, auth, new Logger('RazorpaySplitSpec'));

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  describe('createLinkedAccount', () => {
    it('runs account, stakeholder, product and settlement steps and maps the status', async () => {
      post
        .mockResolvedValueOnce({ id: 'acc_1' })
        .mockResolvedValueOnce({ id: 'sth_1' })
        .mockResolvedValueOnce({ id: 'acc_prd_1' });
      patch.mockResolvedValueOnce({ id: 'acc_prd_1', activation_status: 'under_review' });

      const result = await split.createLinkedAccount(CREDENTIALS, input);

      expect(post.mock.calls.map((call) => call[1])).toEqual([
        '/accounts',
        '/accounts/acc_1/stakeholders',
        '/accounts/acc_1/products',
      ]);
      expect(patch.mock.calls[0][2]).toMatchObject({
        settlements: { account_number: '50100123456789', ifsc_code: 'HDFC0001234' },
      });
      expect(result).toMatchObject({
        providerAccountId: 'acc_1',
        providerData: { stakeholderId: 'sth_1', productId: 'acc_prd_1' },
        status: 'IN_REVIEW',
        setupError: null,
      });
      expect(result.transfersAllowedAt).not.toBeNull();
    });

    it('returns the ids and a setup error when a step after account creation fails', async () => {
      post
        .mockResolvedValueOnce({ id: 'acc_1' })
        .mockRejectedValueOnce(new BadRequestException({ label: 'Gateway Rejected Request', detail: 'Bad email' }));

      const result = await split.createLinkedAccount(CREDENTIALS, input);

      expect(result).toMatchObject({
        providerAccountId: 'acc_1',
        providerData: {},
        status: 'PENDING',
        transfersAllowedAt: null,
        setupError: { label: 'Gateway Rejected Request', detail: 'Bad email' },
      });
    });

    it('throws when the account itself cannot be created, since nothing exists at the gateway yet', async () => {
      post.mockRejectedValueOnce(new BadRequestException('Invalid business type'));

      await expect(split.createLinkedAccount(CREDENTIALS, input)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('resumes from the failed step without creating a second account or stakeholder', async () => {
      post.mockResolvedValueOnce({ id: 'acc_prd_1' });
      patch.mockResolvedValueOnce({ id: 'acc_prd_1', activation_status: 'activated' });

      const result = await split.createLinkedAccount(CREDENTIALS, input, {
        providerAccountId: 'acc_1',
        providerData: { stakeholderId: 'sth_1' },
      });

      expect(post).toHaveBeenCalledTimes(1);
      expect(post.mock.calls[0][1]).toBe('/accounts/acc_1/products');
      expect(result).toMatchObject({
        providerAccountId: 'acc_1',
        providerData: { stakeholderId: 'sth_1', productId: 'acc_prd_1' },
        status: 'ACTIVE',
        setupError: null,
      });
    });

    it('refuses an account without a business category before calling Razorpay', async () => {
      await expect(split.createLinkedAccount(CREDENTIALS, { ...input, category: undefined })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(post).not.toHaveBeenCalled();
    });
  });

  describe('fetchLinkedAccountStatus', () => {
    it('reads the Route product and maps its state and requirements', async () => {
      get.mockResolvedValueOnce({
        activation_status: 'needs_clarification',
        requirements: [{ field_reference: 'settlements.beneficiary_name' }],
      });

      const result = await split.fetchLinkedAccountStatus(CREDENTIALS, {
        providerAccountId: 'acc_1',
        providerData: { productId: 'acc_prd_1' },
      });

      expect(get.mock.calls[0][1]).toBe('/accounts/acc_1/products/acc_prd_1');
      expect(result).toEqual({ status: 'ACTION_REQUIRED', requirements: ['settlements.beneficiary_name'] });
    });

    it('refuses an account with no product reference', async () => {
      await expect(
        split.fetchLinkedAccountStatus(CREDENTIALS, { providerAccountId: 'acc_1', providerData: {} }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
