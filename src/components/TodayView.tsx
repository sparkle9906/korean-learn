import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  Grid3X3,
  MessagesSquare,
  Repeat2,
  Sparkles,
  Volume2,
} from 'lucide-react'
import type { ViewId } from '../types'
import { dayOfYear, useApp } from '../lib/AppContext'
import { compoundConsonants, compoundVowels, consonants, vowels } from '../data/hangul'
import { words } from '../data/words'
import { phrases } from '../data/phrases'
import { speakKorean } from '../lib/speech'
import { PlayButton, ProgressRing, SectionHeader, StatChip } from './Shared'

const letterCount = consonants.length + vowels.length + compoundConsonants.length + compoundVowels.length

function prioritizeUnlearned<T extends { id: string }>(
  items: readonly T[],
  startIndex: number,
  count: number,
  isLearned: (item: T) => boolean,
): T[] {
  if (items.length === 0 || count <= 0) return []

  const start = ((startIndex % items.length) + items.length) % items.length
  const ordered = Array.from({ length: items.length }, (_, offset) => items[(start + offset) % items.length])
  const unlearned = ordered.filter((item) => !isLearned(item))
  const learned = ordered.filter(isLearned)

  return [...unlearned, ...learned].slice(0, Math.min(count, items.length))
}

export function TodayView({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const {
    progress,
    toggleWordLearned,
    togglePhraseLearned,
    dueWords,
    streak,
    todayPoints,
    masteredWordCount,
    storageReady,
    todayKey,
    setDailyPlan,
    learnedPhraseCount,
    voiceRate,
    notify,
  } = useApp()

  const day = dayOfYear()
  const dailyPlan = progress.dailyPlans[todayKey]
  // Generate a plan once per date. Persisting it prevents today's card from
  // switching to another unlearned item after the current one is marked learned.
  const generatedWords = useMemo(
    () => prioritizeUnlearned(words, day, 5, (word) => Boolean(progress.learnedWords[word.id])),
    [day, storageReady],
  )
  const generatedPhrase = useMemo(
    () =>
      prioritizeUnlearned(phrases, day, 1, (phrase) => progress.learnedPhrases.includes(phrase.id))[0] ??
      phrases[day % phrases.length],
    [day, storageReady],
  )
  const todayWords = useMemo(() => {
    if (!dailyPlan) return generatedWords
    const plannedWords = dailyPlan.wordIds
      .map((id) => words.find((word) => word.id === id))
      .filter((word): word is (typeof words)[number] => Boolean(word))
    return plannedWords.length > 0 ? plannedWords : generatedWords
  }, [dailyPlan, generatedWords])
  const wordOfDay = todayWords[0] ?? words[day % words.length]
  const phraseOfDay = useMemo(() => {
    if (!dailyPlan?.phraseId) return generatedPhrase
    return phrases.find((phrase) => phrase.id === dailyPlan.phraseId) ?? generatedPhrase
  }, [dailyPlan, generatedPhrase])

  useEffect(() => {
    if (!storageReady || dailyPlan) return
    setDailyPlan(todayKey, {
      wordIds: generatedWords.map((word) => word.id),
      phraseId: generatedPhrase.id,
    })
  }, [dailyPlan, generatedPhrase, generatedWords, setDailyPlan, storageReady, todayKey])
  const [wordIndex, setWordIndex] = useState(0)
  const todayWord = todayWords[Math.min(wordIndex, todayWords.length - 1)]
  const playTodayWord = () => {
    const ok = speakKorean(todayWord.ko, voiceRate)
    if (!ok) notify('当前浏览器不支持语音合成')
  }
  const showPrevWord = () => setWordIndex((index) => (index - 1 + todayWords.length) % todayWords.length)
  const showNextWord = () => setWordIndex((index) => (index + 1) % todayWords.length)

  const totalAnswered = Object.values(progress.history).reduce((sum, item) => sum + item.total, 0)
  const totalCorrect = Object.values(progress.history).reduce((sum, item) => sum + item.correct, 0)
  const accuracy = totalAnswered ? totalCorrect / totalAnswered : 0
  const totalSessions = Object.values(progress.history).reduce((sum, item) => sum + item.sessions, 0)
  const learnedToday = todayWords.filter((word) => progress.learnedWords[word.id]).length
  const phraseLearned = progress.learnedPhrases.includes(phraseOfDay.id)
  const playPhraseOfDay = () => {
    const ok = speakKorean(phraseOfDay.ko, voiceRate)
    if (!ok) notify('当前浏览器不支持语音合成')
  }

  return (
    <div className="view-stack">
      <section className="today-hero">
        <span className="today-hero__watermark" aria-hidden="true">
          {wordOfDay.ko}
        </span>
        <div className="today-hero__topline">
          <span className="pill pill--brand">
            <Sparkles size={14} />
            今日单词
          </span>
          <span className="today-hero__greeting">保持节奏，慢慢来</span>
        </div>
        <div className="today-hero__body">
          <div className="today-hero__word">
            <span className="hangul-display">{wordOfDay.ko}</span>
            <div className="today-hero__meta">
              <p className="roman">{wordOfDay.roman}</p>
              <p className="meaning">{wordOfDay.zh}</p>
              {wordOfDay.note ? <p className="note">{wordOfDay.note}</p> : null}
            </div>
          </div>
          <div className="today-hero__actions">
            <PlayButton text={wordOfDay.ko} rate={voiceRate} label="播放今日单词" onUnavailable={notify} />
            <button
              type="button"
              className={`button ${progress.learnedWords[wordOfDay.id] ? 'button--success' : 'button--primary'}`}
              onClick={() => toggleWordLearned(wordOfDay.id)}
            >
              <CheckCircle2 size={16} />
              {progress.learnedWords[wordOfDay.id] ? '已学会' : '标为已学'}
            </button>
          </div>
        </div>
        <div className="today-hero__stats">
          <StatChip icon={<Clock3 size={15} />}>{todayPoints} 今日点数</StatChip>
          <StatChip icon={<Repeat2 size={15} />}>{streak} 天连续</StatChip>
          <StatChip icon={<BookOpenCheck size={15} />}>{masteredWordCount} 已学单词</StatChip>
          <StatChip icon={<MessagesSquare size={15} />}>{learnedPhraseCount} 已学短语</StatChip>
        </div>
      </section>

      <SectionHeader eyebrow="TODAY PLAN" title="今天的三个小目标" description="每次只做一点点，累积起来就很多。" />
      <div className="task-grid">
        <motion.article
          className="task-card"
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        >
          <div className="task-card__icon task-card__icon--blue">
            <Grid3X3 size={20} />
          </div>
          <div className="task-card__body">
            <span className="task-card__kicker">第 1 步</span>
            <h3>认识谚文</h3>
            <p>已认识 {progress.learnedLetters.length} / {letterCount} 个谚文音</p>
            <ProgressRing value={progress.learnedLetters.length / letterCount} size={58} label={<strong>{progress.learnedLetters.length}</strong>} />
          </div>
          <button type="button" className="text-button" onClick={() => onNavigate('hangul')}>
            去拼读 <ArrowRight size={15} />
          </button>
        </motion.article>

        <motion.article
          className="task-card"
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        >
          <div className="task-card__icon task-card__icon--coral">
            <BookOpenCheck size={20} />
          </div>
          <div className="task-card__body">
            <span className="task-card__kicker">第 2 步</span>
            <h3>学习 5 个单词</h3>
            <div className="word-carousel">
              <button type="button" className="word-carousel__arrow" aria-label="上一个单词" onClick={showPrevWord}>
                <ChevronLeft size={18} />
              </button>
              <button type="button" className="word-carousel__stage" title="点击播放发音" onClick={playTodayWord}>
                <motion.div
                  key={todayWord.id}
                  className="word-carousel__stage-inner"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                >
                  <span className="word-carousel__hangul">{todayWord.ko}</span>
                  <span className="word-carousel__roman">{todayWord.roman}</span>
                  <span className="word-carousel__meaning">{todayWord.zh}</span>
                  <Volume2 size={14} className="word-carousel__speaker" aria-hidden="true" />
                </motion.div>
              </button>
              <button type="button" className="word-carousel__arrow" aria-label="下一个单词" onClick={showNextWord}>
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="word-carousel__chips">
              {todayWords.map((word, index) => (
                <button
                  key={word.id}
                  type="button"
                  className={`mini-chip mini-chip--button ${index === wordIndex ? 'mini-chip--active' : ''} ${progress.learnedWords[word.id] ? 'mini-chip--done' : ''}`}
                  title={word.roman}
                  aria-label={`切换到 ${word.ko}（${word.roman}）`}
                  aria-current={index === wordIndex ? 'true' : undefined}
                  onClick={() => setWordIndex(index)}
                >
                  {word.ko}
                </button>
              ))}
            </div>
            <div className="word-carousel__footer">
              <button
                type="button"
                className={`button button--sm ${progress.learnedWords[todayWord.id] ? 'button--success' : 'button--secondary'}`}
                onClick={() => toggleWordLearned(todayWord.id)}
              >
                <CheckCircle2 size={14} />
                {progress.learnedWords[todayWord.id] ? '已学会' : '标为已学'}
              </button>
              <p className="word-carousel__count">{learnedToday} / 5 已完成</p>
            </div>
          </div>
          <button type="button" className="text-button" onClick={() => onNavigate('words')}>
            更多单词 <ArrowRight size={15} />
          </button>
        </motion.article>

        <motion.article
          className="task-card task-card--phrase"
          role="button"
          tabIndex={0}
          aria-label={`播放今日短语：${phraseOfDay.ko}`}
          onClick={playPhraseOfDay}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              playPhraseOfDay()
            }
          }}
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        >
          <div className="task-card__icon task-card__icon--green">
            <MessagesSquare size={20} />
          </div>
          <div className="task-card__body">
            <span className="task-card__kicker">第 3 步</span>
            <h3>记住一句话</h3>
            <p className="task-card__phrase">{phraseOfDay.ko}</p>
            <p className="note">{phraseOfDay.zh}</p>
          </div>
          <div className="task-card__actions">
            <PlayButton text={phraseOfDay.ko} rate={voiceRate} size="sm" label="播放今日短语" onUnavailable={notify} />
            <button
              type="button"
              className={`button button--sm ${phraseLearned ? 'button--success' : 'button--secondary'}`}
              onClick={(event) => {
                event.stopPropagation()
                togglePhraseLearned(phraseOfDay.id)
              }}
            >
              <CheckCircle2 size={14} />
              {phraseLearned ? '已学会' : '标为已学'}
            </button>
            <button
              type="button"
              className="text-button"
              onClick={(event) => {
                event.stopPropagation()
                onNavigate('phrases')
              }}
            >
              更多短语 <ArrowRight size={15} />
            </button>
          </div>
        </motion.article>
      </div>

      <section className="review-strip">
        <div className="review-strip__icon">
          <Repeat2 size={22} />
        </div>
        <div className="review-strip__body">
          <span className="eyebrow">REVIEW</span>
          <h3>{dueWords.length ? `有 ${dueWords.length} 个已学单词待复习` : '今天没有到期复习，试试新练习'}</h3>
          <p>{accuracy ? `最近正确率 ${Math.round(accuracy * 100)}%，已完成 ${totalSessions} 组练习` : '完成第一组练习，看看你的准确率'}</p>
        </div>
        <button type="button" className="button button--secondary" onClick={() => onNavigate('practice')}>
          <CircleDot size={16} />
          {dueWords.length ? '开始复习' : '随机测验'}
        </button>
      </section>

      <SectionHeader eyebrow="SNAPSHOT" title="你的学习快照" />
      <div className="stat-grid">
        <div className="stat-tile">
          <span className="stat-tile__value">{masteredWordCount}</span>
          <span className="stat-tile__label">已学单词</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__value">{learnedPhraseCount}</span>
          <span className="stat-tile__label">已学短语</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__value">{totalSessions}</span>
          <span className="stat-tile__label">完成练习</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__value">{Math.round(accuracy * 100)}%</span>
          <span className="stat-tile__label">平均正确率</span>
        </div>
      </div>
    </div>
  )
}
