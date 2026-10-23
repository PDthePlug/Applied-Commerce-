import assert from 'node:assert/strict';

// An explicit batch scope must never silently fall back to a partial match.
// Omitting the variable retains the full-release check.
export function stagingLessonScope(plans, raw) {
 if (raw === undefined) return {plans, scope: 'all released guides', releasedPlans: plans.length};
 const ids = raw.split(',');
 assert.ok(ids.length && ids.every(Boolean), 'Empty staging lesson selection');
 assert.equal(new Set(ids).size, ids.length, 'Duplicate staging lesson selection');
 assert.ok(ids.every(id => plans.some(plan => plan.lessonId === id)), 'Unknown staging lesson selection');
 return {plans: plans.filter(plan => ids.includes(plan.lessonId)), scope: 'explicit selected lessons', releasedPlans: plans.length};
}
