import type { CurriculumIndex, LearningState } from './types';

// Progress describes the current lesson map. Assessment content completion and
// retained historical IDs must not inflate that lesson denominator.
export function lessonProgress(index: CurriculumIndex, completed: LearningState['completed']) {
  const grades = index.grades.map(grade => {
    const ids = [...new Set(grade.lessonIds ?? [])];
    const done = ids.filter(id => Boolean(completed[id])).length;
    return { grade: grade.grade, total: ids.length, done, percent: ids.length ? Math.round(done / ids.length * 100) : 0 };
  });
  const total = grades.reduce((sum, grade) => sum + grade.total, 0);
  const done = grades.reduce((sum, grade) => sum + grade.done, 0);
  return { grades, total, done, percent: total ? Math.round(done / total * 100) : 0 };
}
