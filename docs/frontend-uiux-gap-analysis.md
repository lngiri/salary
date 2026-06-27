# Frontend UI/UX Gap Analysis — Nepal Salary Sheet App

**Scope:** `/mnt/c/Users/Asus/Salary/frontend/src`  
**Date:** 2026-06-26  
**Focus:** Functional UX + broken user flows (not accessibility/performance)  
**Method:** Code review of all frontend pages/components against backend controllers and `Prompt.txt`

---

## Executive Summary

The frontend is built with React + Vite + TypeScript + Tailwind + TanStack Query and visually follows a clean admin-dashboard pattern. However, **multiple core user flows are currently broken** because the frontend types and API consumption do not match the backend contract. The most severe issues are:

1. **Missing backend routes** for fiscal-year config break `PayrollRun`, `Settings`, and `Reports`.
2. **Response-shape mismatches** break `Dashboard`, `Employees` list/detail, `PayrollRun`, `PayrollHistory`, and the original `PayrollDetail`/`Payslip`.
3. **Frontend `Employee` / `PayrollPeriod` types** drifted from the Prisma schema, causing silent runtime failures even though TypeScript compiles.
4. **Several spec-mandated features are missing**: edit employee, CSV import, salary history, full settlement display, quarterly E-TDS.

---

## Cross-Cutting Themes

| Theme | Impact |
|-------|--------|
| **Missing `/api/config/fiscal-years`** | Blocks payroll run, fiscal-year settings, and report downloads entirely. |
| **Response-shape assumptions** | Dashboard reads `{ count }`, employees reads `{ employees }`, payroll reads `{ periods }` — none of which the backend returns. |
| **Type drift from Prisma** | `Employee.status`, `PayrollPeriod.status`, `Employee.fullName`, `joinDate`, etc. do not match backend. |
| **Salary-head management is half-built** | GET/PUT `legalReference` exist, but POST and full-field updates do not. |
| **Poor error handling** | Generic "Failed" messages hide backend diagnostics. |
| **Missing spec features** | Edit employee, CSV import, salary history, full settlement, quarterly reports. |

---

## Critical Gaps (Break Core Flows)

### C1 — Missing `/api/config/fiscal-years` breaks Payroll, Settings, Reports
- **Files:** `pages/PayrollRun.tsx`, `pages/Settings.tsx`, `pages/Reports.tsx`
- **Backend:** No `config` routes or controller mounted in `backend/src/index.ts`.
- **Impact:** Fiscal-year dropdowns 404; users cannot run payroll, configure fiscal years, or generate reports.
- **Fix:** Create `backend/src/routes/config.ts` + controller with GET/POST/PUT `/api/config/fiscal-years`.
- **Effort:** Medium

### C2 — Dashboard stat cards always show `0`
- **File:** `pages/Dashboard.tsx`
- **Backend returns:** `{ data: [...], meta: { page, limit, total, totalPages } }` for employees; `{ data, page, limit, total }` for payroll periods.
- **Frontend expects:** `{ count: number }` for both.
- **Impact:** Dashboard appears empty even with seeded data.
- **Fix:** Read `response.data.meta.total` and `response.data.total`.
- **Effort:** Small

### C3 — Employees list renders empty due to response-shape mismatch
- **File:** `pages/Employees.tsx`
- **Backend returns:** `{ data: Employee[], meta: {...} }`
- **Frontend expects:** `{ employees: Employee[], total, page, limit }`
- **Impact:** Employee list is blank.
- **Fix:** Align query to `response.data.data` / `response.data.meta`.
- **Effort:** Small

### C4 — Employee detail page renders wrong/blank data
- **File:** `pages/EmployeeDetail.tsx`
- **Backend fields:** `firstName`, `lastName`, `pan`, `dateOfJoining`, `status: 'ACTIVE' \| 'INACTIVE'`, `salaryStructures`.
- **Frontend expects:** `fullName`, `employeeId`, `joinDate`, `status: 'active' \| 'inactive'`.
- **Impact:** Name, PAN, join date, and status badge are wrong or blank.
- **Fix:** Update `Employee` type and rendering to match backend; add computed `fullName` where needed.
- **Effort:** Medium

### C5 — Salary structure table is broken
- **File:** `pages/EmployeeDetail.tsx`
- **Backend returns:** array directly; field `monthlyAmount`; `salaryHead.type` is `'EARNING' \| 'DEDUCTION'`.
- **Frontend expects:** `{ structures: [...] }`; field `amount`; type `'earning' \| 'deduction'`.
- **Impact:** Structures don't load and amount/type display is wrong.
- **Fix:** Read array directly; use `monthlyAmount`; align types.
- **Effort:** Small

### C6 — Deactivation final settlement display is wrong
- **File:** `pages/EmployeeDetail.tsx`
- **Backend returns:** full `FinalSettlement` object with `unpaidSalary`, `leaveEncashment`, `gratuity`, `manualDeductions`, `grossSettlement`, `netSettlement`.
- **Frontend expects:** `{ message, finalSettlement: { totalEarnings, totalDeductions, netPayable } }`.
- **Impact:** Settlement modal shows undefined/blank values.
- **Fix:** Update `DeactivationResult` type and render all backend fields.
- **Effort:** Medium

