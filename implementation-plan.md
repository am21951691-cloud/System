# 🏥 Medical Complex Case Management System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a simple, Arabic RTL medical case management system where patients are registered once, visits are added over time, a committee reviews cases, and a doctor makes the final dispensing decision — with full audit logging and PDF generation.

**Architecture:** Next.js full-stack app (App Router) with SQLite via Prisma ORM. Server Actions handle all mutations. No separate backend. Single deployable app that runs on the local network.

**Tech Stack:**
- **Framework:** Next.js 14+ (App Router)
- **Database:** SQLite via Prisma ORM
- **Styling:** Vanilla CSS (RTL, dark clean theme)
- **PDF:** jsPDF + jsPDF-AutoTable (client-side generation)
- **Auth:** Simple session-based auth (no external providers)
- **Language:** TypeScript

## Global Constraints

- All UI text is in Arabic
- Full RTL layout (`dir="rtl"`)
- Minimal, clean interface — workflow-driven, not menu-driven
- Patient ≠ Visit (one patient → many visits)
- Patient ID format: `PAT-XXXXXX` (auto-generated, sequential)
- Audit log is append-only — never delete, only add correction records
- No public registration — Admin creates all accounts
- SQLite database stored in project root (`./data/clinic.db`)
- System runs on local network (accessible via `http://<local-ip>:3000`)

---

## File Structure

```
d:\System\
├── prisma/
│   ├── schema.prisma          # Database schema (all tables)
│   └── seed.ts                # Seed admin user + sample data
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (RTL, Arabic font)
│   │   ├── globals.css        # Global styles + CSS variables
│   │   ├── page.tsx           # Redirect to /login or /dashboard
│   │   ├── login/
│   │   │   └── page.tsx       # Login page
│   │   ├── dashboard/
│   │   │   └── page.tsx       # Dashboard (search, stats, recent cases)
│   │   ├── patients/
│   │   │   ├── new/
│   │   │   │   └── page.tsx   # Add new patient form
│   │   │   └── [id]/
│   │   │       ├── page.tsx   # Patient file (timeline + info)
│   │   │       └── visits/
│   │   │           └── new/
│   │   │               └── page.tsx  # Add new visit form
│   │   ├── visits/
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Visit details (full view)
│   │   │       ├── committee/
│   │   │       │   └── page.tsx      # Committee review form
│   │   │       └── decision/
│   │   │           └── page.tsx      # Doctor's final decision form
│   │   └── admin/
│   │       └── users/
│   │           └── page.tsx   # User management (Admin only)
│   ├── lib/
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── auth.ts            # Auth helpers (login, session, middleware)
│   │   ├── actions/
│   │   │   ├── auth-actions.ts      # Login/logout server actions
│   │   │   ├── patient-actions.ts   # Create/search patients
│   │   │   ├── visit-actions.ts     # Create visits, add medications
│   │   │   ├── committee-actions.ts # Submit committee review
│   │   │   ├── decision-actions.ts  # Submit doctor's decision
│   │   │   └── user-actions.ts      # Admin: create/manage users
│   │   ├── audit.ts           # Audit log helper function
│   │   └── pdf.ts             # PDF generation utilities
│   └── components/
│       ├── Navbar.tsx         # Top navigation bar
│       ├── PatientCard.tsx    # Patient info summary card
│       ├── VisitTimeline.tsx  # Timeline of visits
│       ├── MedicationForm.tsx # Dynamic medication rows
│       ├── StatusBadge.tsx    # Color-coded status badges
│       └── StatsCard.tsx      # Dashboard stats cards
├── public/
│   └── logo.png               # Clinic logo
├── package.json
├── tsconfig.json
├── next.config.js
└── middleware.ts              # Auth middleware (protect routes)
```

---

## Task 1: Project Setup & Database Schema

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/db.ts`

**Produces:**
- Prisma client singleton at `src/lib/db.ts` → `prisma` instance
- Database tables: `User`, `Patient`, `Visit`, `Medication`, `CommitteeReview`, `FinalDecision`, `AuditLog`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd d:\System
npx -y create-next-app@latest ./ --typescript --eslint --app --src-dir --no-tailwind --import-alias "@/*"
```

- [ ] **Step 2: Install dependencies**

```bash
npm install prisma @prisma/client bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 3: Initialize Prisma with SQLite**

```bash
npx prisma init --datasource-provider sqlite
```

- [ ] **Step 4: Write the database schema**

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:../data/clinic.db"
}

model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String
  name      String
  role      String   @default("member") // admin | doctor | member
  active    Boolean  @default(true)
  createdAt DateTime @default(now())

  committeeReviews CommitteeReview[]
  auditLogs        AuditLog[]
}

model Patient {
  id          Int      @id @default(autoincrement())
  patientId   String   @unique // PAT-000001
  fullName    String
  birthDate   String?
  gender      String?
  governorate String?
  city        String?
  phone       String?
  address     String?
  maritalStatus String?
  financialStatus String?
  notes       String?
  createdAt   DateTime @default(now())

  visits Visit[]
}

model Visit {
  id          Int      @id @default(autoincrement())
  patientId   Int
  date        DateTime @default(now())
  specialty   String
  description String?
  generalCondition String?
  diagnosis   String?
  notes       String?
  status      String   @default("new") // new | committee_review | doctor_review | approved | rejected
  createdAt   DateTime @default(now())

  patient          Patient           @relation(fields: [patientId], references: [id])
  medications      Medication[]
  committeeReviews CommitteeReview[]
  finalDecision    FinalDecision?
}

model Medication {
  id          Int    @id @default(autoincrement())
  visitId     Int
  name        String
  concentration String?
  dosage      String?
  frequency   String?
  duration    String?
  usageMethod String?
  quantity    String?
  totalQuantity String?

  visit Visit @relation(fields: [visitId], references: [id])
}

model CommitteeReview {
  id        Int      @id @default(autoincrement())
  visitId   Int
  userId    Int
  decision  String   // approved | rejected | needs_info
  notes     String?
  createdAt DateTime @default(now())

  visit Visit @relation(fields: [visitId], references: [id])
  user  User  @relation(fields: [userId], references: [id])
}

model FinalDecision {
  id              Int      @id @default(autoincrement())
  visitId         Int      @unique
  decisionType    String   // charity | paid | denied
  dispenseDuration String?
  dispenseQuantity String?
  dispenseSchedule String?
  reason          String?
  doctorName      String?
  createdAt       DateTime @default(now())

  visit Visit @relation(fields: [visitId], references: [id])
}

model AuditLog {
  id        Int      @id @default(autoincrement())
  userId    Int?
  action    String
  details   String?
  entityType String?
  entityId  Int?
  createdAt DateTime @default(now())

  user User? @relation(fields: [userId], references: [id])
}
```

