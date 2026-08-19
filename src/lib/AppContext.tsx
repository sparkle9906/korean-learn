import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { DailyPlan, QuizMode, StoredProgress, Theme } from '../types'
import { wordById } from '../data/words'
import { getStoredValue, migrateLegacyStudyStorage, removeStoredValue, setStoredValue } from './storage'

const PROGRESS_KEY = 'korea-learn-progress-v1'
const THEME_KEY = 'korea-learn-theme'
const RATE_KEY = 'korea-learn-rate'
const VOICE_RATE_MIN = 0.6
const VOICE_RATE_MAX = 1.25

type ToastState = { id: number; message: string }

type AppContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  progress: StoredProgress
  toggleWordLearned: (id: string) => void
  togglePhraseLearned: (id: string) => void
  learnLetter: (char: string) => void
  recordPractice: (mode: QuizMode, correct: number, total: number) => void
  reviewWords: (ids: string[]) => void
  resetProgress: () => void
  streak: number
  todayKey: string
  storageReady: boolean
  setDailyPlan: (date: string, plan: DailyPlan) => void
  dueWords: string[]
  todayPoints: number
  masteredWordCount: number
  learnedPhraseCount: number
  voiceRate: number
  setVoiceRate: (rate: number) => void
  toast: ToastState | null
  notify: (message: string) => void
}

const emptyHistory = { correct: 0, total: 0, sessions: 0 }

const emptyProgress: StoredProgress = {
  learnedWords: {},
  learnedPhrases: [],
  dailyPlans: {},
  learnedLetters: [],
  reviewsByDate: {},
  history: {
    'word-ko-zh': { ...emptyHistory },
    'word-zh-ko': { ...emptyHistory },
    listening: { ...emptyHistory },
    hangul: { ...emptyHistory },
  },
  activity: {},
}

function dateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shiftDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function normalizeProgress(raw: string | null): StoredProgress {
  try {
    if (!raw) return emptyProgress
    const parsed = JSON.parse(raw) as Partial<StoredProgress> & { favoritePhrases?: unknown }
    const { favoritePhrases, learnedPhrases, dailyPlans: rawDailyPlans, ...rest } = parsed
    const migratedPhrases = Array.isArray(learnedPhrases)
      ? learnedPhrases.filter((id): id is string => typeof id === 'string')
      : Array.isArray(favoritePhrases)
        ? favoritePhrases.filter((id): id is string => typeof id === 'string')
        : []
    const dailyPlans =
      rawDailyPlans && typeof rawDailyPlans === 'object'
        ? Object.fromEntries(
            Object.entries(rawDailyPlans as Record<string, unknown>).flatMap(([date, value]) => {
              if (!value || typeof value !== 'object') return []
              const plan = value as Partial<DailyPlan>
              const wordIds = Array.isArray(plan.wordIds)
                ? plan.wordIds.filter((id): id is string => typeof id === 'string')
                : []
              const phraseId = typeof plan.phraseId === 'string' ? plan.phraseId : ''
              if (wordIds.length === 0 && !phraseId) return []
              return [[date, { wordIds, phraseId } satisfies DailyPlan]]
            }),
          )
        : {}
    return {
      ...emptyProgress,
      ...rest,
      learnedPhrases: migratedPhrases,
      dailyPlans,
      history: { ...emptyProgress.history, ...(parsed.history ?? {}) },
    }
  } catch {
    return emptyProgress
  }
}

function loadProgress(): StoredProgress {
  try {
    return normalizeProgress(localStorage.getItem(PROGRESS_KEY))
  } catch {
    return emptyProgress
  }
}

function loadTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'system' || stored === 'light' || stored === 'dark') return stored
  } catch {
    // Use the default below.
  }
  return 'system'
}

function resolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function clampVoiceRate(rate: number): number {
  return Math.min(VOICE_RATE_MAX, Math.max(VOICE_RATE_MIN, rate))
}

