import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  Grid3X3,
  Headphones,
  ListChecks,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react'
import type { QuizMode } from '../types'
import { useApp } from '../lib/AppContext'
import { speakKorean } from '../lib/speech'
import { getStoredValue, removeStoredValue, setStoredValue } from '../lib/storage'
import { compoundConsonants, compoundVowels, consonants, vowels } from '../data/hangul'
import { words, wordById } from '../data/words'
import { ProgressRing } from './Shared'
import type { HangulLetter, Word } from '../types'

type PracticeMode = QuizMode | 'review'

type Option = {
  id: string
  label: string
  detail?: string
}

type Question = {
  id: string
  prompt: string
  promptDetail?: string
  audioText?: string
  options: Option[]
  correctId: string
}

type Phase = 'setup' | 'quiz' | 'done'

const PRACTICE_SESSION_KEY = 'korea-learn-practice-session'

type PracticeSession = {
  mode: PracticeMode
  count: number
  questions: Question[]
  index: number
  selectedId: string | null
  answered: boolean
  correctCount: number
}

function parsePracticeSession(raw: string | null): PracticeSession | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<PracticeSession>
    const validModes: PracticeMode[] = ['word-ko-zh', 'word-zh-ko', 'listening', 'hangul', 'review']
    if (!parsed || !parsed.mode || !validModes.includes(parsed.mode)) return null
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) return null
    const count = Number(parsed.count)
    const index = Number(parsed.index)
    if (!Number.isInteger(count) || count <= 0) return null
    if (!Number.isInteger(index) || index < 0 || index >= parsed.questions.length) return null
    return {
      mode: parsed.mode,
      count,
      questions: parsed.questions,
      index,
      selectedId: typeof parsed.selectedId === 'string' ? parsed.selectedId : null,
      answered: Boolean(parsed.answered),
      correctCount: Number.isFinite(Number(parsed.correctCount)) ? Math.max(0, Number(parsed.correctCount)) : 0,
    }
  } catch {
    return null
  }
}

function loadSavedSession(): PracticeSession | null {
  try {
    return parsePracticeSession(window.localStorage.getItem(PRACTICE_SESSION_KEY))
  } catch {
    return null
  }
}

const modeMeta: Record<PracticeMode, { title: string; description: string; icon: typeof BookOpenCheck }> = {
  'word-ko-zh': { title: '看韩语选意思', description: '看到单词，选出对应的中文。', icon: BookOpenCheck },
  'word-zh-ko': { title: '看意思选韩语', description: '看到中文，选出正确的韩语单词。', icon: ListChecks },
  listening: { title: '听音选意', description: '只听发音，选出你听到的单词。', icon: Headphones },
  hangul: { title: '谚文认读', description: '看到字母，选出正确的名称。', icon: Grid3X3 },
  review: { title: '复习已学', description: '只复习你标为已学的单词。', icon: Sparkles },
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swap]] = [copy[swap], copy[index]]
  }
  return copy
}

function buildWordQuestion(
  mode: Exclude<PracticeMode, 'hangul'>,
  word: Word,
  pool: Word[],
): Question {
  const distractors = shuffle(pool.filter((item) => item.id !== word.id)).slice(0, 3)
  const correct: Option = { id: word.id, label: mode === 'word-zh-ko' ? word.ko : word.zh, detail: mode === 'word-zh-ko' ? word.roman : word.category }
  const wrong: Option[] = distractors.map((item) => ({
    id: item.id,
    label: mode === 'word-zh-ko' ? item.ko : item.zh,
    detail: mode === 'word-zh-ko' ? item.roman : item.category,
  }))
  const options = shuffle([correct, ...wrong])
  const listening = mode === 'listening'
  return {
    id: word.id,
    prompt: listening ? '听发音，选择正确的意思' : mode === 'word-zh-ko' ? word.zh : word.ko,
    promptDetail: listening || mode === 'word-ko-zh' ? word.roman : word.category,
    audioText: listening ? word.ko : undefined,
    options,
    correctId: word.id,
  }
}

