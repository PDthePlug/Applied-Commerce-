export type FacilitatorSection = 'overview' | 'learners' | 'review' | 'coverage' | 'reports' | 'rubrics';

// A URL can carry selection, never authority. Only the backend-authorized roster
// may resolve the requested learner; stale or unrelated IDs fall back safely.
export function selectedRosterLearner(learners: Array<{id: string}>, requestedId: string) {
  return learners.some(learner => learner.id === requestedId) ? requestedId : learners[0]?.id ?? '';
}

export function facilitatorSectionHref(section: FacilitatorSection, learnerId: string) {
  const path = section === 'overview' ? '/facilitator' : `/facilitator/${section}`;
  return learnerId ? `${path}?${new URLSearchParams({learner: learnerId})}` : path;
}
