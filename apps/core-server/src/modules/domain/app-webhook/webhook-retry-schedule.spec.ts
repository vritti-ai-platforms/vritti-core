import { scheduleAfterFailedAttempt, WEBHOOK_MAX_ATTEMPTS } from './webhook-retry-schedule';

const MINUTE = 60_000;

describe('scheduleAfterFailedAttempt', () => {
  const now = new Date('2026-10-09T12:00:00.000Z');

  it.each([
    [1, 1 * MINUTE],
    [2, 5 * MINUTE],
    [3, 30 * MINUTE],
    [4, 120 * MINUTE],
    [5, 720 * MINUTE],
  ])('retries after attempt %i in the scheduled delay', (attempts, delay) => {
    const decision = scheduleAfterFailedAttempt(attempts, now);

    expect(decision.status).toBe('PENDING');
    expect(decision.nextAttemptAt.getTime() - now.getTime()).toBe(delay);
  });

  it('gives up after the sixth attempt', () => {
    expect(WEBHOOK_MAX_ATTEMPTS).toBe(6);
    expect(scheduleAfterFailedAttempt(6, now).status).toBe('FAILED');
    expect(scheduleAfterFailedAttempt(7, now).status).toBe('FAILED');
  });
});
