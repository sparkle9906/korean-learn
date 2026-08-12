import { motion } from 'motion/react'
import {
  BookOpen,
  ChartNoAxesColumnIncreasing,
  GraduationCap,
  Grid3X3,
  Languages,
  Laptop,
  MessageSquareText,
  Moon,
  Sun,
} from 'lucide-react'
import type { Theme, ViewId } from '../types'
import { useApp } from '../lib/AppContext'

const navItems: { id: ViewId; label: string; hint: string; icon: typeof BookOpen }[] = [
  { id: 'today', label: '今日', hint: '每天 10 分钟', icon: Sun },
  { id: 'hangul', label: '谚文', hint: '字母与拼读', icon: Grid3X3 },
  { id: 'words', label: '单词', hint: '高频词汇', icon: BookOpen },
  { id: 'phrases', label: '短语', hint: '开口就能用', icon: MessageSquareText },
  { id: 'practice', label: '练习', hint: '测验与复习', icon: GraduationCap },
  { id: 'progress', label: '进度', hint: '成长记录', icon: ChartNoAxesColumnIncreasing },
]

const appearanceOptions: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: 'system', label: '跟随系统', icon: Laptop },
  { id: 'light', label: '浅色', icon: Sun },
  { id: 'dark', label: '深色', icon: Moon },
]

export function Sidebar({
  activeView,
  onNavigate,
}: {
  activeView: ViewId
  onNavigate: (view: ViewId) => void
}) {
  const { theme, setTheme, streak, masteredWordCount, voiceRate, setVoiceRate, notify } = useApp()

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="brand-mark">
          <Languages size={20} strokeWidth={2.4} />
        </span>
        <span className="brand-copy">
          <strong>한걸음</strong>
          <small>韩语入门</small>
        </span>
      </div>

      <nav className="sidebar__nav" aria-label="主导航">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = item.id === activeView
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${active ? 'nav-item--active' : ''}`}
              aria-label={item.label}
              onClick={() => onNavigate(item.id)}
            >
              {active ? (
                <motion.span
                  className="nav-item__pill"
                  layoutId="active-nav-pill"
                  transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                />
              ) : null}
              <Icon size={19} strokeWidth={active ? 2.4 : 2} />
              <span className="nav-item__text">
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
              </span>
            </button>
          )
        })}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__streak">
          <span className="streak-flame" aria-hidden="true">
            <ChartNoAxesColumnIncreasing size={16} />
          </span>
          <div>
            <strong>{streak} 天连续学习</strong>
            <small>已学 {masteredWordCount} 个单词</small>
          </div>
        </div>

        <label className="voice-rate">
          <span>发音速度</span>
          <input
            type="range"
            min="0.6"
            max="1.3"
            step="0.05"
            value={voiceRate}
            onChange={(event) => setVoiceRate(Number(event.target.value))}
            onDoubleClick={() => {
              setVoiceRate(1)
              notify('发音速度已重置为 1.00x')
            }}
          />
          <output>{voiceRate.toFixed(2)}x</output>
        </label>

        <div className="appearance-control">
          <span className="appearance-control__label">外观</span>
          <div className="appearance-options" role="group" aria-label="外观设置">
            {appearanceOptions.map((option) => {
              const Icon = option.icon
              const selected = theme === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`appearance-option ${selected ? 'appearance-option--active' : ''}`}
                  aria-pressed={selected}
                  onClick={() => setTheme(option.id)}
                >
                  <Icon size={15} />
                  <span>{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