- [ ] **Step 5: Create Prisma client singleton**

Create `src/lib/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 6: Create seed script**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'مدير النظام',
      role: 'admin',
    },
  })

  console.log('✅ Seed complete: admin user created (admin / admin123)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Add to `package.json`:
```json
"prisma": {
  "seed": "npx tsx prisma/seed.ts"
}
```

- [ ] **Step 7: Run migrations and seed**

```bash
npx prisma migrate dev --name init
npm install -D tsx
npx prisma db seed
```

- [ ] **Step 8: Verify database**

```bash
npx prisma studio
```

Open Prisma Studio and verify the `User` table has the admin account.

---

## Task 2: Global Styles & RTL Layout

**Files:**
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`

**Produces:**
- Root layout component with RTL, Arabic font (Noto Sans Arabic via Google Fonts)
- CSS design system with variables for colors, spacing, and components

- [ ] **Step 1: Write global CSS**

Create `src/app/globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap');

:root {
  --bg-primary: #0f1117;
  --bg-secondary: #1a1d27;
  --bg-card: #222533;
  --bg-input: #2a2d3a;
  --border: #333648;
  --text-primary: #e8e9ed;
  --text-secondary: #9ca3af;
  --accent: #6366f1;
  --accent-hover: #818cf8;
  --green: #22c55e;
  --yellow: #eab308;
  --red: #ef4444;
  --blue: #3b82f6;
  --radius: 12px;
  --radius-sm: 8px;
  --shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans Arabic', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.7;
  min-height: 100vh;
}

a { color: var(--accent); text-decoration: none; }
a:hover { color: var(--accent-hover); }

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border: none;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--accent);
  color: white;
}
.btn-primary:hover { background: var(--accent-hover); }

.btn-success {
  background: var(--green);
  color: white;
}
.btn-success:hover { opacity: 0.9; }

.btn-danger {
  background: var(--red);
  color: white;
}
.btn-danger:hover { opacity: 0.9; }

.btn-outline {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-primary);
}
.btn-outline:hover { border-color: var(--accent); color: var(--accent); }

/* Cards */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
}

/* Form inputs */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.form-group label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 14px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--accent);
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

/* Grid helpers */
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

/* Page container */
.page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 24px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 24px;
}

/* Status badges */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.badge-new { background: rgba(99, 102, 241, 0.15); color: var(--accent); }
.badge-committee { background: rgba(234, 179, 8, 0.15); color: var(--yellow); }
.badge-doctor { background: rgba(59, 130, 246, 0.15); color: var(--blue); }
.badge-approved { background: rgba(34, 197, 94, 0.15); color: var(--green); }
.badge-rejected { background: rgba(239, 68, 68, 0.15); color: var(--red); }

/* Table */
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 12px 16px;
  text-align: right;
  border-bottom: 1px solid var(--border);
}
th {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .grid-2, .grid-3 { grid-template-columns: 1fr; }
  .page { padding: 16px; }
}
```

- [ ] **Step 2: Write root layout**

Create `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'نظام إدارة حالات المجمع الطبي',
  description: 'نظام إدارة حالات المرضى والروشتات واللجان الطبية',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Verify layout renders**

```bash
npm run dev
```

Open `http://localhost:3000` — should show the default Next.js page with Arabic font and dark RTL layout.

---

## Task 3: Authentication System

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/actions/auth-actions.ts`
- Create: `src/app/login/page.tsx`
- Create: `src/middleware.ts` (project root `middleware.ts`)
- Modify: `src/app/page.tsx`

**Produces:**
- `login(username, password)` → sets HTTP-only cookie
- `logout()` → clears cookie
- `getSession()` → returns `{ userId, username, name, role }` or `null`
- Middleware that redirects unauthenticated users to `/login`

- [ ] **Step 1: Install cookie library**

```bash
npm install jose
```

- [ ] **Step 2: Write auth helpers**

Create `src/lib/auth.ts`:

```typescript
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'clinic-secret-key-change-in-production'
)

export interface SessionUser {
  userId: number
  username: string
  name: string
  role: string
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET)

  const cookieStore = await cookies()
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: false, // local network
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
```

- [ ] **Step 3: Write login/logout server actions**

Create `src/lib/actions/auth-actions.ts`:

```typescript
'use server'

import { prisma } from '@/lib/db'
import { createSession, deleteSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: 'يرجى إدخال اسم المستخدم وكلمة المرور' }
  }

  const user = await prisma.user.findUnique({ where: { username } })

  if (!user || !user.active) {
    return { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }
  }

  await createSession({
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  })

  redirect('/dashboard')
}

export async function logoutAction() {
  await deleteSession()
  redirect('/login')
}
```

- [ ] **Step 4: Write middleware for route protection**

Create `middleware.ts` (in project root, NOT in `src/`):

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'clinic-secret-key-change-in-production'
)

const PUBLIC_ROUTES = ['/login']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get('session')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    await jwtVerify(token, SECRET)
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
}
```

- [ ] **Step 5: Write login page**

Create `src/app/login/page.tsx`:

```tsx
'use client'

import { loginAction } from '@/lib/actions/auth-actions'
import { useState } from 'react'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await loginAction(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🏥</div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700 }}>نظام المجمع الطبي</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            تسجيل الدخول
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>اسم المستخدم</label>
            <input name="username" type="text" required autoFocus />
          </div>

          <div className="form-group">
            <label>كلمة المرور</label>
            <input name="password" type="password" required />
          </div>

          {error && (
            <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: '16px' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? '...جاري الدخول' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Write root page redirect**

Create `src/app/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function Home() {
  const session = await getSession()
  if (session) redirect('/dashboard')
  redirect('/login')
}
```

- [ ] **Step 7: Verify login flow**

```bash
npm run dev
```

Go to `http://localhost:3000` → should redirect to `/login`. Login with `admin` / `admin123` → should redirect to `/dashboard` (will 404 for now, that's expected).

---

## Task 4: Audit Log Helper & Navbar

**Files:**
- Create: `src/lib/audit.ts`
- Create: `src/components/Navbar.tsx`
- Create: `src/components/StatusBadge.tsx`
- Create: `src/components/StatsCard.tsx`

**Produces:**
- `logAudit(userId, action, details, entityType?, entityId?)` — inserts audit log row
- `<Navbar />` — top bar with clinic name + logged-in user + logout
- `<StatusBadge status={...} />` — color-coded visit status
- `<StatsCard title={...} count={...} color={...} />` — dashboard stat box

- [ ] **Step 1: Write audit log helper**

Create `src/lib/audit.ts`:

```typescript
import { prisma } from '@/lib/db'

export async function logAudit(
  userId: number,
  action: string,
  details?: string,
  entityType?: string,
  entityId?: number
) {
  await prisma.auditLog.create({
    data: { userId, action, details, entityType, entityId },
  })
}
```

