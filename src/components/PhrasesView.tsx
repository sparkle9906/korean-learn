import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { MessageSquareQuote, Search } from 'lucide-react'
import { useApp } from '../lib/AppContext'
import { phraseCategories, phrases } from '../data/phrases'
import type { PhraseCategory } from '../types'
import { LearnedCheck, PlayButton, SectionHeader } from './Shared'
import { speakKorean } from '../lib/speech'

export function PhrasesView() {
  const { progress, learnedPhraseCount, togglePhraseLearned, voiceRate, notify } = useApp()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<PhraseCategory | '全部'>('全部')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return phrases.filter((phrase) => {
      const matchesCategory = category === '全部' || phrase.category === category
      const matchesQuery =
        !q ||
        phrase.ko.toLowerCase().includes(q) ||
        phrase.roman.toLowerCase().includes(q) ||
        phrase.zh.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [query, category])

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
        <div className="chip-row" role="group" aria-label="短语分类">
          {(['全部', ...phraseCategories] as const).map((item) => (
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
          <span className="count-badge count-badge--large">
            <MessageSquareQuote size={15} />
            {filtered.length} 句
          </span>
          <span>
            <strong>{learnedPhraseCount} 句已学习</strong>
            <small>整句记诵更自然</small>
          </span>
        </div>
      </section>

      <SectionHeader
        eyebrow="PHRASES"
        title={category === '全部' ? '常用短语' : `${category}短语`}
        description="点击卡片播放整句发音；标为已学习，记录每句已掌握的表达。"
      />

      {filtered.length ? (
        <div className="phrase-list">
          {filtered.map((phrase) => {
            const learned = progress.learnedPhrases.includes(phrase.id)
            return (
              <motion.article
                key={phrase.id}
                className={`phrase-card ${learned ? 'phrase-card--learned' : ''}`}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                whileHover={{ y: -2 }}
                onClick={() => {
                  const ok = speakKorean(phrase.ko, voiceRate)
                  if (!ok) notify('当前浏览器不支持语音合成')
                }}
              >
                <div className="phrase-card__content">
                  <div className="phrase-card__top">
                    <span className="category-tag">{phrase.category}</span>
                    <div className="phrase-card__actions">
                      <LearnedCheck
                        learned={learned}
                        label={learned ? '取消已学习标记' : '标为已学习'}
                        onToggle={() => togglePhraseLearned(phrase.id)}
                      />
                      <PlayButton text={phrase.ko} rate={voiceRate} size="sm" label="播放发音" onUnavailable={notify} />
                    </div>
                  </div>
                  <p className="phrase-card__ko">{phrase.ko}</p>
                  <p className="phrase-card__roman">{phrase.roman}</p>
                  <p className="phrase-card__zh">{phrase.zh}</p>
                  {phrase.note ? <p className="note">{phrase.note}</p> : null}
                </div>
              </motion.article>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={26} />
          <h3>没有找到匹配的短语</h3>
          <p>换个关键词或分类试试。</p>
        </div>
      )}
    </div>
  )
}
