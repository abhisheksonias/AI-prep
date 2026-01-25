'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'

type Highlight = {
  title: string
  description: string
  badge?: string
}

const highlights: Highlight[] = [
  {
    title: 'Mock interviews that feel real',
    description:
      'Adaptive interview flows with voice, timing, and structured scoring to mirror live hiring conversations.',
    badge: 'Live + async',
  },
  {
    title: 'Resume insights with recruiter focus',
    description:
      'Line-by-line feedback, readability checks, and quantified impact suggestions tuned for hiring managers.',
  },
  {
    title: 'Performance analytics you can act on',
    description:
      'Question-level strengths, follow-up prompts, and practice plans that sharpen every session.',
  },
]

const steps: Highlight[] = [
  {
    title: 'Set your target role',
    description: 'Choose the tech stack, seniority, and company style you are aiming for.',
    badge: '1',
  },
  {
    title: 'Practice with AI Career Mate',
    description: 'Run mock interviews, get resume revisions, and iterate with focused drills.',
    badge: '2',
  },
  {
    title: 'Ship the confident version of you',
    description: 'Walk into interviews prepared with stories, metrics, and delivery pacing.',
    badge: '3',
  },
]

export default function HomePage() {
  const { user } = useAuth()

  const primaryCta = useMemo(() => {
    if (!user) {
      return { label: 'Get started free', href: '/login?mode=signup' }
    }

    const dashboardHref = user.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/student'
    return { label: 'Go to dashboard', href: dashboardHref }
  }, [user])

  return (
    <div className="relative min-h-screen bg-ink text-secondary">
      <div className="absolute inset-0 -z-10 bg-ink" aria-hidden="true" />

      <header className="sticky top-0 z-20 border-b border-white/5 bg-ink/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight text-secondary">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/30">
              AI
            </span>
            <span className="uppercase text-sm font-semibold text-secondary">AI Career Mate</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-secondary/80 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#playbook" className="transition hover:text-white">
              How it works
            </a>
            <a href="#cta" className="transition hover:text-white">
              Start now
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-secondary transition hover:text-white"
            >
              Log in
            </Link>
            <Link
              href={primaryCta.href}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/40 transition hover:translate-y-[-1px] hover:shadow-primary/50"
            >
              {primaryCta.label}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-6">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Built for interview-ready momentum
            </div>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Your AI career mate for confident interviews and sharper resumes.
            </h1>
            <p className="max-w-2xl text-lg text-secondary/90">
              Train with realistic mock interviews, tailored feedback loops, and resume critiques that keep you moving toward the next offer.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={primaryCta.href}
                className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/40 transition hover:translate-y-[-2px] hover:shadow-primary/50"
              >
                {primaryCta.label}
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-secondary transition hover:border-primary hover:text-white"
              >
                View the platform
              </Link>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-medium text-secondary">
                <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary" />
                Live practice and async drills included
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-ink/70 p-4 shadow-inner shadow-primary/10">
                <p className="text-3xl font-semibold text-white">12k+</p>
                <p className="text-sm text-secondary/80">Mock interview sessions completed</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-ink/70 p-4 shadow-inner shadow-primary/10">
                <p className="text-3xl font-semibold text-white">4.8 / 5</p>
                <p className="text-sm text-secondary/80">Average practice confidence score</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-ink/70 p-4 shadow-inner shadow-primary/10">
                <p className="text-3xl font-semibold text-white">2x</p>
                <p className="text-sm text-secondary/80">Faster turnaround on resume fixes</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink/70 p-6 shadow-2xl shadow-primary/30">
            <div className="relative space-y-6">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-ink/80 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-secondary/70">Live mock session</p>
                  <p className="text-base font-semibold text-white">Systems design · 45 min</p>
                </div>
                <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-white">In progress</span>
              </div>
              <div className="space-y-3 rounded-2xl border border-white/10 bg-ink/80 p-4">
                <div className="flex items-center justify-between text-sm text-secondary">
                  <span>Communication clarity</span>
                  <span className="font-semibold text-white">8.9</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-primary" style={{ width: '78%' }} />
                </div>
                <div className="flex items-center justify-between text-sm text-secondary">
                  <span>Technical depth</span>
                  <span className="font-semibold text-white">9.2</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-primary-strong" style={{ width: '82%' }} />
                </div>
                <div className="flex items-center justify-between text-sm text-secondary">
                  <span>Follow-up agility</span>
                  <span className="font-semibold text-white">8.7</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-primary/80" style={{ width: '74%' }} />
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-ink/80 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-secondary/70">Upcoming drill</p>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Behavioral loop · STAR</p>
                    <p className="text-xs text-secondary/80">Sharpen quantifiable outcomes for product launches.</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-secondary">15 min</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-16 space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-secondary/80">What you get</p>
              <h2 className="text-2xl font-semibold text-white">A platform that keeps you practicing with intent.</h2>
              <p className="max-w-2xl text-sm text-secondary/80">
                Layer voice-enabled mocks, resume diagnostics, and performance analytics to move from practice to prepared.
              </p>
            </div>
            <Link
              href={primaryCta.href}
              className="hidden rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-secondary transition hover:border-primary hover:text-white sm:inline-flex"
            >
              Try AI Career Mate
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="card-hover h-full rounded-2xl border border-white/10 bg-ink/70 p-5 shadow-lg shadow-primary/20"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  {item.badge ? (
                    <span className="rounded-full bg-primary/20 px-3 py-1 text-[11px] font-semibold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm text-secondary/80">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="playbook"
          className="mt-16 rounded-3xl border border-white/10 bg-ink/70 p-8 shadow-xl shadow-primary/25"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-secondary/80">Playbook</p>
              <h2 className="text-2xl font-semibold text-white">Designed for momentum week after week.</h2>
              <p className="text-sm text-secondary/80">
                Ship steady improvements with a repeatable flow you can run before interviews, during job searches, or between offers.
              </p>
            </div>
            <a href="#cta" className="text-sm font-semibold text-secondary hover:text-white">
              Join a practice run →
            </a>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.title} className="relative rounded-2xl border border-white/10 bg-ink/80 p-5">
                <span className="absolute -top-3 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-lg shadow-primary/30">
                  {step.badge}
                </span>
                <h3 className="mt-6 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-secondary/80">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 rounded-3xl border border-white/10 bg-ink/80 p-8 shadow-xl shadow-primary/25 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.18em] text-secondary/80">Proof points</p>
            <h3 className="text-2xl font-semibold text-white">Clarity and speed built in.</h3>
            <p className="text-sm text-secondary/80">
              Feedback loops stay short with concise scoring, actionable prompts, and context-aware practice plans.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-ink/70 p-4">
                <p className="text-3xl font-semibold text-white">93%</p>
                <p className="text-sm text-secondary/80">Report clearer interview stories after 3 sessions.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-ink/70 p-4">
                <p className="text-3xl font-semibold text-white">36 hrs</p>
                <p className="text-sm text-secondary/80">Average time to a revised resume ready to send.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 rounded-2xl border border-white/10 bg-ink/70 p-6">
            <div className="flex items-center justify-between text-sm text-secondary/85">
              <span>Mock interview focus</span>
              <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-white">System design</span>
            </div>
            <div className="space-y-3 rounded-xl border border-white/10 bg-ink/80 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-semibold text-white">Structure the narrative</p>
                  <p className="text-xs text-secondary/80">Use entry points: constraints, tradeoffs, rollout, and failure drills.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary-strong" />
                <div>
                  <p className="text-sm font-semibold text-white">Quantify outcomes</p>
                  <p className="text-xs text-secondary/80">Attach baseline metrics, target impact, and risk mitigations.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary/80" />
                <div>
                  <p className="text-sm font-semibold text-white">Practice follow-ups</p>
                  <p className="text-xs text-secondary/80">Run rapid-fire follow-ups with timers to tighten delivery.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="cta"
          className="mt-16 rounded-3xl border-2 border-primary bg-ink p-8 shadow-2xl shadow-primary/30"
        >
          <div className="px-0 py-2">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.18em] text-secondary/80">Ready when you are</p>
                <h3 className="text-2xl font-semibold text-white">Start a mock interview or upload your resume today.</h3>
                <p className="max-w-2xl text-sm text-secondary/85">
                  AI Career Mate keeps practice sessions organized, feedback actionable, and next steps obvious so you can move confidently to the next role.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={primaryCta.href}
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-lg shadow-white/30 transition hover:translate-y-[-2px]"
                >
                  {primaryCta.label}
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-white/60 px-5 py-3 text-sm font-semibold text-white transition hover:border-white"
                >
                  Book a practice slot
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

