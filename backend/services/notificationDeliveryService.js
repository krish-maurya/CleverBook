import 'dotenv/config';

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://webhook.site/d8c272b7-4b88-4aa4-9b05-fc23c0d836d9';

export async function sendWebhook(payload) {
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': payload.idempotencyKey
    },
    body: JSON.stringify({
      merchantId: payload.merchantId,
      awbNumber: payload.awbNumber,
      discrepancyType: payload.discrepancyType,
      expectedValue: payload.expectedValue,
      actualValue: payload.actualValue,
      suggestedAction: payload.suggestedAction,
      timestamp: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`Webhook failed with status ${response.status}: ${response.statusText}`);
  }

  const responseData = await response.text();
  return { status: response.status, data: responseData };
}

export default {
  sendWebhook
};