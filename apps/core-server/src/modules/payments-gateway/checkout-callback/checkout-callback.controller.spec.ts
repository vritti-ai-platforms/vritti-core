import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import fastifyRawBody from 'fastify-raw-body';
import { CheckoutCallbackController } from './checkout-callback.controller';
import { CheckoutCallbackService } from './services/checkout-callback.service';

const ORG = '0199e000-0000-7000-8000-000000000001';
const INTENT = '0199e000-0000-7000-8000-0000000000aa';

// Boots the controller on a real Fastify instance, registered the way main.ts registers it, to prove the gateway's
// form post parses with the raw-body plugin in place and that the outcome is written as a 303 or a page
describe('CheckoutCallbackController', () => {
  let app: NestFastifyApplication;
  const handleCallback = jest.fn();
  const handleCancel = jest.fn();
  const handleRevisit = jest.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CheckoutCallbackController],
      providers: [{ provide: CheckoutCallbackService, useValue: { handleCallback, handleCancel, handleRevisit } }],
    }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), { logger: false });
    await app.register(fastifyRawBody, { field: 'rawBody', global: true, encoding: 'utf8', runFirst: true });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.resetAllMocks());

  it('parses the url-encoded form post, bracketed keys included, and answers a 303', async () => {
    handleCallback.mockResolvedValue({ kind: 'redirect', location: 'https://shop.example/thanks?intent=1' });

    const response = await app.inject({
      method: 'POST',
      url: `/payments/checkout/${ORG}/${INTENT}/callback`,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: 'error%5Bcode%5D=BAD_REQUEST_ERROR&error%5Bdescription%5D=Card+declined&razorpay_order_id=order_1',
    });

    expect(response.statusCode).toBe(303);
    expect(response.headers.location).toBe('https://shop.example/thanks?intent=1');
    expect(response.headers['cache-control']).toBe('no-store');
    const [, orgId, intentId, body] = handleCallback.mock.calls[0];
    expect([orgId, intentId]).toEqual([ORG, INTENT]);
    expect({ ...body }).toEqual({
      'error[code]': 'BAD_REQUEST_ERROR',
      'error[description]': 'Card declined',
      razorpay_order_id: 'order_1',
    });
  });

  it('writes a static page as html with a 200', async () => {
    handleCallback.mockResolvedValue({ kind: 'page', html: '<p>Done</p>' });

    const response = await app.inject({
      method: 'POST',
      url: `/payments/checkout/${ORG}/${INTENT}/callback`,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: 'razorpay_payment_id=pay_1',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.body).toBe('<p>Done</p>');
  });

  it('routes the cancel and the GET revisit to their handlers', async () => {
    handleCancel.mockResolvedValue({ kind: 'redirect', location: 'https://shop.example/checkout?payment=cancelled' });
    handleRevisit.mockResolvedValue({ kind: 'redirect', location: 'https://shop.example/checkout' });

    const cancel = await app.inject({ method: 'GET', url: `/payments/checkout/${ORG}/${INTENT}/cancel` });
    const revisit = await app.inject({ method: 'GET', url: `/payments/checkout/${ORG}/${INTENT}/callback` });

    expect(cancel.statusCode).toBe(303);
    expect(cancel.headers.location).toBe('https://shop.example/checkout?payment=cancelled');
    expect(revisit.statusCode).toBe(303);
    expect(handleRevisit).toHaveBeenCalledWith(expect.anything(), ORG, INTENT);
  });

  it('refuses ids that are not uuids before reaching the service', async () => {
    const response = await app.inject({ method: 'GET', url: `/payments/checkout/not-an-org/${INTENT}/cancel` });

    expect(response.statusCode).toBe(400);
    expect(handleCancel).not.toHaveBeenCalled();
  });
});
