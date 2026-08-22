export type ViewId = 'today' | 'hangul' | 'words' | 'phrases' | 'practice' | 'progress'

export type HangulKind = 'consonant' | 'vowel'

export type HangulLetter = {
  char: string
  roman: string
  name: string
  tip: string
}

export type WordCategory = '问候' | '数字' | '食物' | '时间' | '家人' | '日常' | '天气' | '购物' | '地点' | '交通' | '描述'

export type Word = {
  id: string
  ko: string
  roman: string
  zh: string
  category: WordCategory
  note?: string
}

export type PhraseCategory = '问候' | '问路' | '点餐' | '日常' | '心情' | '交通' | '购物' | '住宿' | '紧急'

export type Phrase = {
  id: string
  ko: string
  roman: string
  zh: string
  category: PhraseCategory
  note?: string
}

export type QuizMode = 'word-ko-zh' | 'word-zh-ko' | 'listening' | 'hangul'

export type Theme = 'system' | 'light' | 'dark'

export type PracticeHistory = {
  correct: number
  total: number
  sessions: number
}

export type DailyPlan = {
  wordIds: string[]
  phraseId: string
}

export type StoredProgress = {
  learnedWords: Record<string, number>
  learnedPhrases: string[]
  dailyPlans: Record<string, DailyPlan>
  learnedLetters: string[]
  reviewsByDate: Record<string, string[]>
  history: Record<QuizMode, PracticeHistory>
  activity: Record<string, number>
}
