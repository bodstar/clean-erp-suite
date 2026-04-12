

## Three S&D Module Fixes

### Fix 1 — Remove `disabled` from Add Product button (SDProducts.tsx)
In the `canManage` branch of `addButton`, remove the `disabled` prop so HQ managers can click it.

### Fix 2 — Fix scope param key name (sd.ts)
In `scopeParams`, rename `scope_mode` to `scope` in both return objects.

### Fix 3 — Pass scope to order creation calls (SDOrderCreate.tsx + sd.ts)

**SDOrderCreate.tsx:**
- Import `useSDScope` from `@/providers/SDScopeProvider`
- Add `const { scope } = useSDScope();` in the component
- Pass `scope` to `getPartners`, `getProducts`, `getUnregisteredCustomers` calls
- Pass `scope` to `createSDOrder` call

**sd.ts:**
- Update `createSDOrder` signature to accept optional `scope?: SDScope` second parameter
- Pass `scopeParams(scope)` as axios `params` config

### Files Modified
1. `src/pages/sd/SDProducts.tsx` — remove `disabled` from canManage button
2. `src/lib/api/sd.ts` — rename `scope_mode` → `scope`; update `createSDOrder` signature
3. `src/pages/sd/SDOrderCreate.tsx` — import and use `useSDScope`, pass scope to all relevant API calls

