import { CalendarDays, Laptop, Moon, Play, SlidersHorizontal, Sun } from 'lucide-react'
import { useState } from 'react'
import type { Theme, ViewId } from '../types'
import { formatDate, useApp } from '../lib/AppContext'

const mobileAppearanceOptions: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: 'system', label: '跟随系统', icon: Laptop },
  { id: 'light', label: '浅色模式', icon: Sun },
  { id: 'dark', label: '深色模式', icon: Moon },
]

const viewMeta: Record<ViewId, { title: string; subtitle: string }> = {
  today: { title: '今日', subtitle: '每天向前一小步' },
  hangul: { title: '谚文', subtitle: '字母、元音与拼读' },
  words: { title: '单词', subtitle: '从高频词开始' },
  phrases: { title: '短语', subtitle: '整句记忆，开口更自然' },
  practice: { title: '练习', subtitle: '及时反馈，巩固记忆' },
  progress: { title: '进度', subtitle: '看见每天的积累' },
}

export function TopBar({
  activeView,
  onNavigate,
  canScrollToTop = false,
  onScrollToTop,
}: {
  activeView: ViewId
  onNavigate: (view: ViewId) => void
  canScrollToTop?: boolean
  onScrollToTop?: () => void
}) {
  const { streak, theme, setTheme, todayPoints, voiceRate, setVoiceRate, notify } = useApp()
  const [mobileSpeedOpen, setMobileSpeedOpen] = useState(false)
  const meta = viewMeta[activeView]

  return (
    <header className="topbar">
      <div className="topbar__title">
        <h1>{meta.title}</h1>
        <p>{meta.subtitle}</p>
      </div>
      {canScrollToTop && onScrollToTop ? (
        <button
          type="button"
          className="topbar__scroll-top-zone"
          aria-label="回到页面顶部"
          onClick={onScrollToTop}
        />
      ) : null}
      <div className="topbar__meta">
        <div className="topbar__appearance" role="group" aria-label="外观设置">
          {mobileAppearanceOptions.map((option) => {
            const Icon = option.icon
            const selected = theme === option.id
            return (
              <button
                key={option.id}
                type="button"
                className={`topbar__appearance-option ${selected ? 'topbar__appearance-option--active' : ''}`}
                aria-label={option.label}
                aria-pressed={selected}
                title={option.label}
                onClick={() => setTheme(option.id)}
              >
                <Icon size={16} />
              </button>
            )
          })}
        </div>
        <div className="topbar__speed">
          <button
            type="button"
            className={`topbar__speed-toggle ${mobileSpeedOpen ? 'topbar__speed-toggle--active' : ''}`}
            aria-label="调节发音速度"
            aria-expanded={mobileSpeedOpen}
            title="发音速度"
            onClick={() => setMobileSpeedOpen((open) => !open)}
          >
            <SlidersHorizontal size={17} />
          </button>
          {mobileSpeedOpen ? (
            <label className="topbar__speed-popover">
              <span>发音速度</span>
              <input
                type="range"
                min="0.6"
                max="1.25"
                step="0.05"
                value={voiceRate}
                aria-label="发音速度"
                onChange={(event) => setVoiceRate(Number(event.target.value))}
                onDoubleClick={() => {
                  setVoiceRate(1)
                  notify('发音速度已重置为 1.00x')
                }}
              />
              <output>{voiceRate.toFixed(2)}x</output>
            </label>
          ) : null}
        </div>
        <span className="topbar__date">
          <CalendarDays size={15} />
          {formatDate()}
        </span>
        <span className="topbar__points">
          <strong>{todayPoints}</strong> 今日点数
        </span>
        <span className="topbar__streak">
          <strong>{streak}</strong> 天连续
        </span>
        {activeView !== 'practice' ? (
          <button type="button" className="button button--primary topbar__cta" onClick={() => onNavigate('practice')}>
            <Play size={15} fill="currentColor" />
            开始练习
          </button>
        ) : null}
      </div>
    </header>
  )
}