### C7 — PayrollRun success screen has broken totals/link
- **File:** `pages/PayrollRun.tsx`
- **Backend returns:** `{ payrollPeriod: { id, ... }, totalEmployees, totalEarnings, totalDeductions, totalEmployerContributions, netPayroll }`
- **Frontend expects:** `{ periodId, fiscalYearId, ..., totalGrossPayroll, totalNetPayroll }`
- **Impact:** Success card totals are blank; "View Details" link may be broken.
- **Fix:** Map backend response fields; derive `periodId` from `payrollPeriod.id`.
- **Effort:** Small

### C8 — PayrollHistory list renders empty
- **File:** `pages/PayrollHistory.tsx`
- **Backend returns:** `{ data: PayrollPeriod[], page, limit, total }`
- **Frontend expects:** `{ periods: PayrollPeriod[] }`
- **Impact:** History table is blank.
- **Fix:** Read `response.data.data`; add pagination.
- **Effort:** Small

### C9 — Reports downloads use unauthenticated `window.open`
- **File:** `pages/Reports.tsx`
- **Backend:** Protected routes require JWT.
- **Impact:** Downloads 401 in production.
- **Fix:** Use authenticated axios `api` with `responseType: 'blob'` and trigger download programmatically.
- **Effort:** Small

### C10 — Salary-head creation endpoint does not exist
- **File:** `pages/Settings.tsx`
- **Backend:** `GET /api/salary-heads`, `PUT /api/salary-heads/:id` only.
- **Impact:** "Add Salary Head" form fails.
- **Fix:** Add `POST /api/salary-heads` or remove the add UI.
- **Effort:** Small

---

## Major Gaps (Significant UX or Spec Deviations)

### M1 — Login user shape mismatch causes blank profile in sidebar
- **Files:** `hooks/useAuth.ts`, `components/Layout.tsx`, `types/index.ts`
- **Backend returns:** `user: { id, username, role }`
- **Frontend expects:** `user: { id, username, email, fullName, role }`
- **Impact:** Sidebar shows "User" with blank email.
- **Fix:** Update frontend `User` type and layout fallback.
- **Effort:** Small

### M2 — `useAuth` is not reactive and lacks loading state
- **File:** `hooks/useAuth.ts`
- **Impact:** Protected routes may flash wrong state; login flow is brittle.
- **Fix:** Store user in React state/context and expose `isLoading`.
- **Effort:** Medium

### M3 — 401 interceptor does hard browser redirect
- **File:** `lib/api.ts`
- **Impact:** Loses SPA state and query cache.
- **Fix:** Integrate with auth context for clean React Router navigation.
- **Effort:** Small

### M4 — `ProtectedRoute` does not validate token expiration
- **File:** `components/ProtectedRoute.tsx`
- **Impact:** Expired tokens still grant route access until an API call fails.
- **Fix:** Decode JWT exp or add `GET /api/auth/me` validation.
- **Effort:** Small

### M5 — Missing edit-employee flow
- **Spec:** `PUT /api/employees/:id` exists.
- **Current:** No edit route, button, or form.
- **Fix:** Add `/employees/:id/edit` route and reuse `EmployeeAdd.tsx`.
- **Effort:** Medium

### M6 — Missing CSV bulk import
- **Spec:** Employees list must have import CSV button.
- **Current:** Not implemented.
- **Fix:** Add CSV upload UI + `POST /api/employees/import` backend.
- **Effort:** Medium

### M7 — Missing salary history view
- **Spec:** `GET /api/employees/:id/salary-history` exists.
- **Current:** Only active structures shown.
- **Fix:** Add history tab/call in `EmployeeDetail.tsx`.
- **Effort:** Small

### M8 — No edit/delete actions for salary components
- **Backend:** `PUT /api/structures/:id`, `DELETE /api/structures/:id` exist.
- **Frontend:** No actions in salary structure table.
- **Fix:** Add inline edit/end-date/delete buttons.
- **Effort:** Medium

### M9 — Fiscal-year creation form missing required fields
- **File:** `pages/Settings.tsx`
- **Backend requires:** SSF rates, minimum wage, etc.
- **Frontend collects:** Only year, dates, taxSlabs JSON.
- **Impact:** POST will fail validation or create incomplete records.
- **Fix:** Add all required inputs and validate JSON.
- **Effort:** Medium

### M10 — `PayrollPeriod` frontend type mismatch
- **File:** `types/index.ts`
- **Frontend type:** `status`, `month`, `year`, `processedAt`, `fiscalYear.year`
- **Backend:** `locked: boolean`, `fiscalYear: { id, name }`
- **Impact:** Status badge and fiscal-year display are broken.
- **Fix:** Align type and update consumers.
- **Effort:** Medium