function loadRate(): number {
  let stored = 0
  try {
    stored = Number(localStorage.getItem(RATE_KEY))
  } catch {
    return 1
  }
  if (Number.isFinite(stored) && stored >= 0.5 && stored <= 1.5) return clampVoiceRate(stored)
  return 1
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(loadTheme)
  const [progress, setProgress] = useState<StoredProgress>(loadProgress)
  const [voiceRate, setVoiceRateState] = useState<number>(loadRate)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [storageReady, setStorageReady] = useState(false)
  const hydratedRef = useRef(false)
  const toastTimer = useRef<number | null>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      await migrateLegacyStudyStorage()
      const [storedProgress, storedTheme, storedRate] = await Promise.all([
        getStoredValue(PROGRESS_KEY),
        getStoredValue(THEME_KEY),
        getStoredValue(RATE_KEY),
      ])
      if (!active) return
      setProgress(normalizeProgress(storedProgress))
      if (storedTheme === 'system' || storedTheme === 'light' || storedTheme === 'dark') setTheme(storedTheme)
      const rate = Number(storedRate)
      if (Number.isFinite(rate) && rate >= 0.5 && rate <= 1.5) setVoiceRateState(clampVoiceRate(rate))
      hydratedRef.current = true
      setStorageReady(true)
    })()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      document.documentElement.dataset.theme = resolvedTheme(theme)
    }

    applyTheme()
    if (hydratedRef.current) void setStoredValue(THEME_KEY, theme)
    if (theme !== 'system') return undefined

    mediaQuery.addEventListener('change', applyTheme)
    return () => mediaQuery.removeEventListener('change', applyTheme)
  }, [theme])

  useEffect(() => {
    if (hydratedRef.current) void setStoredValue(PROGRESS_KEY, JSON.stringify(progress))
  }, [progress])

  useEffect(() => {
    if (!storageReady) return
    const persistBeforeExit = () => {
      void setStoredValue(PROGRESS_KEY, JSON.stringify(progress))
      void setStoredValue(THEME_KEY, theme)
      void setStoredValue(RATE_KEY, String(voiceRate))
    }
    window.addEventListener('pagehide', persistBeforeExit)
    return () => window.removeEventListener('pagehide', persistBeforeExit)
  }, [progress, storageReady, theme, voiceRate])

  useEffect(() => {
    if (hydratedRef.current) void setStoredValue(RATE_KEY, String(voiceRate))
  }, [voiceRate])

  const notify = useCallback((message: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), message })
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }, [])

  const todayKey = dateKey()

  const toggleWordLearned = useCallback((id: string) => {
    setProgress((current) => {
      const learnedWords = { ...current.learnedWords }
      const day = dateKey()
      let activity = current.activity
      const learnedAt = learnedWords[id]

      if (learnedAt) {
        delete learnedWords[id]

        // A same-day toggle must undo the single point that marking this word
        // learned just added. Older learning records did not affect today's score.
        if (dateKey(new Date(learnedAt)) === day) {
          activity = { ...activity, [day]: Math.max(0, (activity[day] ?? 0) - 1) }
        }
      } else {
        learnedWords[id] = Date.now()
        activity = { ...activity, [day]: (activity[day] ?? 0) + 1 }
      }

      return { ...current, learnedWords, activity }
    })
  }, [])

  const togglePhraseLearned = useCallback((id: string) => {
    setProgress((current) => {
      const learnedPhrases = current.learnedPhrases.includes(id)
        ? current.learnedPhrases.filter((phraseId) => phraseId !== id)
        : [...current.learnedPhrases, id]
      return { ...current, learnedPhrases }
    })
  }, [])

  const setDailyPlan = useCallback((date: string, plan: DailyPlan) => {
    setProgress((current) => {
      if (current.dailyPlans[date]) return current
      return { ...current, dailyPlans: { ...current.dailyPlans, [date]: plan } }
    })
  }, [])

  const setVoiceRate = useCallback((rate: number) => {
    if (!Number.isFinite(rate)) return
    setVoiceRateState(clampVoiceRate(rate))
  }, [])

  const learnLetter = useCallback((char: string) => {
    setProgress((current) => {
      if (current.learnedLetters.includes(char)) return current
      const day = dateKey()
      return {
        ...current,
        learnedLetters: [...current.learnedLetters, char],
        activity: { ...current.activity, [day]: (current.activity[day] ?? 0) + 1 },
      }
    })
  }, [])

  const recordPractice = useCallback((mode: QuizMode, correct: number, total: number) => {
    setProgress((current) => {
      const previous = current.history[mode] ?? emptyHistory
      const day = dateKey()
      return {
        ...current,
        history: {
          ...current.history,
          [mode]: {
            correct: previous.correct + correct,
            total: previous.total + total,
            sessions: previous.sessions + 1,
          },
        },
        activity: { ...current.activity, [day]: (current.activity[day] ?? 0) + correct },
      }
    })
  }, [])

  const reviewWords = useCallback((ids: string[]) => {
    setProgress((current) => {
      const day = dateKey()
      const reviewed = new Set(current.reviewsByDate[day] ?? [])
      ids.forEach((id) => reviewed.add(id))
      return {
        ...current,
        reviewsByDate: { ...current.reviewsByDate, [day]: [...reviewed] },
      }
    })
  }, [])

  const resetProgress = useCallback(() => {
    setProgress(emptyProgress)
    void removeStoredValue(PROGRESS_KEY)
    notify('已清空全部学习记录')
  }, [notify])

  const streak = useMemo(() => {
    let count = 0
    let cursor = new Date()
    if (!(progress.activity[dateKey(cursor)] ?? 0)) cursor = shiftDays(cursor, -1)
    while ((progress.activity[dateKey(cursor)] ?? 0) > 0) {
      count += 1
      cursor = shiftDays(cursor, -1)
      if (count > 3650) break
    }
    return count
  }, [progress.activity])

  const dueWords = useMemo(() => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const reviewedToday = new Set(progress.reviewsByDate[todayKey] ?? [])
    return Object.entries(progress.learnedWords)
      .filter(([id, timestamp]) => {
        const word = wordById(id)
        return word && timestamp < startOfToday.getTime() && !reviewedToday.has(id)
      })
      .map(([id]) => id)
  }, [progress.learnedWords, progress.reviewsByDate, todayKey])

  const todayPoints = progress.activity[todayKey] ?? 0
  const masteredWordCount = Object.keys(progress.learnedWords).length
  const learnedPhraseCount = progress.learnedPhrases.length

  const value: AppContextValue = {
    theme,
    setTheme,
    progress,
    toggleWordLearned,
    togglePhraseLearned,
    learnLetter,
    recordPractice,
    reviewWords,
    resetProgress,
    streak,
    todayKey,
    storageReady,
    setDailyPlan,
    dueWords,
    todayPoints,
    masteredWordCount,
    learnedPhraseCount,
    voiceRate,
    setVoiceRate,
    toast,
    notify,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be used inside AppProvider')
  return value
}

export function formatDate(date = new Date()): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date)
}

export function dayOfYear(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0)
  return Math.floor((date.getTime() - start.getTime()) / 86400000)
}
