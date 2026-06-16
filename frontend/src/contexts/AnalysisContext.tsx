'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { AnalyseResponse } from '@/lib/api';

interface AnalysisContextType {
  data: AnalyseResponse | null;
  setData: (data: AnalyseResponse | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AnalyseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <AnalysisContext.Provider value={{ data, setData, isLoading, setIsLoading }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}
