import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const BlindSpotsContext = createContext(null);

export function BlindSpotsProvider({ children }) {
  const [analysis, setAnalysis] = useState(null);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
  }, []);

  const value = useMemo(() => ({
    analysis,
    setAnalysis,
    clearAnalysis,
  }), [analysis, clearAnalysis]);

  return (
    <BlindSpotsContext.Provider value={value}>
      {children}
    </BlindSpotsContext.Provider>
  );
}

export function useBlindSpots() {
  const context = useContext(BlindSpotsContext);
  if (!context) {
    throw new Error('useBlindSpots must be used within BlindSpotsProvider');
  }
  return context;
}
