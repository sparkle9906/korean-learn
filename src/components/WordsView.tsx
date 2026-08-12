import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { BookMarked, Search } from 'lucide-react'
import { useApp } from '../lib/AppContext'
import { wordCategories, words } from '../data/words'
import type { WordCategory } from '../types'
import { LearnedCheck, PlayButton, ProgressRing, SectionHeader } from './Shared'
import { speakKorean } from '../lib/speech'

export function WordsView() {
  const { progress, toggleWordLearned, voiceRate, notify } = useApp()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<WordCategory | '全部'>('全部')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return words.filter((word) => {
      const matchesCategory = category === '全部' || word.category === category
      const matchesQuery =
        !q ||
        word.ko.toLowerCase().includes(q) ||
        word.roman.toLowerCase().includes(q) ||
        word.zh.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [query, category])

  const mastered = words.filter((word) => progress.learnedWords[word.id]).length

  return (
    <div className="view-stack">
      <section className="browse-toolbar">
        <label className="search-field">
          <Search size={17} />
          <input
            type="search"
            placeholder="搜韩语、罗马音或中文"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="chip-row" role="group" aria-label="单词分类">
          {(['全部', ...wordCategories] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={`chip ${category === item ? 'chip--active' : ''}`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="browse-toolbar__summary">
          <ProgressRing value={mastered / words.length} size={48} label={<strong>{mastered}</strong>} />
          <span>
            <strong>{words.length} 个核心词</strong>
            <small>已掌握 {mastered} 个</small>
          </span>
        </div>
      </section>

      <SectionHeader
        eyebrow="VOCABULARY"
        title={category === '全部' ? '全部单词' : `${category}单词`}
        description="点击卡片播放发音，勾选表示你已经掌握。"
        action={
          <span className="count-badge">
            <BookMarked size={14} />
            {filtered.length} 个词
          </span>
        }
      />

      {filtered.length ? (
        <div className="word-grid">
          {filtered.map((word) => {
            const learned = Boolean(progress.learnedWords[word.id])
            return (
              <motion.article
                key={word.id}
                className={`word-card ${learned ? 'word-card--learned' : ''}`}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                whileHover={{ y: -2 }}
                onClick={() => {
                  const ok = speakKorean(word.ko, voiceRate)
                  if (!ok) notify('当前浏览器不支持语音合成')
                }}
              >
                <div className="word-card__top">
                  <span className="category-tag">{word.category}</span>
                  <div className="word-card__actions">
                    <LearnedCheck
                      learned={learned}
                      label={learned ? '取消掌握' : '标记为已学'}
                      onToggle={() => toggleWordLearned(word.id)}
                    />
                    <PlayButton
                      text={word.ko}
                      rate={voiceRate}
                      size="sm"
                      label="播放发音"
                      onUnavailable={notify}
                    />
                  </div>
                </div>
                <div className="word-card__main">
                  <span className="word-card__hangul">{word.ko}</span>
                  <span className="word-card__roman">{word.roman}</span>
                  <span className="word-card__meaning">{word.zh}</span>
                  {word.note ? <span className="note">{word.note}</span> : null}
                </div>
              </motion.article>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={26} />
          <h3>没有找到匹配的单词</h3>
          <p>换个关键词或分类试试。</p>
        </div>
      )}
    </div>
  )
}
