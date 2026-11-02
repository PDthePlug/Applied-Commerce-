import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export function validateDeliverySample(payload, binding) {
  assert.equal(payload?.plan?.lessonId, binding.lessonId, 'Unexpected lesson in private response');
  const planSHA256 = createHash('sha256').update(JSON.stringify(payload.plan)).digest('hex');
  assert.equal(planSHA256, binding.planSHA256, 'Private response differs from the selected release');
  assert.equal(Object.keys(payload.plan.fields).length, binding.fieldCount);
  return planSHA256;
}

// Keep staging load small and explicit. Rejection waits for in-flight work so a
// failed measurement cannot leave requests running after the browser closes.
export async function boundedDeliveryMap(items, concurrency, request) {
  assert.ok(Number.isInteger(concurrency) && concurrency >= 1 && concurrency <= 4,
    'Staging measurement concurrency must be an integer from 1 to 4');
  let next = 0, failure;
  const results = new Array(items.length);
  await Promise.all(Array.from({length: Math.min(concurrency, items.length)}, async () => {
    while (!failure && next < items.length) {
      const index = next++;
      try { results[index] = await request(items[index], index); }
      catch (error) { failure ??= error; }
    }
  }));
  if (failure) throw failure;
  return results;
}