function buildLetterQuestion(letter: HangulLetter, pool: HangulLetter[]): Question {
  const distractors = shuffle(pool.filter((item) => item.char !== letter.char)).slice(0, 3)
  const options = shuffle([
    { id: letter.char, label: letter.name, detail: letter.roman },
    ...distractors.map((item) => ({ id: item.char, label: item.name, detail: item.roman })),
  ])
  return {
    id: letter.char,
    prompt: letter.char,
    promptDetail: '选择正确的字母名称',
    options,
    correctId: letter.char,
  }
}

function buildQuestions(mode: PracticeMode, count: number, learnedIds: string[]): Question[] {
  if (mode === 'hangul') {
    const pool = [...consonants, ...vowels, ...compoundConsonants, ...compoundVowels]
    return shuffle(pool)
      .slice(0, count)
      .map((letter) => buildLetterQuestion(letter, pool))
  }
  const pool = mode === 'review' ? words.filter((word) => learnedIds.includes(word.id)) : words
  return shuffle(pool)
    .slice(0, count)
    .map((word) => buildWordQuestion(mode, word, pool))
}

export function PracticeView() {
  const { progress, recordPractice, reviewWords, voiceRate, notify } = useApp()
  const [savedSession] = useState(() => loadSavedSession())
  const [mode, setMode] = useState<PracticeMode>(savedSession?.mode ?? 'word-ko-zh')
  const [count, setCount] = useState(savedSession?.count ?? 10)
  const [phase, setPhase] = useState<Phase>(savedSession ? 'quiz' : 'setup')
  const [questions, setQuestions] = useState<Question[]>(savedSession?.questions ?? [])
  const [index, setIndex] = useState(savedSession?.index ?? 0)
  const [selectedId, setSelectedId] = useState<string | null>(savedSession?.selectedId ?? null)
  const [answered, setAnswered] = useState(savedSession?.answered ?? false)
  const [correctCount, setCorrectCount] = useState(savedSession?.correctCount ?? 0)
  const sessionRef = useRef<PracticeSession | null>(null)
  const appliedSessionRef = useRef(false)
  const phaseRef = useRef<Phase>(phase)

  const learnedIds = useMemo(() => Object.keys(progress.learnedWords), [progress.learnedWords])

  phaseRef.current = phase

  useEffect(() => {
    sessionRef.current =
      phase === 'quiz' && questions.length
        ? { mode, count, questions, index, selectedId, answered, correctCount }
        : null
  })

  useEffect(() => {
    let active = true
    void (async () => {
      const raw = await getStoredValue(PRACTICE_SESSION_KEY)
      if (!active || appliedSessionRef.current || phaseRef.current !== 'setup') return
      const session = parsePracticeSession(raw)
      if (!session) return
      appliedSessionRef.current = true
      setMode(session.mode)
      setCount(session.count)
      setQuestions(session.questions)
      setIndex(session.index)
      setSelectedId(session.selectedId)
      setAnswered(session.answered)
      setCorrectCount(session.correctCount)
      setPhase('quiz')
    })()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const session = sessionRef.current
    if (session) void setStoredValue(PRACTICE_SESSION_KEY, JSON.stringify(session))
  }, [mode, count, questions, index, selectedId, answered, correctCount, phase])

  useEffect(() => {
    if (phase === 'done') void removeStoredValue(PRACTICE_SESSION_KEY)
  }, [phase])

  useEffect(() => {
    const persist = () => {
      const session = sessionRef.current
      if (session) void setStoredValue(PRACTICE_SESSION_KEY, JSON.stringify(session))
    }
    window.addEventListener('pagehide', persist)
    return () => {
      window.removeEventListener('pagehide', persist)
      persist()
    }
  }, [])

  useEffect(() => {
    if (phase === 'quiz' && mode === 'listening' && questions[index]?.audioText) {
      const ok = speakKorean(questions[index].audioText ?? '', voiceRate)
      if (!ok) notify('当前浏览器不支持语音合成')
    }
  }, [phase, mode, index, questions, voiceRate, notify])

  const start = (nextMode = mode, nextCount = count) => {
    if (nextMode === 'review' && learnedIds.length === 0) return
    appliedSessionRef.current = true
    setMode(nextMode)
    setCount(nextCount)
    setQuestions(buildQuestions(nextMode, nextCount, learnedIds))
    setIndex(0)
    setCorrectCount(0)
    setSelectedId(null)
    setAnswered(false)
    setPhase('quiz')
  }

  const playAnswerAudio = (question: Question) => {
    if (mode === 'hangul') {
      const name = question.options.find((option) => option.id === question.correctId)?.label
      return name ? speakKorean(name, voiceRate) : false
    }
    const text = question.audioText ?? wordById(question.correctId)?.ko
    return text ? speakKorean(text, voiceRate) : false
  }

  const answer = (optionId: string) => {
    if (answered) return
    setSelectedId(optionId)
    setAnswered(true)
    const ok = playAnswerAudio(questions[index])
    if (!ok) notify('当前浏览器不支持语音合成')
    if (optionId === questions[index].correctId) setCorrectCount((value) => value + 1)
  }

  const next = () => {
    if (index < questions.length - 1) {
      setIndex((value) => value + 1)
      setSelectedId(null)
      setAnswered(false)
      return
    }
    const finalMode: QuizMode = mode === 'review' ? 'word-ko-zh' : mode
    recordPractice(finalMode, correctCount, questions.length)
    if (mode === 'review') reviewWords(questions.map((question) => question.id))
    setPhase('done')
  }

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (phase !== 'quiz') return
      if (!answered && ['1', '2', '3', '4'].includes(event.key)) {
        const option = questions[index]?.options[Number(event.key) - 1]
        if (option) answer(option.id)
      } else if (answered && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  const accuracy = questions.length ? correctCount / questions.length : 0
  const current = questions[index]

  return (
    <div className="view-stack practice-view">
      {phase === 'setup' ? (
        <>
          <section className="practice-setup">
            <div className="practice-setup__intro">
              <span className="pill pill--green">
                <Sparkles size={14} />
                即时反馈
              </span>
              <h2>选择一种练习方式</h2>
              <p>每次 5–15 题，答完立刻知道对错，全部记录保存在本机。</p>
            </div>

            <div className="mode-grid">
              {(Object.keys(modeMeta) as PracticeMode[]).map((item) => {
                const Icon = modeMeta[item].icon
                const disabled = item === 'review' && learnedIds.length === 0
                return (
                  <motion.button
                    key={item}
                    type="button"
                    className={`mode-card ${mode === item ? 'mode-card--active' : ''} ${disabled ? 'mode-card--disabled' : ''}`}
                    onClick={() => {
                      if (!disabled) {
                        setMode(item)
                        start(item, count)
                      }
                    }}
                    whileTap={disabled ? undefined : { scale: 0.97 }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                  >
                    <span className={`mode-card__icon mode-card__icon--${item === 'listening' ? 'green' : item === 'hangul' ? 'blue' : item === 'review' ? 'coral' : 'ink'}`}>
                      <Icon size={20} />
                    </span>
                    <strong>{modeMeta[item].title}</strong>
                    <small>{modeMeta[item].description}</small>
                  </motion.button>
                )
              })}
            </div>

            <div className="practice-count">
              <span>题目数量</span>
              <div className="segmented" role="group" aria-label="题目数量">
                {[5, 10, 15].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={count === item ? 'segmented__item segmented__item--active' : 'segmented__item'}
                    onClick={() => setCount(item)}
                  >
                    {item} 题
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="button button--primary"
                onClick={() => start()}
                disabled={mode === 'review' && learnedIds.length === 0}
              >
                <ArrowRight size={16} />
                开始 {count} 题
              </button>
            </div>
          </section>
        </>
      ) : null}

      {phase === 'quiz' && current ? (
        <section className="quiz-surface">
          <div className="quiz-surface__top">
            <button
              type="button"
              className="icon-button"
              aria-label="退出练习"
              title="退出练习"
              onClick={() => setPhase('setup')}
            >
              <X size={18} />
            </button>
            <div className="quiz-progress">
              <div className="quiz-progress__labels">
                <span>第 {index + 1} / {questions.length} 题</span>
                <span>答对 {correctCount}</span>
              </div>
              <div className="quiz-progress__bar">
                <motion.div
                  className="quiz-progress__fill"
                  initial={false}
                  animate={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                />
              </div>
            </div>
            <span className="pill pill--blue">
              {modeMeta[mode].title}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              className="question-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            >
              <div className="question-card__prompt">
                {mode === 'listening' ? (
                  <button
                    type="button"
                    className="listen-replay"
                    onClick={() => {
                      const ok = speakKorean(current.audioText ?? '', voiceRate)
                      if (!ok) notify('当前浏览器不支持语音合成')
                    }}
                  >
                    <Headphones size={24} />
                    再听一次
                  </button>
                ) : (
                  <>
                    <span className="question-card__hangul">{current.prompt}</span>
                    {current.promptDetail ? <span className="question-card__detail">{current.promptDetail}</span> : null}
                  </>
                )}
              </div>

              <div className="option-list">
                {current.options.map((option, optionIndex) => {
                  const isCorrect = option.id === current.correctId
                  const isSelected = option.id === selectedId
                  const stateClass = !answered
                    ? ''
                    : isCorrect
                      ? 'option--correct'
                      : isSelected
                        ? 'option--wrong'
                        : 'option--dim'
                  return (
                    <motion.button
                      key={option.id}
                      type="button"
                      className={`option ${stateClass}`}
                      onClick={() => answer(option.id)}
                      whileTap={answered ? undefined : { scale: 0.985 }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
                    >
                      <span className="option__key">{optionIndex + 1}</span>
                      <span className="option__label">{option.label}</span>
                      {option.detail ? <span className="option__detail">{option.detail}</span> : null}
                      {answered && isCorrect ? (
                        <span className="option__mark option__mark--correct">
                          <Check size={17} strokeWidth={3} />
                        </span>
                      ) : null}
                      {answered && isSelected && !isCorrect ? (
                        <span className="option__mark option__mark--wrong">
                          <X size={17} strokeWidth={3} />
                        </span>
                      ) : null}
                    </motion.button>
                  )
                })}
              </div>

              {answered ? (
                <motion.div
                  className="answer-feedback"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                >
                  <span className={`answer-feedback__mark ${selectedId === current.correctId ? 'answer-feedback__mark--good' : 'answer-feedback__mark--bad'}`}>
                    {selectedId === current.correctId ? <Check size={17} strokeWidth={3} /> : <X size={17} strokeWidth={3} />}
                  </span>
                  <div>
                    <strong>{selectedId === current.correctId ? '答对了' : '没关系'}</strong>
                    <p>
                      {current.correctId && wordById(current.correctId)
                        ? `${wordById(current.correctId)?.ko} · ${wordById(current.correctId)?.zh}`
                        : mode === 'hangul'
                          ? current.options.find((option) => option.id === current.correctId)?.label
                          : ''}
                    </p>
                  </div>
                  <button type="button" className="button button--primary" onClick={next}>
                    {index === questions.length - 1 ? '查看结果' : '下一题'}
                    <ArrowRight size={15} />
                  </button>
                </motion.div>
              ) : (
                <p className="quiz-hint">点击选项作答，也可以按数字键 1–4。</p>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      ) : null}

      {phase === 'done' ? (
        <section className="result-card">
          <div className="result-card__ring">
            <ProgressRing value={accuracy} size={132} />
          </div>
          <span className="pill pill--green">
            <Sparkles size={14} />
            练习完成
          </span>
          <h2>{accuracy >= 0.9 ? '非常稳' : accuracy >= 0.7 ? '做得不错' : '再来一组会更好'}</h2>
          <p>
            共 {questions.length} 题，答对 {correctCount} 题，正确率 {Math.round(accuracy * 100)}%。
          </p>
          <div className="result-card__actions">
            <button type="button" className="button button--secondary" onClick={() => setPhase('setup')}>
              <RotateCcw size={16} />
              返回选择
            </button>
            <button type="button" className="button button--primary" onClick={() => start(mode, count)}>
              <ArrowRight size={16} />
              再来一组
            </button>
          </div>
        </section>
      ) : null}
    </div>
  )
}
