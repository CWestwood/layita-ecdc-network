// src/main.tsx

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import App from './App';

// ─── TanStack Query client ────────────────────────────────────────────────────
// Global defaults — individual hooks can override staleTime / gcTime as needed.

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:  1000 * 60 * 5,   // 5 min — don't refetch unless data is stale
      gcTime:     1000 * 60 * 10,  // 10 min — keep unused cache in memory
      retry:      1,               // one retry on network failure, then throw
      refetchOnWindowFocus: false, // avoid surprise refetches when switching tabs
    },
  },
});

// ─── Mount ────────────────────────────────────────────────────────────────────



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);