- [ ] **Step 2: Write Navbar component**

Create `src/components/Navbar.tsx`:

```tsx
import { getSession } from '@/lib/auth'
import { logoutAction } from '@/lib/actions/auth-actions'

export default async function Navbar() {
  const session = await getSession()
  if (!session) return null

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
    }}>
      <a href="/dashboard" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '1.1rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
      }}>
        🏥 نظام المجمع الطبي
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          👤 {session.name}
        </span>
        <form action={logoutAction}>
          <button type="submit" className="btn btn-outline" style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
            خروج
          </button>
        </form>
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Write StatusBadge component**

Create `src/components/StatusBadge.tsx`:

```tsx
const STATUS_MAP: Record<string, { label: string; className: string }> = {
  new:              { label: '🔵 جديدة',             className: 'badge badge-new' },
  committee_review: { label: '🟡 في انتظار اللجنة', className: 'badge badge-committee' },
  doctor_review:    { label: '🔵 في انتظار الطبيب', className: 'badge badge-doctor' },
  approved:         { label: '🟢 تم الصرف',         className: 'badge badge-approved' },
  rejected:         { label: '🔴 لم يتم الصرف',     className: 'badge badge-rejected' },
}

export default function StatusBadge({ status }: { status: string }) {
  const info = STATUS_MAP[status] || { label: status, className: 'badge' }
  return <span className={info.className}>{info.label}</span>
}
```

- [ ] **Step 4: Write StatsCard component**

Create `src/components/StatsCard.tsx`:

```tsx
export default function StatsCard({
  title,
  count,
  color,
}: {
  title: string
  count: number
  color: string
}) {
  return (
    <div className="card" style={{
      textAlign: 'center',
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: '2rem', fontWeight: 700, color }}>{count}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
        {title}
      </div>
    </div>
  )
}
```

---

## Task 5: Dashboard Page

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/app/dashboard/layout.tsx`

**Consumes:** `Navbar`, `StatsCard`, `StatusBadge`, `prisma`, `getSession`
**Produces:** Dashboard with search, stats cards, recent visits table

- [ ] **Step 1: Write dashboard layout (with Navbar)**

Create `src/app/dashboard/layout.tsx` — but actually we want Navbar on ALL authenticated pages. So create a shared layout:

Create `src/app/(authenticated)/layout.tsx`:

```tsx
import Navbar from '@/components/Navbar'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
```

Then move `dashboard/` under `(authenticated)/`. File structure becomes:
```
src/app/(authenticated)/dashboard/page.tsx
src/app/(authenticated)/patients/...
src/app/(authenticated)/visits/...
src/app/(authenticated)/admin/...
```

- [ ] **Step 2: Write dashboard page**

Create `src/app/(authenticated)/dashboard/page.tsx`:

```tsx
import { prisma } from '@/lib/db'
import StatsCard from '@/components/StatsCard'
import StatusBadge from '@/components/StatusBadge'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const query = params.q || ''

  // Stats
  const [newCount, committeeCount, doctorCount, approvedTodayCount] = await Promise.all([
    prisma.visit.count({ where: { status: 'new' } }),
    prisma.visit.count({ where: { status: 'committee_review' } }),
    prisma.visit.count({ where: { status: 'doctor_review' } }),
    prisma.visit.count({
      where: {
        status: 'approved',
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ])

  // Search results
  let patients: any[] = []
  if (query) {
    patients = await prisma.patient.findMany({
      where: {
        OR: [
          { fullName: { contains: query } },
          { patientId: { contains: query } },
          { phone: { contains: query } },
        ],
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    })
  }

  // Recent visits
  const recentVisits = await prisma.visit.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { patient: true },
  })

  return (
    <div className="page">
      <h1 className="page-title">الصفحة الرئيسية</h1>

      {/* Stats */}
      <div className="grid-4" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <StatsCard title="حالات جديدة" count={newCount} color="var(--accent)" />
        <StatsCard title="في انتظار اللجنة" count={committeeCount} color="var(--yellow)" />
        <StatsCard title="في انتظار الطبيب" count={doctorCount} color="var(--blue)" />
        <StatsCard title="قرارات اليوم" count={approvedTodayCount} color="var(--green)" />
      </div>

      {/* Search + Add */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <form action="/dashboard" style={{ flex: 1, display: 'flex', gap: '8px' }}>
          <input
            name="q"
            placeholder="🔍 بحث بالاسم أو رقم الملف أو الهاتف..."
            defaultValue={query}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
            }}
          />
          <button type="submit" className="btn btn-primary">بحث</button>
        </form>
        <Link href="/patients/new" className="btn btn-success">➕ إضافة مريض جديد</Link>
      </div>

      {/* Search Results */}
      {query && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '16px' }}>
            نتائج البحث ({patients.length})
          </h2>
          {patients.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>لا توجد نتائج</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>رقم الملف</th>
                  <th>الاسم</th>
                  <th>الهاتف</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p: any) => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'monospace' }}>{p.patientId}</td>
                    <td>{p.fullName}</td>
                    <td>{p.phone || '—'}</td>
                    <td>
                      <Link href={`/patients/${p.id}`} className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                        فتح الملف
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Recent Visits */}
      <div className="card">
        <h2 style={{ fontSize: '1rem', marginBottom: '16px' }}>آخر الحالات</h2>
        <table>
          <thead>
            <tr>
              <th>المريض</th>
              <th>التخصص</th>
              <th>التاريخ</th>
              <th>الحالة</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recentVisits.map((v: any) => (
              <tr key={v.id}>
                <td>
                  <div>{v.patient.fullName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    {v.patient.patientId}
                  </div>
                </td>
                <td>{v.specialty}</td>
                <td>{new Date(v.createdAt).toLocaleDateString('ar-EG')}</td>
                <td><StatusBadge status={v.status} /></td>
                <td>
                  <Link href={`/visits/${v.id}`} className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                    عرض
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

---

## Task 6: Patient Management (Create + View)

**Files:**
- Create: `src/lib/actions/patient-actions.ts`
- Create: `src/app/(authenticated)/patients/new/page.tsx`
- Create: `src/app/(authenticated)/patients/[id]/page.tsx`
- Create: `src/components/VisitTimeline.tsx`

**Produces:**
- `createPatient(formData)` → creates patient with auto PAT-ID + audit log
- Add Patient page with form
- Patient File page with info + visit timeline

- [ ] **Step 1: Write patient server actions**

Create `src/lib/actions/patient-actions.ts`:

```typescript
'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { redirect } from 'next/navigation'

