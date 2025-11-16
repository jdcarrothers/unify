# Unify - Copilot Instructions

## Project Overview
Unify is a Nuxt 4 financial dashboard that aggregates data from Trading212 (investment platform) and TrueLayer (open banking). It provides unified transaction views, analytics, and visualizations across bank accounts, credit cards, and investment accounts.

## Architecture

### Data Flow & Real-time Updates
- **Server-Sent Events (SSE)**: The app uses SSE for real-time updates via `/api/transactions/stream` 
  - Clients register with `registerClient()` in `server/api/utils/finance-stream.ts`
  - Server broadcasts `status` (pending/ready/error) and `update` (data changes) events
  - Frontend listens via `useFinanceStream()` composable
- **Dual Cache Strategy**: 
  - Server-side: Nitro storage (`useStorage('data')`) for API endpoints
  - Client-side: localStorage with `nuxt:data:` prefix for composables
  - Cache files defined in `app/const/index.ts`: `user-config.json`, `trading-transactions.json`, etc.

### Demo Mode Pattern
Demo mode is a first-class feature using a global singleton pattern:
- `useDemoMode()` uses module-level `ref` with localStorage persistence (`unify-demo-mode` key)
- When enabled, all data fetching switches to `/api/transactions/demo` endpoint
- SSE stream is bypassed in demo mode (see `useFinancialData.ts` line 23-26)
- Components conditionally render demo badge (see `pages/index.vue`)

### External API Integration
- **Trading212**: Basic auth via key/secret stored in user config
  - Export job pattern: create job → poll for completion → download CSV → parse
  - See `useTradingApi()` composable for async export workflow
- **TrueLayer**: OAuth2 with token refresh managed by `useTruelayerAuth()`
  - Callback handler at `/api/truelayer/callback` exchanges code for tokens
  - Tokens stored in user config with expiry timestamp
  - Auto-refresh in `getValidToken()` when `expires_at` is near

## Key Conventions

### File Organization
- **Composables**: 
  - API wrappers: `useTradingApi`, `useTruelayerApi` (pure API logic)
  - Data managers: `useTrading`, `useTruelayerCards`, `useTruelayerAccounts` (cache + API)
  - UI state: `useDashboard`, `useDemoMode`, `useFinanceStream`
- **Server API Routes**: All use `defineEventHandler` from h3
  - GET endpoints: `*.get.ts` (e.g., `status.get.ts`)
  - Other methods: `*.post.ts`, `*.put.ts`
  - No method suffix = handles all methods (e.g., `stream.ts` for SSE)

### Type Patterns
- `FinancialTransaction`: Unified type for all transaction sources (see `types/index.d.ts`)
  - Always has: `type`, `amount`, `reference`, `dateTime`, `source`, `category`, `description`
  - Source discriminator: `'trading212' | 'bank-account' | 'credit-card'`
- `CombinedFinancialData`: Top-level response shape with `totalBalance` and `transactions[]`

### Transaction Categorization
Inline categorization logic in `/api/transactions/index.ts` (lines 47-70):
- Reimbursements: deposits <£50 matching keywords ('fuel', 'petrol', 'mot', 'wine', 'money')
- Excludes payroll/salary/Trading212/Vinted/Mangopay from reimbursement detection
- This is NOT in a separate module - modify directly in the endpoint handler

**User-Defined Category Rules**:
- Rules stored in localStorage via `useCategorisation()` composable
- Each rule has: `name`, `keywords[]`, `color`, `icon`, `id`, timestamps
- **Transaction Overrides**: Users can manually assign categories to specific transactions via `setTransactionCategory(transactionRef, categoryName)`
  - Overrides stored in `unify-transaction-category-overrides` localStorage key
  - Override takes priority over keyword matching
