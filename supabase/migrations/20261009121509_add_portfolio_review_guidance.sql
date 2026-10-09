alter table public.evidence_reviews
  add column if not exists portfolio_interpretation text not null default '',
  add column if not exists next_pathway text not null default '';

comment on column public.evidence_reviews.portfolio_interpretation is
  'Facilitator validation or correction of the learner portfolio interpretation.';
comment on column public.evidence_reviews.next_pathway is
  'Facilitator-recommended next learning experience, grounded in reviewed evidence.';
