import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BarChart3, BookOpenCheck, CheckCircle2, Flame, Maximize2, RotateCcw, Trash2, X } from 'lucide-react'
import { useApp } from '../lib/AppContext'
import { wordById } from '../data/words'
import { SectionHeader } from './Shared'
import { speakKorean } from '../lib/speech'
import type { QuizMode, Word } from '../types'

const modeNames: Record<QuizMode, string> = {
  'word-ko-zh': '看韩语选意思',
  'word-zh-ko': '看意思选韩语',
  listening: '听音选意',
  hangul: '谚文认读',
}

function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function activityBars(activity: Record<string, number>, days = 14): { key: string; label: string; points: number; today: boolean }[] {
  const bars = Array.from({ length: days }, (_, offset) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - offset))
    const key = dateKey(date)
    return {
      key,
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      points: activity[key] ?? 0,
      today: offset === days - 1,
    }
  })
  return bars
}

function LearnedWordItem({ word, voiceRate, notify }: { word: Word; voiceRate: number; notify: (message: string) => void }) {
  const playWord = () => {
    const ok = speakKorean(word.ko, voiceRate)
    if (!ok) notify('当前浏览器不支持语音合成')
  }

  return (
    <motion.button
      type="button"
      className="recent-item"
      aria-label={`播放 ${word.ko} 发音`}
      title={`播放 ${word.ko} 发音`}
      onClick={playWord}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
    >
      <span className="recent-item__char">{word.ko}</span>
      <span className="recent-item__roman">{word.roman}</span>
      <span className="recent-item__zh">{word.zh}</span>
      <span className="category-tag">{word.category}</span>
    </motion.button>
  )
}

