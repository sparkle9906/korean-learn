import { useState } from 'react'
import { motion } from 'motion/react'
import { BookOpenText, Check, Play, Volume2 } from 'lucide-react'
import { useApp } from '../lib/AppContext'
import { composeSyllable, compoundConsonants, compoundVowels, consonants, syllableTips, vowels } from '../data/hangul'
import { speakKorean } from '../lib/speech'
import { SectionHeader } from './Shared'
import type { HangulLetter } from '../types'

type HangulTab = 'basic' | 'compound'

export function HangulView() {
  const { progress, learnLetter, voiceRate, notify } = useApp()
  const [tab, setTab] = useState<HangulTab>('basic')
  const [selectedConsonant, setSelectedConsonant] = useState('ㄱ')
  const [selectedVowel, setSelectedVowel] = useState('ㅏ')

  const letters = tab === 'basic' ? { consonants, vowels } : { consonants: compoundConsonants, vowels: compoundVowels }
  const syllable = composeSyllable(selectedConsonant, selectedVowel)

  const handleLetterPress = (letter: HangulLetter, kind: 'consonant' | 'vowel') => {
    if (kind === 'consonant') setSelectedConsonant(letter.char)
    else setSelectedVowel(letter.char)
    learnLetter(letter.char)
    const ok = speakKorean(letter.name, voiceRate)
    if (!ok) notify('当前浏览器不支持语音合成')
  }

  const playSyllable = () => {
    const ok = speakKorean(syllable, voiceRate)
    if (!ok) notify('当前浏览器不支持语音合成')
  }

  return (
    <div className="view-stack">
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
            onClick={playSyllable}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
          >
            <Play size={16} fill="currentColor" />
            听发音
          </motion.button>
        </div>

        <div className="hangul-composer__pick">
          <div className="segmented" role="tablist" aria-label="谚文范围">
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
    </div>
  )
}
