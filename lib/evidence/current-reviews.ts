import type { EvidenceReview } from "./types";

// An approval of an earlier answer must never certify a revised answer.
export function currentReviews(reviews:Record<string,EvidenceReview>,answers:Record<string,string>){
  return Object.fromEntries(Object.entries(reviews).filter(([key,review])=>
    review.responseValueAtReview!==undefined&&review.responseValueAtReview===answers[key]));
}