export function ProgressView() {
  const { progress, resetProgress, streak, masteredWordCount, favoritePhraseCount, todayPoints, voiceRate, notify } = useApp()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [learnedWordsOpen, setLearnedWordsOpen] = useState(false)

  const totalAnswered = Object.values(progress.history).reduce((sum, item) => sum + item.total, 0)
  const totalCorrect = Object.values(progress.history).reduce((sum, item) => sum + item.correct, 0)
  const totalSessions = Object.values(progress.history).reduce((sum, item) => sum + item.sessions, 0)
  const accuracy = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0
  const bars = activityBars(progress.activity)
  const maxPoints = Math.max(1, ...bars.map((bar) => bar.points))

  const learnedWords = Object.entries(progress.learnedWords)
    .sort((a, b) => b[1] - a[1])
    .flatMap(([id]) => {
      const word = wordById(id)
      return word ? [word] : []
    })
  const canExpandLearnedWords = learnedWords.length > 6
  const visibleLearnedWords = learnedWords.slice(0, 6)

  useEffect(() => {
    if (!learnedWordsOpen) return undefined
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLearnedWordsOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [learnedWordsOpen])

  return (
    <div className="view-stack">
      <div className="progress-summary">
        <div className="progress-summary__hero">
          <span className="pill pill--brand">
            <BarChart3 size={14} />
            学习快照
          </span>
          <h2>{streak ? `连续学习 ${streak} 天` : '从今天开始积累'}</h2>
          <p>{todayPoints ? `今天已获得 ${todayPoints} 点，继续保持。` : '完成一次练习或标一个单词已学，今天就有进度。'}</p>
        </div>
        <div className="stat-grid progress-summary__stats">
          <div className="stat-tile">
            <span className="stat-tile__value">{masteredWordCount}</span>
            <span className="stat-tile__label">已学单词</span>
          </div>
          <div className="stat-tile">
            <span className="stat-tile__value">{favoritePhraseCount}</span>
            <span className="stat-tile__label">收藏短语</span>
          </div>
          <div className="stat-tile">
            <span className="stat-tile__value">{totalSessions}</span>
            <span className="stat-tile__label">练习组数</span>
          </div>
          <div className="stat-tile">
            <span className="stat-tile__value">{accuracy}%</span>
            <span className="stat-tile__label">平均正确率</span>
          </div>
        </div>
      </div>

      <div className="progress-grid">
        <section className="activity-panel">
          <SectionHeader eyebrow="ACTIVITY" title="最近 14 天" description="每天做题和标记都会计入点数。" />
          <div className="activity-chart">
            {bars.map((bar) => (
              <div className={`activity-bar ${bar.today ? 'activity-bar--today' : ''}`} key={bar.key} title={`${bar.label} · ${bar.points} 点`}>
                <div className="activity-bar__track">
                  <motion.div
                    className="activity-bar__fill"
                    initial={{ height: 0 }}
                    animate={{ height: `${(bar.points / maxPoints) * 100}%` }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.6 }}
                  />
                </div>
                <span>{bar.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mode-panel">
          <SectionHeader eyebrow="ACCURACY" title="各题型正确率" />
          <div className="mode-rows">
            {(Object.keys(modeNames) as QuizMode[]).map((mode) => {
              const item = progress.history[mode]
              const modeAccuracy = item.total ? Math.round((item.correct / item.total) * 100) : 0
              return (
                <div className="mode-row" key={mode}>
                  <span className="mode-row__name">{modeNames[mode]}</span>
                  <div className="mode-row__bar">
                    <motion.div
                      className="mode-row__fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${modeAccuracy}%` }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.6 }}
                    />
                  </div>
                  <span className="mode-row__value">
                    {item.sessions ? `${modeAccuracy}% · ${item.sessions}组` : '未练习'}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <section
        className={`recent-panel ${canExpandLearnedWords ? 'recent-panel--expandable' : ''}`}
        tabIndex={canExpandLearnedWords ? 0 : undefined}
        aria-label={canExpandLearnedWords ? `最近学过的单词，已显示 ${visibleLearnedWords.length} 个，共 ${learnedWords.length} 个。点击查看全部。` : undefined}
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest('button')) return
          if (canExpandLearnedWords) setLearnedWordsOpen(true)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            if (canExpandLearnedWords) setLearnedWordsOpen(true)
          }
        }}
      >
        <SectionHeader
          eyebrow="RECENT"
          title="最近学过的单词"
          description="按最近学习时间排列。"
          action={
            <span className="count-badge">
              <CheckCircle2 size={14} />
              {canExpandLearnedWords ? <Maximize2 size={14} aria-hidden="true" /> : null}
              {visibleLearnedWords.length} / {learnedWords.length} 条记录
            </span>
          }
        />
        {visibleLearnedWords.length ? (
          <div className="recent-list">
            {visibleLearnedWords.map((word) => (
              <LearnedWordItem key={word.id} word={word} voiceRate={voiceRate} notify={notify} />
            ))}
          </div>
        ) : (
          <div className="empty-state empty-state--compact">
            <BookOpenCheck size={24} />
            <p>去单词页标几个词为已学吧。</p>
          </div>
        )}
      </section>

      <section className="reset-zone">
        <div>
          <strong>重置全部学习记录</strong>
          <p>会清空已学单词、收藏、练习历史和今日点数，且无法撤销。</p>
        </div>
        <button type="button" className="button button--danger" onClick={() => setConfirmOpen(true)}>
          <Trash2 size={16} />
          重置记录
        </button>
      </section>

      <AnimatePresence>
        {learnedWordsOpen ? (
          <motion.div
            className="learned-words-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLearnedWordsOpen(false)}
          >
            <motion.section
              className="learned-words-dialog"
              role="dialog"
              aria-modal="true"
              aria-label="全部已学习的单词"
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              onClick={(event) => event.stopPropagation()}
            >
              <header className="learned-words-dialog__header">
                <div>
                  <p className="eyebrow">LEARNED</p>
                  <h2>已学习的单词</h2>
                  <p>{learnedWords.length} 条记录，按最近学习时间排列。</p>
                </div>
                <button type="button" className="icon-button" aria-label="关闭已学习单词" title="关闭" onClick={() => setLearnedWordsOpen(false)}>
                  <X size={18} />
                </button>
              </header>
              <div className="learned-words-dialog__list">
                {learnedWords.map((word) => (
                  <LearnedWordItem key={word.id} word={word} voiceRate={voiceRate} notify={notify} />
                ))}
              </div>
            </motion.section>
          </motion.div>
        ) : null}
        {confirmOpen ? (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmOpen(false)}
          >
            <motion.div
              className="confirm-dialog"
              role="dialog"
              aria-modal="true"
              aria-label="确认重置"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button type="button" className="icon-button confirm-dialog__close" aria-label="取消" onClick={() => setConfirmOpen(false)}>
                <X size={17} />
              </button>
              <span className="confirm-dialog__icon">
                <Flame size={20} />
              </span>
              <h3>确定要重置吗？</h3>
              <p>所有学习记录都会被清空，包括连续天数。此操作无法撤销。</p>
              <div className="confirm-dialog__actions">
                <button type="button" className="button button--secondary" onClick={() => setConfirmOpen(false)}>
                  <RotateCcw size={15} />
                  取消
                </button>
                <button
                  type="button"
                  className="button button--danger"
                  onClick={() => {
                    setConfirmOpen(false)
                    resetProgress()
                  }}
                >
                  <Trash2 size={15} />
                  确认重置
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