export async function createPatient(formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  // Generate next PAT-ID
  const lastPatient = await prisma.patient.findFirst({
    orderBy: { id: 'desc' },
  })
  const nextNum = (lastPatient?.id || 0) + 1
  const patientId = `PAT-${String(nextNum).padStart(6, '0')}`

  const patient = await prisma.patient.create({
    data: {
      patientId,
      fullName: formData.get('fullName') as string,
      birthDate: (formData.get('birthDate') as string) || null,
      gender: (formData.get('gender') as string) || null,
      governorate: (formData.get('governorate') as string) || null,
      city: (formData.get('city') as string) || null,
      phone: (formData.get('phone') as string) || null,
      address: (formData.get('address') as string) || null,
      maritalStatus: (formData.get('maritalStatus') as string) || null,
      financialStatus: (formData.get('financialStatus') as string) || null,
      notes: (formData.get('notes') as string) || null,
    },
  })

  await logAudit(
    session.userId,
    'إنشاء مريض جديد',
    `تم إنشاء المريض ${patient.fullName} - ${patientId}`,
    'patient',
    patient.id
  )

  redirect(`/patients/${patient.id}`)
}
```

- [ ] **Step 2: Write Add Patient page**

Create `src/app/(authenticated)/patients/new/page.tsx`:

```tsx
import { createPatient } from '@/lib/actions/patient-actions'

