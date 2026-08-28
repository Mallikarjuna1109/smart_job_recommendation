import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "jobgraph.selectedCandidateId";

interface CandidateContextValue {
  selectedCandidateId: string | null;
  selectCandidate: (id: string | null) => void;
}

const CandidateContext = createContext<CandidateContextValue | undefined>(undefined);

export function CandidateProvider({ children }: { children: ReactNode }) {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (selectedCandidateId) {
        window.localStorage.setItem(STORAGE_KEY, selectedCandidateId);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
    }
  }, [selectedCandidateId]);

  return (
    <CandidateContext.Provider value={{ selectedCandidateId, selectCandidate: setSelectedCandidateId }}>
      {children}
    </CandidateContext.Provider>
  );
}

export function useCandidateContext(): CandidateContextValue {
  const ctx = useContext(CandidateContext);
  if (!ctx) throw new Error("useCandidateContext must be used within a CandidateProvider");
  return ctx;
}
