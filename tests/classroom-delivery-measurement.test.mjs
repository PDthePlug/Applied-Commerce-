import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {boundedDeliveryMap, validateDeliverySample} from '../scripts/lib/classroom-delivery-measurement.mjs';

test('delivery evidence rejects changed content even when identity and field count match', () => {
  const plan = {lessonId: 'example', fields: {cue: 'Original private cue'}};
  const binding = {lessonId: plan.lessonId, fieldCount: 1,
    planSHA256: createHash('sha256').update(JSON.stringify(plan)).digest('hex')};
  assert.equal(validateDeliverySample({plan}, binding), binding.planSHA256);
  assert.throws(() => validateDeliverySample({plan: {...plan, fields: {cue: 'Changed'}}}, binding),
    /differs from the selected release/);
});

test('bounded requests overlap without exceeding the configured cap and retain input order', async () => {
  let active = 0, peak = 0;
  const result = await boundedDeliveryMap([0, 1, 2, 3, 4, 5], 3, async value => {
    active++; peak = Math.max(peak, active);
    await new Promise(resolve => setTimeout(resolve, value % 2 ? 1 : 5));
    active--; return value * 2;
  });
  assert.equal(peak, 3); assert.equal(active, 0);
  assert.deepEqual(result, [0, 2, 4, 6, 8, 10]);
});

test('failure drains in-flight requests and stops scheduling further work', async () => {
  const started = [], completed = [];
  await assert.rejects(boundedDeliveryMap([0, 1, 2, 3], 2, async value => {
    started.push(value);
    if (value === 0) throw Error('Synthetic request failure');
    await new Promise(resolve => setTimeout(resolve, 5)); completed.push(value);
  }), /Synthetic request failure/);
  assert.deepEqual(started, [0, 1]); assert.deepEqual(completed, [1]);
  await assert.rejects(boundedDeliveryMap([0], 5, async () => 0), /integer from 1 to 4/);
});
