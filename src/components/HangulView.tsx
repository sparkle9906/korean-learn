import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, BookOpenText, Check, Play, Volume2 } from 'lucide-react'
import { useApp } from '../lib/AppContext'
import { composeSyllable, compoundConsonants, compoundVowels, consonants, syllableTips, vowels } from '../data/hangul'
import { pronunciationRules } from '../data/pronunciationRules'
import { speakKorean } from '../lib/speech'
import { SectionHeader } from './Shared'
import type { HangulLetter } from '../types'

type HangulTab = 'basic' | 'compound'
type HangulSection = 'letters' | 'rules'

export function HangulView() {
  const { progress, learnLetter, voiceRate, notify } = useApp()
  const [section, setSection] = useState<HangulSection>('letters')
  const [tab, setTab] = useState<HangulTab>('basic')
  const [selectedConsonant, setSelectedConsonant] = useState('ㄱ')
  const [selectedVowel, setSelectedVowel] = useState('ㅏ')

  const letters = tab === 'basic' ? { consonants, vowels } : { consonants: compoundConsonants, vowels: compoundVowels }
  const syllable = composeSyllable(selectedConsonant, selectedVowel)

  const playKorean = (text: string) => {
    const ok = speakKorean(text, voiceRate)
    if (!ok) notify('当前浏览器不支持语音合成')
  }

  const handleLetterPress = (letter: HangulLetter, kind: 'consonant' | 'vowel') => {
    if (kind === 'consonant') setSelectedConsonant(letter.char)
    else setSelectedVowel(letter.char)
    learnLetter(letter.char)
    playKorean(letter.name)
  }

  return (
    <div className="view-stack">
      <section className="hangul-section-switcher">
        <div className="hangul-section-switcher__copy">
          <span className="pill pill--blue">
            <BookOpenText size={13} />
            HANGUL LAB
          </span>
          <div>
            <h2>{section === 'letters' ? '字母与拼读' : '发音规则'}</h2>
            <p>{section === 'letters' ? '用拼合器熟悉字母，再把音节拼出来。' : '从“看到的拼写”到“自然听到的声音”，一步步建立感觉。'}</p>
          </div>
        </div>
        <div className="segmented hangul-section-switcher__tabs" role="tablist" aria-label="谚文学习内容">
          <button
            type="button"
            role="tab"
            aria-selected={section === 'letters'}
            className={section === 'letters' ? 'segmented__item segmented__item--active' : 'segmented__item'}
            onClick={() => setSection('letters')}
          >
            字母与拼读
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={section === 'rules'}
            className={section === 'rules' ? 'segmented__item segmented__item--active' : 'segmented__item'}
            onClick={() => setSection('rules')}
          >
            发音规则
          </button>
        </div>
      </section>

      {section === 'letters' ? (
        <>
          <section className="hangul-composer">
            <div className="hangul-composer__output">
              <span className="pill pill--blue">
                <Volume2 size={13} />
                拼合器
              </span>
              <motion.div
                key={syllable}
                className="syllable-output"
                initial={{ scale: 0.92, opacity: 0.4 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              >
                {syllable}
              </motion.div>
              <p>
                {selectedConsonant} + {selectedVowel} = <strong>{syllable}</strong>
              </p>
              <motion.button
                type="button"
                className="button button--primary"
                onClick={() => playKorean(syllable)}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              >
                <Play size={16} fill="currentColor" />
                听发音
              </motion.button>
            </div>

            <div className="hangul-composer__pick">
              <div className="segmented" role="tablist" aria-label="谚文字母范围">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'basic'}
                  className={tab === 'basic' ? 'segmented__item segmented__item--active' : 'segmented__item'}
                  onClick={() => setTab('basic')}
                >
                  基础字母
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'compound'}
                  className={tab === 'compound' ? 'segmented__item segmented__item--active' : 'segmented__item'}
                  onClick={() => setTab('compound')}
                >
                  双辅音与复合元音
                </button>
              </div>

              <div className="picker-block">
                <span className="picker-block__label">辅音</span>
                <div className="picker-tiles">
                  {letters.consonants.map((letter) => (
                    <button
                      key={letter.char}
                      type="button"
                      className={`picker-tile ${selectedConsonant === letter.char ? 'picker-tile--active' : ''}`}
                      onClick={() => handleLetterPress(letter, 'consonant')}
                      title={letter.name}
                    >
                      {letter.char}
                      <small>{letter.roman}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="picker-block">
                <span className="picker-block__label">元音</span>
                <div className="picker-tiles">
                  {letters.vowels.map((letter) => (
                    <button
                      key={letter.char}
                      type="button"
                      className={`picker-tile ${selectedVowel === letter.char ? 'picker-tile--active' : ''}`}
                      onClick={() => handleLetterPress(letter, 'vowel')}
                      title={letter.name}
                    >
                      {letter.char}
                      <small>{letter.roman}</small>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <SectionHeader
              eyebrow="HANGUL"
              title={tab === 'basic' ? '基础字母' : '进阶字母'}
              description={tab === 'basic' ? '14 个基础辅音和 10 个基础元音，是拼读的起点。' : '双辅音更紧促，复合元音是滑动的连续音。'}
              action={
                <span className="count-badge">
                  <Check size={14} />
                  {progress.learnedLetters.length} 已掌握
                </span>
              }
            />
            <div className="letter-groups">
              <div className="letter-group">
                <h3>辅音</h3>
                <div className="letter-grid">
                  {letters.consonants.map((letter) => {
                    const learned = progress.learnedLetters.includes(letter.char)
                    return (
                      <motion.button
                        key={letter.char}
                        type="button"
                        className={`letter-tile ${learned ? 'letter-tile--learned' : ''} ${selectedConsonant === letter.char ? 'letter-tile--selected' : ''}`}
                        onClick={() => handleLetterPress(letter, 'consonant')}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                      >
                        <span className="letter-tile__char">{letter.char}</span>
                        <span className="letter-tile__roman">{letter.roman}</span>
                        <span className="letter-tile__name">{letter.name}</span>
                        {learned ? (
                          <span className="letter-tile__check">
                            <Check size={13} strokeWidth={3} />
                          </span>
                        ) : null}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              <div className="letter-group">
                <h3>元音</h3>
                <div className="letter-grid">
                  {letters.vowels.map((letter) => {
                    const learned = progress.learnedLetters.includes(letter.char)
                    return (
                      <motion.button
                        key={letter.char}
                        type="button"
                        className={`letter-tile ${learned ? 'letter-tile--learned' : ''} ${selectedVowel === letter.char ? 'letter-tile--selected' : ''}`}
                        onClick={() => handleLetterPress(letter, 'vowel')}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                      >
                        <span className="letter-tile__char">{letter.char}</span>
                        <span className="letter-tile__roman">{letter.roman}</span>
                        <span className="letter-tile__name">{letter.name}</span>
                        {learned ? (
                          <span className="letter-tile__check">
                            <Check size={13} strokeWidth={3} />
                          </span>
                        ) : null}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="tips-panel">
            <div className="tips-panel__icon">
              <BookOpenText size={20} />
            </div>
            <div>
              <h3>拼读小贴士</h3>
              <ul>
                {syllableTips.map((tip, index) => (
                  <li key={tip}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      ) : (
        <section className="pronunciation-rules" aria-label="韩语发音规则学习">
          <div className="pronunciation-rules__intro">
            <div>
              <span className="eyebrow">LISTEN, THEN CONNECT</span>
              <h2>拼写不变，声音会在相遇时变化</h2>
              <p>先看词怎么写，再听自然读法。每个例子都可以分别听“逐音节”和“自然读”。</p>
            </div>
            <span className="pronunciation-rules__count">{pronunciationRules.length} 条核心规则</span>
          </div>

          <div className="pronunciation-rules__list">
            {pronunciationRules.map((rule, index) => (
              <motion.article
                key={rule.id}
                className="pronunciation-rule-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.035, type: 'spring', bounce: 0, duration: 0.38 }}
              >
                <header className="pronunciation-rule-card__header">
                  <div className="pronunciation-rule-card__title">
                    <span className={`pronunciation-rule-card__level pronunciation-rule-card__level--${rule.level === '先学会' ? 'starter' : 'next'}`}>
                      {rule.level}
                    </span>
                    <span className="pronunciation-rule-card__korean">{rule.koreanTitle}</span>
                    <h3>{rule.title}</h3>
                  </div>
                  <span className="pronunciation-rule-card__index">{String(index + 1).padStart(2, '0')}</span>
                </header>
                <p className="pronunciation-rule-card__summary">{rule.summary}</p>
                <p className="pronunciation-rule-card__explanation">{rule.explanation}</p>

                <div className="pronunciation-rule-card__examples">
                  {rule.examples.map((example) => (
                    <div key={example.spelling} className="pronunciation-example">
                      <div className="pronunciation-flow" aria-label={`${example.spelling} 自然读法 ${example.pronunciation}`}>
                        <div className="pronunciation-flow__word">
                          <span className="pronunciation-flow__label">拼写</span>
                          <strong>{example.spelling}</strong>
                        </div>
                        <ArrowRight className="pronunciation-flow__arrow" size={18} aria-hidden="true" />
                        <div className="pronunciation-flow__word pronunciation-flow__word--sound">
                          <span className="pronunciation-flow__label">自然听感</span>
                          <strong>[{example.pronunciation}]</strong>
                        </div>
                      </div>
                      <p>{example.explanation}</p>
                      <div className="pronunciation-example__footer">
                        <span>{example.roman}</span>
                        <div className="pronunciation-example__actions">
                          <button type="button" className="pronunciation-audio-button" onClick={() => playKorean(example.syllables)}>
                            <Volume2 size={14} />
                            逐音节
                          </button>
                          <button type="button" className="pronunciation-audio-button pronunciation-audio-button--primary" onClick={() => playKorean(example.spelling)}>
                            <Play size={14} fill="currentColor" />
                            自然读
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {rule.tip ? <p className="pronunciation-hint">小提示：{rule.tip}</p> : null}
              </motion.article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
