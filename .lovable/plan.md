

# CLEAN ERP — Frontend Shell Implementation Plan

## Overview
Build the complete frontend shell for **CLEAN** (Clear, Lean, Easy, Automated, Navigable) — Magvlyn's multi-tenant ERP for sachet water production companies. This is a React + TypeScript frontend that connects to an external Laravel + Laratrust backend via REST API.

---

## 1. Branding & Theme System
- Apply brand primary `#012256` (deep navy) and secondary `#FFFFFF` throughout the design system
- Clean, enterprise-grade UI — no gradients or playful styling
- Implement **light/dark mode toggle** in the top bar
- Persist theme preference in `localStorage`
- Ensure strong contrast and readability in both modes

## 2. Authentication Pages
- **Login** (`/login`) — email + password form with validation and error toasts
- **Forgot Password** (`/forgot-password`) — email input to request reset
- **Reset Password** (`/reset-password`) — new password form
- All styled consistently with CLEAN branding
- Redirect authenticated users away from auth pages

## 3. Auth Context & Session Bootstrap
- On app load, check for stored token and call `GET /api/auth/me` to restore session (user, teams, permissions)
- Show a **full-page loading spinner** during bootstrap
- If `/me` fails with 401, clear token and redirect to `/login`
- Store token, user, teams, and `current_team_id` in React context
- Attach `Authorization: Bearer <token>` and `X-Team-ID: <current_team_id>` headers to all API requests

## 4. Centralized API Client
- Configurable `BASE_URL` via environment variable
- Axios-based client with interceptors for auth headers and `X-Team-ID`
- Global error handling:
  - **401** → clear session, redirect to `/login`
  - **403** → show "Access Denied" message
- Loading state management for API calls

## 5. Authenticated Layout
- **Collapsible left sidebar** — icon + text, collapses to icon-only mini sidebar
- **Top bar** containing:
  - **Active Team Badge** (always visible, prominent)
  - **Team Switcher** dropdown (hidden if user has only one team)
  - Theme toggle (sun/moon)
  - Notifications bell icon
  - User profile menu (Profile, Logout)
- **Breadcrumbs** below the top bar
- **Main content area** with scroll

## 6. Team Switching
- Team switcher dropdown in top bar (only shown for multi-team users)
- On switch: call `POST /api/auth/switch-team` with `{ team_id }`
- Show loading state during switch
- Update `current_team_id`, permissions, and re-render navigation

## 7. Role-Based Dynamic Navigation
- Sidebar navigation items render based on permissions from the backend
- If user lacks a module's permission, that nav item is hidden
- Frontend visibility is convenience only — backend enforces authorization
- Navigation modules with icons:
  - 🏠 **Dashboard** (`/dashboard`)
  - 📋 **Master Data** (`/master-data`)
  - 📦 **Inventory** (`/inventory`)
  - 🏭 **Production** (`/production`)
  - 🚚 **Sales & Distribution** (`/sales`)
  - 💰 **Finance** (`/finance`)
  - 🤝 **Franchise Management** (`/franchise`) — e.g., requires `franchise.manage`
  - 📊 **Reports** (`/reports`)
  - ⚙️ **Settings** (`/settings`)

## 8. Placeholder Pages
- Each module route gets a clean placeholder page with the module name, icon, and "Coming Soon" state
- Dashboard page will have a basic card layout ready for widgets

## 9. Reusable Component Patterns
- **Data Table** pattern — with search input, column filters, and pagination controls (stubbed)
- **Form** pattern — with validation (react-hook-form + zod), disabled submit during loading, success/error toasts
- **Route Guards** — protected route wrapper that checks auth state

## 10. PWA Readiness
- Add web app manifest with CLEAN branding
- Configure service worker registration stub
- Mobile-responsive layout throughout

---

## What This Delivers
A fully functional, team-aware frontend shell with authentication flow, dynamic role-based navigation, theme switching, and API integration stubs — ready to connect to your Laravel + Laratrust backend.