### M11 — Lock/unlock UI is broken in PayrollHistory
- **File:** `pages/PayrollHistory.tsx`
- **Frontend checks:** `period.status === 'paid'`
- **Backend:** No `status` field; returns `locked: boolean`.
- **Impact:** Lock button is always shown; no unlock affordance.
- **Fix:** Use `period.locked`.
- **Effort:** Small

### M12 — Missing lock action on PayrollDetail
- **Spec:** Detail page must have ability to lock.
- **Current:** No lock button.
- **Fix:** Add `PUT /api/payroll/periods/:id/lock` button.
- **Effort:** Small

### M13 — Payslip includes employer SSF as employee earning
- **File:** `pages/Payslip.tsx`
- **Backend:** `SSF Employer` is a `EARNING` transaction with `isEmployerContribution: true`.
- **Impact:** Inflates employee's apparent gross pay.
- **Fix:** Filter out employer contributions or show them in a separate statutory section.
- **Effort:** Small

### M14 — E-TDS quarter selector missing
- **File:** `pages/Reports.tsx`
- **Backend supports:** `?quarter=1..4`
- **Frontend:** Only fiscal year selector.
- **Fix:** Add quarter dropdown.
- **Effort:** Small

### M15 — Leave encashment in settlement uses 0 days
- **Backend:** `calculateFinalSettlement` defaults unused leave to 0 because no leave records are queried.
- **Spec:** Requires actual unused annual leave.
- **Fix:** Query approved annual leave records and pass unused days to settlement calculator.
- **Effort:** Medium

---

## Minor Gaps (Polish / Nice-to-Have)

- Login form only HTML `required` validation.
- Dashboard missing "active payroll" net amount summary.
- Settings shows generic error messages instead of backend messages.
- Reports `status=paid` query param is unsupported by backend.
- PayrollHistory lacks pagination and fiscal-year filter.
- PayrollRun has no confirmation modal before running.
- PayrollRun success link uses plain `<a>` instead of React Router `Link`.
- Payslip lacks organization header (company name, PAN/VAT, SSF reg).
- Sidebar active state doesn't cover `/payroll/history` or `/payroll/:periodId`.
- Mobile sidebar lacks keyboard accessibility.
- No breadcrumbs on deep pages.

---

## Recommended Fix Order

1. **Add `/api/config/fiscal-years`** (unlocks PayrollRun, Settings, Reports).
2. **Fix response-shape mismatches** in Dashboard, Employees, PayrollRun, PayrollHistory.
3. **Align `Employee` and `PayrollPeriod` frontend types** with backend schema.
4. **Fix deactivation settlement display** and add full settlement fields.
5. **Fix Reports downloads** to use authenticated axios.
6. **Add missing spec features**: edit employee, CSV import, salary history.
7. **Fix lock/unlock UX** in PayrollHistory and PayrollDetail.
8. **Add salary-component edit/delete** actions.
9. **Polish**: pagination, filters, confirmation modals, better error messages.

---

## Files Requiring Changes

| Page/Component | Primary Issues |
|----------------|----------------|
| `types/index.ts` | Type drift for `Employee`, `PayrollPeriod`, `SalaryHead`, `User` |
| `pages/Dashboard.tsx` | Response-shape mismatch, missing active payroll card |
| `pages/Employees.tsx` | Response-shape mismatch, status enum mismatch |
| `pages/EmployeeAdd.tsx` | Missing phone/date validation, bank required mismatch |
| `pages/EmployeeDetail.tsx` | Type/field mismatches, broken settlement display, missing salary history |
| `pages/PayrollRun.tsx` | Missing `/config/fiscal-years`, response-shape mismatch, no confirmation |
| `pages/PayrollHistory.tsx` | Response-shape mismatch, broken lock logic, no pagination/filter |
| `pages/PayrollDetail.tsx` | **Recently rewritten** — verify no remaining shape issues |
| `pages/Payslip.tsx` | Employer SSF shown as earning, missing org header |
| `pages/Reports.tsx` | Missing `/config/fiscal-years`, unauthenticated downloads, no quarter selector |
| `pages/Settings.tsx` | Missing `/config/fiscal-years`, missing `POST /salary-heads`, incomplete fiscal-year form |
| `hooks/useAuth.ts` | Non-reactive auth state |
| `lib/api.ts` | Hard 401 redirect |
| `components/ProtectedRoute.tsx` | No token expiry check |
| `components/Layout.tsx` | Sidebar active state, mobile a11y |

---

## Note on Already-Fixed Items

During prior work, the following were addressed:
- `pages/PayrollDetail.tsx` was rewritten to match the backend's `{ period, employees }` response and now includes expandable per-employee transactions.
- `pages/Payslip.tsx` was created for individual payslip viewing.
- `LegalInfoIcon` was integrated into employee detail, payroll detail, payslip, and settings salary-head editing.
- `SalaryHead.type` was updated to uppercase `'EARNING' \| 'DEDUCTION'` to match Prisma.

These fixes should be verified in the running app but are not part of the gap list above.
