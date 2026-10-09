"use client";

import { createContext, useContext } from "react";

export type FacilitatorAccess = {
  userId: string;
  isPlatformAdmin: boolean;
  cohortIds: string[];
};

const FacilitatorAccessContext = createContext<FacilitatorAccess | null>(null);

export const FacilitatorAccessProvider = FacilitatorAccessContext.Provider;

export function useFacilitatorAccess() {
  return useContext(FacilitatorAccessContext);
}
