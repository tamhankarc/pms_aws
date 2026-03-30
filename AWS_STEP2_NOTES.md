# Step 2 notes - first AWS-ready API boundary

This step adds the first AWS-facing pieces without changing current PMS behavior.

## Added in this step

1. `app/api/auth/api-token/route.ts`
   - returns a short-lived Bearer token for AWS API calls
2. `lib/api-token.ts`
   - shared API JWT signing and verification helpers
3. `backend/`
   - starter Lambda/API code for:
     - health
     - auth/me
     - lookups (clients/countries/movies)
     - projects list/detail
4. `lib/permissions.ts`
   - adjusted so shared permission logic is no longer coupled to Next session types

## Current behavior

The existing Vercel PMS continues to run exactly as before.
Nothing in the UI has been switched to AWS yet.

## Recommended next implementation slice

- deploy the backend Lambda
- create API Gateway HTTP API routes
- test `/health`
- test `/auth/me` with token from `/api/auth/api-token`
- then switch one read-only screen such as clients/countries/movies/projects list gradually