export default function NewPatientPage() {
  return (
    <div className="page">
      <h1 className="page-title">➕ إضافة مريض جديد</h1>

      <form action={createPatient} className="card">
        <div className="grid-2">
          <div className="form-group">
            <label>الاسم بالكامل *</label>
            <input name="fullName" required />
          </div>
          <div className="form-group">
            <label>تاريخ الميلاد / السن</label>
            <input name="birthDate" />
          </div>
          <div className="form-group">
            <label>النوع</label>
            <select name="gender">
              <option value="">—</option>
              <option value="ذكر">ذكر</option>
              <option value="أنثى">أنثى</option>
            </select>
          </div>
          <div className="form-group">
            <label>رقم الهاتف</label>
            <input name="phone" />
          </div>
          <div className="form-group">
            <label>المحافظة</label>
            <input name="governorate" />
          </div>
          <div className="form-group">
            <label>المدينة</label>
            <input name="city" />
          </div>
          <div className="form-group">
            <label>الحالة الاجتماعية</label>
            <select name="maritalStatus">
              <option value="">—</option>
              <option value="أعزب">أعزب</option>
              <option value="متزوج">متزوج</option>
              <option value="مطلق">مطلق</option>
              <option value="أرمل">أرمل</option>
            </select>
          </div>
          <div className="form-group">
            <label>الحالة المادية</label>
            <select name="financialStatus">
              <option value="">—</option>
              <option value="ميسور">ميسور</option>
              <option value="متوسط">متوسط</option>
              <option value="محدود الدخل">محدود الدخل</option>
              <option value="معدوم الدخل">معدوم الدخل</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>العنوان</label>
          <input name="address" />
        </div>

        <div className="form-group">
          <label>ملاحظات إضافية</label>
          <textarea name="notes" rows={3} />
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
          حفظ المريض
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Write VisitTimeline component**

Create `src/components/VisitTimeline.tsx`:

```tsx
import StatusBadge from '@/components/StatusBadge'
import Link from 'next/link'

interface Visit {
  id: number
  specialty: string
  status: string
  createdAt: Date
  finalDecision?: { decisionType: string } | null
}

export default function VisitTimeline({ visits }: { visits: Visit[] }) {
  if (visits.length === 0) {
    return <p style={{ color: 'var(--text-secondary)' }}>لا توجد زيارات بعد</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {visits.map((visit) => (
        <Link
          key={visit.id}
          href={`/visits/${visit.id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            transition: 'border-color 0.2s',
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>
              {new Date(visit.createdAt).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
              زيارة — {visit.specialty}
            </div>
          </div>
          <StatusBadge status={visit.status} />
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Write Patient File page**

Create `src/app/(authenticated)/patients/[id]/page.tsx`:

```tsx
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import VisitTimeline from '@/components/VisitTimeline'

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const patient = await prisma.patient.findUnique({
    where: { id: Number(id) },
    include: {
      visits: {
        orderBy: { createdAt: 'desc' },
        include: { finalDecision: true },
      },
    },
  })

  if (!patient) notFound()

  const info = [
    { label: 'رقم الملف', value: patient.patientId },
    { label: 'تاريخ الميلاد', value: patient.birthDate },
    { label: 'النوع', value: patient.gender },
    { label: 'الهاتف', value: patient.phone },
    { label: 'المحافظة', value: patient.governorate },
    { label: 'المدينة', value: patient.city },
    { label: 'الحالة الاجتماعية', value: patient.maritalStatus },
    { label: 'الحالة المادية', value: patient.financialStatus },
    { label: 'العنوان', value: patient.address },
  ].filter((i) => i.value)

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '4px' }}>{patient.fullName}</h1>
          <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
            {patient.patientId}
          </span>
        </div>
        <Link href={`/patients/${patient.id}/visits/new`} className="btn btn-success">
          ➕ إضافة زيارة جديدة
        </Link>
      </div>

      {/* Patient Info */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '16px' }}>المعلومات الأساسية</h2>
        <div className="grid-3">
          {info.map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.label}</div>
              <div style={{ fontWeight: 500 }}>{item.value}</div>
            </div>
          ))}
        </div>
        {patient.notes && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>ملاحظات</div>
            {patient.notes}
          </div>
        )}
      </div>

      {/* Visit Timeline */}
      <div className="card">
        <h2 style={{ fontSize: '1rem', marginBottom: '16px' }}>
          🕐 التاريخ الكامل ({patient.visits.length} زيارة)
        </h2>
        <VisitTimeline visits={patient.visits} />
      </div>
    </div>
  )
}
```

---

## Task 7: Visit Management (Create + View + Medications)

**Files:**
- Create: `src/lib/actions/visit-actions.ts`
- Create: `src/app/(authenticated)/patients/[id]/visits/new/page.tsx`
- Create: `src/app/(authenticated)/visits/[id]/page.tsx`
- Create: `src/components/MedicationForm.tsx`

**Produces:**
- `createVisit(formData)` → creates visit + medications + audit log
- `sendToCommittee(visitId)` → updates status to `committee_review`
- Add Visit page with dynamic medication form
- Visit Details page (full view of visit + medications + committee reviews + decision)

- [ ] **Step 1: Write visit server actions**

Create `src/lib/actions/visit-actions.ts`:

```typescript
'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { redirect } from 'next/navigation'

export async function createVisit(patientId: number, formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const visit = await prisma.visit.create({
    data: {
      patientId,
      specialty: formData.get('specialty') as string,
      description: (formData.get('description') as string) || null,
      generalCondition: (formData.get('generalCondition') as string) || null,
      diagnosis: (formData.get('diagnosis') as string) || null,
      notes: (formData.get('notes') as string) || null,
    },
  })

  // Parse medications from form
  const medNames = formData.getAll('medName')
  for (let i = 0; i < medNames.length; i++) {
    const name = medNames[i] as string
    if (!name.trim()) continue

    await prisma.medication.create({
      data: {
        visitId: visit.id,
        name,
        concentration: (formData.getAll('medConcentration')[i] as string) || null,
        dosage: (formData.getAll('medDosage')[i] as string) || null,
        frequency: (formData.getAll('medFrequency')[i] as string) || null,
        duration: (formData.getAll('medDuration')[i] as string) || null,
        usageMethod: (formData.getAll('medUsage')[i] as string) || null,
        quantity: (formData.getAll('medQuantity')[i] as string) || null,
      },
    })
  }

  await logAudit(
    session.userId,
    'إضافة زيارة جديدة',
    `تم إضافة زيارة ${visit.specialty} للمريض`,
    'visit',
    visit.id
  )

  redirect(`/visits/${visit.id}`)
}

export async function sendToCommittee(visitId: number) {
  const session = await getSession()
  if (!session) redirect('/login')

  await prisma.visit.update({
    where: { id: visitId },
    data: { status: 'committee_review' },
  })

  await logAudit(
    session.userId,
    'إرسال الحالة للجنة',
    `تم إرسال الزيارة رقم ${visitId} للجنة`,
    'visit',
    visitId
  )

  redirect(`/visits/${visitId}`)
}

export async function sendToDoctor(visitId: number) {
  const session = await getSession()
  if (!session) redirect('/login')

  await prisma.visit.update({
    where: { id: visitId },
    data: { status: 'doctor_review' },
  })

  await logAudit(
    session.userId,
    'إرسال الحالة للطبيب',
    `تم إرسال الزيارة رقم ${visitId} للطبيب`,
    'visit',
    visitId
  )

  redirect(`/visits/${visitId}`)
}
```

- [ ] **Step 2: Write MedicationForm component (client component)**

Create `src/components/MedicationForm.tsx`:

```tsx
'use client'

import { useState } from 'react'

export default function MedicationForm() {
  const [medications, setMedications] = useState([{ id: 1 }])

  function addMedication() {
    setMedications([...medications, { id: Date.now() }])
  }

  function removeMedication(id: number) {
    if (medications.length <= 1) return
    setMedications(medications.filter((m) => m.id !== id))
  }

  return (
    <div>
      <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>💊 الروشتة</h3>

      {medications.map((med, index) => (
        <div
          key={med.id}
          style={{
            padding: '16px',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '12px',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>دواء {index + 1}</span>
            {medications.length > 1 && (
              <button
                type="button"
                onClick={() => removeMedication(med.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--red)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                ✕ حذف
              </button>
            )}
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label>اسم الدواء</label>
              <input name="medName" />
            </div>
            <div className="form-group">
              <label>التركيز</label>
              <input name="medConcentration" />
            </div>
            <div className="form-group">
              <label>الجرعة</label>
              <input name="medDosage" />
            </div>
            <div className="form-group">
              <label>عدد المرات</label>
              <input name="medFrequency" />
            </div>
            <div className="form-group">
              <label>مدة العلاج</label>
              <input name="medDuration" />
            </div>
            <div className="form-group">
              <label>طريقة الاستخدام</label>
              <input name="medUsage" />
            </div>
          </div>
          <div className="form-group">
            <label>الكمية / طريقة الصرف</label>
            <input name="medQuantity" placeholder="مثال: علبة كل شهر لمدة 6 شهور" />
          </div>
        </div>
      ))}

      <button type="button" onClick={addMedication} className="btn btn-outline" style={{ marginTop: '4px' }}>
        ➕ إضافة دواء آخر
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Write Add Visit page**

Create `src/app/(authenticated)/patients/[id]/visits/new/page.tsx`:

```tsx
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { createVisit } from '@/lib/actions/visit-actions'
import MedicationForm from '@/components/MedicationForm'

export default async function NewVisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const patient = await prisma.patient.findUnique({ where: { id: Number(id) } })
  if (!patient) notFound()

  async function handleSubmit(formData: FormData) {
    'use server'
    await createVisit(patient!.id, formData)
  }

  return (
    <div className="page">
      <h1 className="page-title">
        إضافة زيارة جديدة — {patient.fullName}
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontFamily: 'monospace' }}>
        {patient.patientId}
      </p>

      <form action={handleSubmit} className="card">
        <div className="grid-2">
          <div className="form-group">
            <label>التخصص *</label>
            <select name="specialty" required>
              <option value="">اختر التخصص</option>
              <option value="باطنة">باطنة</option>
              <option value="عظام">عظام</option>
              <option value="أطفال">أطفال</option>
              <option value="جلدية وتجميل">جلدية وتجميل</option>
              <option value="نساء وتوليد">نساء وتوليد</option>
              <option value="عيون">عيون</option>
              <option value="أنف وأذن">أنف وأذن</option>
              <option value="أسنان">أسنان</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>
          <div className="form-group">
            <label>الحالة العامة</label>
            <input name="generalCondition" />
          </div>
        </div>

        <div className="form-group">
          <label>وصف الحالة</label>
          <textarea name="description" rows={3} />
        </div>

        <div className="form-group">
          <label>التشخيص / المشكلة</label>
          <textarea name="diagnosis" rows={2} />
        </div>

        <div className="form-group">
          <label>ملاحظات إضافية</label>
          <textarea name="notes" rows={2} />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />

        <MedicationForm />

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />

        <button type="submit" className="btn btn-primary">
          حفظ الزيارة
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Write Visit Details page**

Create `src/app/(authenticated)/visits/[id]/page.tsx`:

```tsx
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import StatusBadge from '@/components/StatusBadge'
import Link from 'next/link'
import { sendToCommittee, sendToDoctor } from '@/lib/actions/visit-actions'

export default async function VisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const visit = await prisma.visit.findUnique({
    where: { id: Number(id) },
    include: {
      patient: true,
      medications: true,
      committeeReviews: { include: { user: true }, orderBy: { createdAt: 'desc' } },
      finalDecision: true,
    },
  })

  if (!visit) notFound()

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <Link href={`/patients/${visit.patient.id}`} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            ← العودة لملف المريض
          </Link>
          <h1 className="page-title" style={{ marginTop: '8px', marginBottom: '4px' }}>
            زيارة — {visit.specialty}
          </h1>
          <div style={{ color: 'var(--text-secondary)' }}>
            {visit.patient.fullName} • {visit.patient.patientId} • {new Date(visit.createdAt).toLocaleDateString('ar-EG')}
          </div>
        </div>
        <StatusBadge status={visit.status} />
      </div>

      {/* Visit Info */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '12px' }}>بيانات الحالة</h2>
        {visit.generalCondition && <p><strong>الحالة العامة:</strong> {visit.generalCondition}</p>}
        {visit.description && <p style={{ marginTop: '8px' }}><strong>الوصف:</strong> {visit.description}</p>}
        {visit.diagnosis && <p style={{ marginTop: '8px' }}><strong>التشخيص:</strong> {visit.diagnosis}</p>}
        {visit.notes && <p style={{ marginTop: '8px' }}><strong>ملاحظات:</strong> {visit.notes}</p>}
      </div>

      {/* Medications */}
      {visit.medications.length > 0 && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '12px' }}>💊 الروشتة</h2>
          <table>
            <thead>
              <tr>
                <th>الدواء</th>
                <th>التركيز</th>
                <th>الجرعة</th>
                <th>عدد المرات</th>
                <th>المدة</th>
                <th>الكمية</th>
              </tr>
            </thead>
            <tbody>
              {visit.medications.map((med) => (
                <tr key={med.id}>
                  <td style={{ fontWeight: 500 }}>{med.name}</td>
                  <td>{med.concentration || '—'}</td>
                  <td>{med.dosage || '—'}</td>
                  <td>{med.frequency || '—'}</td>
                  <td>{med.duration || '—'}</td>
                  <td>{med.quantity || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Committee Reviews */}
      {visit.committeeReviews.length > 0 && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '12px' }}>آراء اللجنة</h2>
          {visit.committeeReviews.map((review) => (
            <div
              key={review.id}
              style={{
                padding: '12px',
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{review.user.name}</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {new Date(review.createdAt).toLocaleString('ar-EG')}
                </span>
              </div>
              <div style={{ marginTop: '4px' }}>
                {review.decision === 'approved' && '🟢 موافق على الصرف'}
                {review.decision === 'rejected' && '🔴 غير موافق'}
                {review.decision === 'needs_info' && '🟡 يحتاج معلومات إضافية'}
              </div>
              {review.notes && (
                <div style={{ marginTop: '4px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {review.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Final Decision */}
      {visit.finalDecision && (
        <div className="card" style={{ marginBottom: '16px', borderTop: '3px solid var(--green)' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '12px' }}>القرار النهائي</h2>
          <p>
            <strong>القرار:</strong>{' '}
            {visit.finalDecision.decisionType === 'charity' && '🟢 يصرف كصدقة'}
            {visit.finalDecision.decisionType === 'paid' && '🔵 يصرف بمقابل مالي'}
            {visit.finalDecision.decisionType === 'denied' && '🔴 لا يصرف'}
          </p>
          {visit.finalDecision.dispenseDuration && <p><strong>مدة الصرف:</strong> {visit.finalDecision.dispenseDuration}</p>}
          {visit.finalDecision.dispenseQuantity && <p><strong>كمية الصرف:</strong> {visit.finalDecision.dispenseQuantity}</p>}
          {visit.finalDecision.dispenseSchedule && <p><strong>جدول الصرف:</strong> {visit.finalDecision.dispenseSchedule}</p>}
          {visit.finalDecision.reason && <p><strong>السبب:</strong> {visit.finalDecision.reason}</p>}
          {visit.finalDecision.doctorName && <p><strong>الطبيب:</strong> {visit.finalDecision.doctorName}</p>}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        {visit.status === 'new' && (
          <form action={async () => { 'use server'; await sendToCommittee(visit.id) }}>
            <button type="submit" className="btn btn-primary">
              📤 إرسال الحالة للجنة
            </button>
          </form>
        )}

        {visit.status === 'committee_review' && (
          <>
            <Link href={`/visits/${visit.id}/committee`} className="btn btn-primary">
              ✍️ إضافة رأي اللجنة
            </Link>
            <form action={async () => { 'use server'; await sendToDoctor(visit.id) }}>
              <button type="submit" className="btn btn-success">
                📤 إرسال للطبيب
              </button>
            </form>
          </>
        )}

        {visit.status === 'doctor_review' && (
          <Link href={`/visits/${visit.id}/decision`} className="btn btn-success">
            ⚖️ إضافة القرار النهائي
          </Link>
        )}
      </div>
    </div>
  )
}
```

---

## Task 8: Committee Review

**Files:**
- Create: `src/lib/actions/committee-actions.ts`
- Create: `src/app/(authenticated)/visits/[id]/committee/page.tsx`

**Produces:**
- `submitCommitteeReview(visitId, formData)` → inserts review + audit log
- Committee Review form page

- [ ] **Step 1: Write committee server actions**

Create `src/lib/actions/committee-actions.ts`:

```typescript
'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { redirect } from 'next/navigation'

export async function submitCommitteeReview(visitId: number, formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const review = await prisma.committeeReview.create({
    data: {
      visitId,
      userId: session.userId,
      decision: formData.get('decision') as string,
      notes: (formData.get('notes') as string) || null,
    },
  })

  await logAudit(
    session.userId,
    'إضافة رأي اللجنة',
    `عضو اللجنة ${session.name} أضاف رأيه - ${formData.get('decision')}`,
    'committee_review',
    review.id
  )

  redirect(`/visits/${visitId}`)
}
```

- [ ] **Step 2: Write committee review page**

Create `src/app/(authenticated)/visits/[id]/committee/page.tsx`:

```tsx
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { submitCommitteeReview } from '@/lib/actions/committee-actions'

export default async function CommitteeReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const visit = await prisma.visit.findUnique({
    where: { id: Number(id) },
    include: { patient: true, medications: true },
  })

  if (!visit) notFound()

  async function handleSubmit(formData: FormData) {
    'use server'
    await submitCommitteeReview(visit!.id, formData)
  }

  return (
    <div className="page">
      <h1 className="page-title">✍️ رأي اللجنة</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        المريض: {visit.patient.fullName} ({visit.patient.patientId}) — زيارة {visit.specialty}
      </p>

      <form action={handleSubmit} className="card">
        <div className="form-group">
          <label>القرار المقترح *</label>
          <select name="decision" required>
            <option value="">اختر</option>
            <option value="approved">🟢 موافق على الصرف</option>
            <option value="rejected">🔴 غير موافق</option>
            <option value="needs_info">🟡 يحتاج معلومات إضافية</option>
          </select>
        </div>

        <div className="form-group">
          <label>ملاحظات</label>
          <textarea name="notes" rows={4} placeholder="اختياري..." />
        </div>

        <button type="submit" className="btn btn-primary">
          تسجيل الرأي
        </button>
      </form>
    </div>
  )
}
```

---

## Task 9: Doctor's Final Decision

**Files:**
- Create: `src/lib/actions/decision-actions.ts`
- Create: `src/app/(authenticated)/visits/[id]/decision/page.tsx`

**Produces:**
- `submitFinalDecision(visitId, formData)` → inserts decision, updates visit status, audit log
- Doctor's Decision form page

- [ ] **Step 1: Write decision server actions**

Create `src/lib/actions/decision-actions.ts`:

```typescript
'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { redirect } from 'next/navigation'

export async function submitFinalDecision(visitId: number, formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const decisionType = formData.get('decisionType') as string

  await prisma.finalDecision.create({
    data: {
      visitId,
      decisionType,
      dispenseDuration: (formData.get('dispenseDuration') as string) || null,
      dispenseQuantity: (formData.get('dispenseQuantity') as string) || null,
      dispenseSchedule: (formData.get('dispenseSchedule') as string) || null,
      reason: (formData.get('reason') as string) || null,
      doctorName: session.name,
    },
  })

  const newStatus = decisionType === 'denied' ? 'rejected' : 'approved'
  await prisma.visit.update({
    where: { id: visitId },
    data: { status: newStatus },
  })

  await logAudit(
    session.userId,
    'اعتماد القرار النهائي',
    `${session.name} اعتمد القرار: ${decisionType}`,
    'visit',
    visitId
  )

  redirect(`/visits/${visitId}`)
}
```

- [ ] **Step 2: Write decision page**

Create `src/app/(authenticated)/visits/[id]/decision/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { submitFinalDecision } from '@/lib/actions/decision-actions'
import { useParams } from 'next/navigation'

export default function DecisionPage() {
  const params = useParams()
  const visitId = Number(params.id)
  const [decisionType, setDecisionType] = useState('')

  async function handleSubmit(formData: FormData) {
    await submitFinalDecision(visitId, formData)
  }

  return (
    <div className="page">
      <h1 className="page-title">⚖️ القرار النهائي</h1>

      <form action={handleSubmit} className="card">
        <div className="form-group">
          <label>القرار *</label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { value: 'charity', label: '🟢 يصرف كصدقة', color: 'var(--green)' },
              { value: 'paid', label: '🔵 يصرف بمقابل مالي', color: 'var(--blue)' },
              { value: 'denied', label: '🔴 لا يصرف', color: 'var(--red)' },
            ].map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: 'var(--radius-sm)',
                  border: `2px solid ${decisionType === opt.value ? opt.color : 'var(--border)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="radio"
                  name="decisionType"
                  value={opt.value}
                  required
                  onChange={() => setDecisionType(opt.value)}
                  style={{ display: 'none' }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {decisionType && decisionType !== 'denied' && (
          <>
            <div className="grid-2">
              <div className="form-group">
                <label>مدة الصرف</label>
                <input name="dispenseDuration" placeholder="مثال: 6 شهور" />
              </div>
              <div className="form-group">
                <label>كمية الصرف</label>
                <input name="dispenseQuantity" placeholder="مثال: علبة واحدة شهريًا" />
              </div>
            </div>
            <div className="form-group">
              <label>جدول الصرف</label>
              <input name="dispenseSchedule" placeholder="مثال: شريط كل 10 أيام" />
            </div>
          </>
        )}

        <div className="form-group">
          <label>سبب القرار</label>
          <textarea name="reason" rows={3} placeholder="اختياري..." />
        </div>

        <button type="submit" className="btn btn-success">
          ✅ اعتماد القرار النهائي
        </button>
      </form>
    </div>
  )
}
```

---

## Task 10: PDF Generation

**Files:**
- Create: `src/lib/pdf.ts`
- Modify: `src/app/(authenticated)/visits/[id]/page.tsx` — add PDF download button

**Produces:**
- `generateVisitPDF(visitId)` → returns PDF blob/download for a single visit
- Download button on visit details page

- [ ] **Step 1: Install jsPDF**

```bash
npm install jspdf jspdf-autotable
npm install -D @types/jspdf
```

- [ ] **Step 2: Write PDF generation utility**

Create `src/lib/pdf.ts`:

```typescript
'use client'

import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface VisitPDFData {
  patient: {
    fullName: string
    patientId: string
    gender?: string | null
    phone?: string | null
    governorate?: string | null
    city?: string | null
  }
  visit: {
    specialty: string
    description?: string | null
    diagnosis?: string | null
    generalCondition?: string | null
    createdAt: string
  }
  medications: {
    name: string
    concentration?: string | null
    dosage?: string | null
    frequency?: string | null
    duration?: string | null
    quantity?: string | null
  }[]
  committeeReviews: {
    userName: string
    decision: string
    notes?: string | null
    createdAt: string
  }[]
  finalDecision?: {
    decisionType: string
    dispenseDuration?: string | null
    dispenseQuantity?: string | null
    dispenseSchedule?: string | null
    doctorName?: string | null
    reason?: string | null
  } | null
}

export function generateVisitPDF(data: VisitPDFData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Use built-in Helvetica (supports basic Arabic display)
  doc.setFont('Helvetica')
  let y = 20

  // Title
  doc.setFontSize(18)
  doc.text(`Report - ${data.patient.patientId}`, 105, y, { align: 'center' })
  y += 12

  // Patient Info
  doc.setFontSize(12)
  doc.text(`Patient: ${data.patient.fullName}`, 190, y, { align: 'right' })
  y += 7
  doc.text(`ID: ${data.patient.patientId}`, 190, y, { align: 'right' })
  y += 7
  if (data.patient.phone) {
    doc.text(`Phone: ${data.patient.phone}`, 190, y, { align: 'right' })
    y += 7
  }
  y += 5

  // Visit Info
  doc.setFontSize(14)
  doc.text('Visit Details', 190, y, { align: 'right' })
  y += 7
  doc.setFontSize(11)
  doc.text(`Specialty: ${data.visit.specialty}`, 190, y, { align: 'right' })
  y += 6
  doc.text(`Date: ${data.visit.createdAt}`, 190, y, { align: 'right' })
  y += 6
  if (data.visit.diagnosis) {
    doc.text(`Diagnosis: ${data.visit.diagnosis}`, 190, y, { align: 'right' })
    y += 6
  }
  y += 5

  // Medications Table
  if (data.medications.length > 0) {
    doc.setFontSize(14)
    doc.text('Prescription', 190, y, { align: 'right' })
    y += 5
    ;(doc as any).autoTable({
      startY: y,
      head: [['Medication', 'Concentration', 'Dosage', 'Frequency', 'Duration', 'Quantity']],
      body: data.medications.map((m) => [
        m.name, m.concentration || '', m.dosage || '',
        m.frequency || '', m.duration || '', m.quantity || '',
      ]),
      styles: { fontSize: 9, halign: 'right' },
      headStyles: { fillColor: [99, 102, 241] },
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  // Committee Reviews
  if (data.committeeReviews.length > 0) {
    doc.setFontSize(14)
    doc.text('Committee Reviews', 190, y, { align: 'right' })
    y += 5
    ;(doc as any).autoTable({
      startY: y,
      head: [['Member', 'Decision', 'Notes', 'Date']],
      body: data.committeeReviews.map((r) => [
        r.userName, r.decision, r.notes || '', r.createdAt,
      ]),
      styles: { fontSize: 9, halign: 'right' },
      headStyles: { fillColor: [234, 179, 8] },
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  // Final Decision
  if (data.finalDecision) {
    doc.setFontSize(14)
    doc.text('Final Decision', 190, y, { align: 'right' })
    y += 7
    doc.setFontSize(11)
    const decisionLabels: Record<string, string> = {
      charity: 'Charity',
      paid: 'Paid',
      denied: 'Denied',
    }
    doc.text(`Decision: ${decisionLabels[data.finalDecision.decisionType] || data.finalDecision.decisionType}`, 190, y, { align: 'right' })
    y += 6
    if (data.finalDecision.dispenseDuration) {
      doc.text(`Duration: ${data.finalDecision.dispenseDuration}`, 190, y, { align: 'right' })
      y += 6
    }
    if (data.finalDecision.dispenseQuantity) {
      doc.text(`Quantity: ${data.finalDecision.dispenseQuantity}`, 190, y, { align: 'right' })
      y += 6
    }
    if (data.finalDecision.doctorName) {
      doc.text(`Doctor: ${data.finalDecision.doctorName}`, 190, y, { align: 'right' })
    }
  }

  doc.save(`visit-report-${data.patient.patientId}.pdf`)
}
```

- [ ] **Step 3: Add PDF download button to visit details page**

Add a client-side PDF download button component and include it in the visit page. The visit page will pass data to a client component that calls `generateVisitPDF()`.

---

## Task 11: Admin — User Management

**Files:**
- Create: `src/lib/actions/user-actions.ts`
- Create: `src/app/(authenticated)/admin/users/page.tsx`

**Produces:**
- `createUser(formData)` → creates new user with hashed password
- Admin user management page (list users + create form)

- [ ] **Step 1: Write user management actions**

Create `src/lib/actions/user-actions.ts`:

```typescript
'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

export async function createUser(formData: FormData) {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/dashboard')

  const hashedPassword = await bcrypt.hash(formData.get('password') as string, 10)

  const user = await prisma.user.create({
    data: {
      username: formData.get('username') as string,
      password: hashedPassword,
      name: formData.get('name') as string,
      role: (formData.get('role') as string) || 'member',
    },
  })

  await logAudit(session.userId, 'إنشاء حساب مستخدم', `تم إنشاء حساب ${user.username}`, 'user', user.id)
  redirect('/admin/users')
}

export async function toggleUserActive(userId: number) {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/dashboard')

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return

  await prisma.user.update({
    where: { id: userId },
    data: { active: !user.active },
  })

  await logAudit(session.userId, user.active ? 'تعطيل حساب' : 'تفعيل حساب', user.username, 'user', userId)
  redirect('/admin/users')
}
```

- [ ] **Step 2: Write admin users page**

Create `src/app/(authenticated)/admin/users/page.tsx`:

```tsx
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createUser, toggleUserActive } from '@/lib/actions/user-actions'

export default async function AdminUsersPage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/dashboard')

  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div className="page">
      <h1 className="page-title">إدارة المستخدمين</h1>

      {/* Create User Form */}
      <form action={createUser} className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '16px' }}>➕ إضافة مستخدم جديد</h2>
        <div className="grid-2">
          <div className="form-group">
            <label>اسم المستخدم *</label>
            <input name="username" required />
          </div>
          <div className="form-group">
            <label>الاسم الكامل *</label>
            <input name="name" required />
          </div>
          <div className="form-group">
            <label>كلمة المرور *</label>
            <input name="password" type="password" required />
          </div>
          <div className="form-group">
            <label>الدور</label>
            <select name="role">
              <option value="member">عضو</option>
              <option value="doctor">طبيب</option>
              <option value="admin">مدير</option>
            </select>
          </div>
        </div>
        <button type="submit" className="btn btn-primary">إنشاء الحساب</button>
      </form>

      {/* User List */}
      <div className="card">
        <h2 style={{ fontSize: '1rem', marginBottom: '16px' }}>المستخدمون ({users.length})</h2>
        <table>
          <thead>
            <tr>
              <th>اسم المستخدم</th>
              <th>الاسم</th>
              <th>الدور</th>
              <th>الحالة</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={{ fontFamily: 'monospace' }}>{user.username}</td>
                <td>{user.name}</td>
                <td>{user.role}</td>
                <td>
                  <span className={`badge ${user.active ? 'badge-approved' : 'badge-rejected'}`}>
                    {user.active ? 'فعال' : 'معطل'}
                  </span>
                </td>
                <td>
                  <form action={async () => { 'use server'; await toggleUserActive(user.id) }}>
                    <button type="submit" className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                      {user.active ? 'تعطيل' : 'تفعيل'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

---

## Task 12: Final Polish & Verification

- [ ] **Step 1: Add admin link to Navbar** (only visible for admin role)
- [ ] **Step 2: Test complete workflow:**
  1. Login as admin → create 2 test users
  2. Add a patient → verify PAT-000002 generated
  3. Add a visit with 2 medications
  4. Send to committee → add 2 committee reviews
  5. Send to doctor → submit final decision (charity)
  6. Verify status changes and audit log
  7. Download PDF
- [ ] **Step 3: Run on local network**

```bash
npm run dev -- --hostname 0.0.0.0
```

Access from other devices at `http://<your-local-ip>:3000`

- [ ] **Step 4: Commit all code**

```bash
git init
git add .
git commit -m "feat: Medical Complex Case Management System - MVP"
```

---

## Summary of All Pages

| Route | Purpose |
|-------|---------|
| `/login` | Login screen |
| `/dashboard` | Search, stats, recent visits |
| `/patients/new` | Add new patient form |
| `/patients/[id]` | Patient file + visit timeline |
| `/patients/[id]/visits/new` | Add visit + medications |
| `/visits/[id]` | Visit details (all info + actions) |
| `/visits/[id]/committee` | Committee member review form |
| `/visits/[id]/decision` | Doctor's final decision form |
| `/admin/users` | User management (admin only) |

## Complete Workflow

```
Login → Dashboard → Search/Add Patient → Open Patient File → Add Visit
→ Enter Case + Medications → Send to Committee → Committee Reviews
→ Send to Doctor → Doctor's Decision → Auto-status update + PDF ready
→ Everything in Audit Log
```
