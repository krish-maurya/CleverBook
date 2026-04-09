'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Package,
  Shield,
  Zap,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Preloader } from '@/components/preloader'


export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <>
      <Preloader onComplete={() => setIsLoading(false)} />

      {!isLoading && (
        <div className="min-h-screen bg-background">
          {/* Navigation */}
          <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md"
          >
            <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-glow shadow-lg shadow-lime-glow/20">
                  <Package className="h-6 w-6 text-background" />
                </div>
                <span className="text-2xl font-bold text-foreground">
                  Clever<span className="text-lime-glow">Books</span>
                </span>
              </Link>
            </div>
          </motion.nav>

          {/* Hero Section */}
          <section className="relative flex min-h-screen items-center overflow-hidden pt-24 pb-20 md:pt-28 md:pb-24">
            {/* Background gradient effects */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-pine/20 blur-3xl" />
              <div className="absolute top-1/4 right-0 h-[400px] w-[400px] rounded-full bg-lime-glow/10 blur-3xl" />
            </div>

            <div className="relative mx-auto w-full max-w-7xl px-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mx-auto max-w-4xl text-center"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mb-8 inline-flex items-center gap-3 rounded-full border border-lime-glow/30 bg-lime-glow/10 px-5 py-2 text-base font-medium text-lime-glow"
                >
                  <Zap className="h-5 w-5" />
                  <span>Automated Settlement Reconciliation</span>
                </motion.div>

                <h1 className="text-balance text-5xl font-bold tracking-tight text-foreground md:text-7xl lg:text-8xl">
                  Stop Losing Money on{' '}
                  <span className="text-lime-glow">Courier Disputes</span>
                </h1>

                <p className="mt-8 text-pretty text-xl leading-8 text-muted-foreground md:text-2xl md:leading-9">
                  CleverBooks automatically reconciles your courier settlements,
                  detects discrepancies, and alerts you in real-time. Save hours of
                  manual work and recover lost revenue.
                </p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row"
                >
                  <Link href="/dashboard">
                    <Button size="lg" className="h-14 bg-lime-glow px-8 text-lg text-background hover:bg-lime-glow/90">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-lime-glow" />
                    <span>Recover lost COD remittances</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-lime-glow" />
                    <span>Nightly auto-reconciliation at 2 AM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-lime-glow" />
                    <span>Dispute reports in one click</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
