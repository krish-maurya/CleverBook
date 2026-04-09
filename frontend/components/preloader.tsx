'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function Preloader({ onComplete }: { onComplete?: () => void }) {
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const duration = 2000
    const interval = 20
    const increment = 100 / (duration / interval)

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment
        if (next >= 100) {
          clearInterval(timer)
          setTimeout(() => {
            setIsComplete(true)
            onComplete?.()
          }, 300)
          return 100
        }
        return next
      })
    }, interval)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
        >
          <div className="flex flex-col items-center gap-8">
            {/* Animated Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              {/* Outer ring animation */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-lime-glow/30"
                style={{ width: 120, height: 120 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
              
              {/* Middle ring */}
              <motion.div
                className="absolute rounded-full border-2 border-emerald-pine"
                style={{ 
                  width: 100, 
                  height: 100, 
                  top: 10, 
                  left: 10 
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              />
              
              {/* Inner logo */}
              <motion.div
                className="relative flex h-[120px] w-[120px] items-center justify-center"
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <svg
                  width="50"
                  height="50"
                  viewBox="0 0 50 50"
                  fill="none"
                  className="text-lime-glow"
                >
                  <motion.path
                    d="M25 5L45 15V35L25 45L5 35V15L25 5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                  />
                  <motion.path
                    d="M25 15L35 20V30L25 35L15 30V20L25 15Z"
                    fill="currentColor"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  />
                </svg>
              </motion.div>
            </motion.div>

            {/* Brand name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Clever<span className="text-lime-glow">Books</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Settlement Reconciliation Engine
              </p>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 200 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="relative h-1 w-[200px] overflow-hidden rounded-full bg-muted"
            >
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-pine via-lime-glow to-green-tea"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </motion.div>

            {/* Loading text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xs text-muted-foreground"
            >
              {progress < 100 ? 'Loading...' : 'Ready'}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
