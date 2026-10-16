import type { EvidenceReview } from "./types";

export function currentReview(review:EvidenceReview|undefined,answer:string|undefined){
  return review?.responseValueAtReview!==undefined&&review.responseValueAtReview===answer?review:undefined;
}

// A saved pending review is work in progress, not a completed decision.
export function hasReviewDecision(review:EvidenceReview|undefined):review is EvidenceReview{
  return review!==undefined&&["accepted","needs-revision","verified"].includes(review.status);
}

// An approval of an earlier answer must never certify a revised answer.
export function currentReviews(reviews:Record<string,EvidenceReview>,answers:Record<string,string>){
  return Object.fromEntries(Object.entries(reviews).filter(([key,review])=>
    currentReview(review,answers[key])!==undefined));
}
