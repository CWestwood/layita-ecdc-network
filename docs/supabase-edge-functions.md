supabase/functions/
  _shared/
    process-payload.ts      ← all business logic
    supabase-client.ts      ← single shared client instance
    types.ts                ← shared TypeScript types
  kobo-fetch/
    index.ts                ← thin: receive webhook → call shared → return response
  reprocess-kobo/
    index.ts                ← thin: receive admin request → call shared → return response