- Matching: case-insensitive keyword search in transaction descriptions (fallback if no override)
- Applied server-side in `transactions/index.ts` after deduplication
- **UI Components**:
  - `pages/rules.vue` - CRUD for rules using `UPageGrid`, `UPageCard`, `UDropdownMenu`, `UEmpty`
  - `pages/categories.vue` - Stats with `UAccordion`, `UTable`, `USelectMenu` for per-transaction category changes
  - `components/categories/RuleFormModal.vue` - Modal for creating/editing rules

### Deduplication Strategy
Bank withdrawals to Trading212 are matched against Trading212 deposits to avoid double-counting:
- Create set of withdrawal transaction IDs by matching descriptions (line 99-102 in `transactions/index.ts`)
- Filter out matching Trading212 deposits using this set (line 104-108)
- Critical for accurate balance calculations

## Development Workflow

### Setup
```bash
pnpm install
touch .env
# Add: CLIENT_ID=<truelayer-client-id>
# Add: CLIENT_SECRET=<truelayer-client-secret>
pnpm dev  # Runs on localhost:3000
```

### Commands
- `pnpm dev`: Start Nuxt dev server
- `pnpm build`: Production build
- `pnpm lint`: ESLint with @nuxt/eslint config
- `pnpm typecheck`: Vue + TypeScript checking via vue-tsc

### ESLint Configuration
ESLint uses Nuxt's auto-generated config with overrides in `eslint.config.mjs`:
- Multiple template roots allowed (`vue/no-multiple-template-root: off`)
- Max 3 attributes per line for single-line tags
- Stylistic rules: no comma dangles, 1TBS brace style (set in `nuxt.config.ts`)

### UI Framework
- **@nuxt/ui v4**: Comprehensive component library - ALWAYS use these components
  - Layout: `UDashboardPanel`, `UDashboardNavbar`, `UPageGrid`, `UPageCard`
  - Data: `UTable`, `UAccordion`, `UEmpty`, `UProgress`, `UBadge`
  - Forms: `UInput`, `USelectMenu`, `UButton`, `UFormGroup`
  - Overlays: `UModal`, `UDropdownMenu`, `UAlert`
  - Color system: `primary: 'green'`, `neutral: 'zinc'` (see `app.config.ts`)
  - **Critical**: Use `UDropdownMenu` NOT `UDropdown`, use `USelectMenu` for dropdowns with options
- **Unovis**: Charts via `@unovis/vue` (see `HomeChart.client.vue`)
- **VueUse**: Utilities via `@vueuse/nuxt` (e.g., `createSharedComposable` in `useDashboard.ts`)

## Important Gotchas

1. **Cache Writes Server-Side Only**: `useCache().write()` only works in server context (Nitro storage). Client reads use localStorage.

2. **Composable Server/Client Duality**: Many composables check `import.meta.server` to switch storage backends (see `useCache.ts` line 10-24).

3. **Stream Endpoint Returns Early**: `/api/transactions/stream` calls `registerClient()` and returns immediately - connection stays open via SSE.

4. **Trading212 Export Polling**: Don't call `getDownloadUrlForReport()` immediately after `createExportJob()` - poll with delay for `status: 'FINISHED'`.

5. **Token Expiry Buffer**: TrueLayer token refresh happens 5 minutes before actual expiry to prevent race conditions (check `useTruelayerAuth.ts`).

6. **Package Manager**: Use `pnpm` exclusively - project has `pnpm-workspace.yaml` and enforces `pnpm@10.19.0`.

## Example Patterns

### Adding a New Data Source
1. Create types in `app/types/<source>.ts`
2. Add API composable: `use<Source>Api.ts` (API calls only)
3. Add cache composable: `use<Source>.ts` (wraps API with `useCache()`)
4. Update `server/api/transactions/index.ts` to include in `CombinedFinancialData`
5. Add source to `FinanceSource` union type in `types/finance-stream.ts`
6. Implement SSE broadcast in sync endpoint if real-time updates needed

### Adding a Transaction Filter
Modify `server/api/transactions/index.ts` after all transactions are combined (around line 95+). Don't create separate utilities - keep filtering logic inline for clarity.
