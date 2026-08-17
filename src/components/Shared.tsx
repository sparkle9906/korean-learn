import { motion } from 'motion/react'
import { Check, Heart, Volume2 } from 'lucide-react'
import type { MouseEvent, ReactNode } from 'react'
import { speakKorean } from '../lib/speech'

export function PlayButton({
  text,
  rate,
  label = '播放发音',
  onUnavailable,
  size = 'md',
}: {
  text: string
  rate: number
  label?: string
  onUnavailable?: (message: string) => void
  size?: 'sm' | 'md'
}) {
  const handlePlay = (event: MouseEvent) => {
    event.stopPropagation()
    const ok = speakKorean(text, rate)
    if (!ok) onUnavailable?.('当前浏览器不支持语音合成')
  }
  return (
    <motion.button
      type="button"
      className={`icon-button play-button play-button--${size}`}
      aria-label={label}
      title={label}
      onClick={handlePlay}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.08 }}
    >
      <Volume2 size={size === 'sm' ? 15 : 18} strokeWidth={2.2} />
    </motion.button>
  )
}

export function LearnedCheck({
  learned,
  onToggle,
  label,
}: {
  learned: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <motion.button
      type="button"
      className={`icon-button learned-check ${learned ? 'learned-check--on' : ''}`}
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.08 }}
    >
      <Check size={17} strokeWidth={2.6} />
    </motion.button>
  )
}

export function FavoriteButton({
  favorite,
  onToggle,
  label,
}: {
  favorite: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <motion.button
      type="button"
      className={`icon-button favorite-button ${favorite ? 'favorite-button--on' : ''}`}
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.08 }}
    >
      <Heart size={17} fill={favorite ? 'currentColor' : 'none'} strokeWidth={2.2} />
    </motion.button>
  )
}

export function ProgressRing({
  value,
  size = 72,
  label,
}: {
  value: number
  size?: number
  label?: ReactNode
}) {
  const stroke = 7
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(1, Math.max(0, value)))
  return (
    <div className="progress-ring" style={{ width: size, height: size }} aria-label={label ? undefined : `${Math.round(value * 100)}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="progress-ring__track" cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} />
        <motion.circle
          className="progress-ring__value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: 'spring', bounce: 0, duration: 0.7 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="progress-ring__label">{label ?? <strong>{Math.round(value * 100)}%</strong>}</div>
    </div>
  )
}

export function StatChip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="stat-chip">
      {icon}
      <span>{children}</span>
    </span>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="section-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p className="section-header__desc">{description}</p> : null}
      </div>
      {action ? <div className="section-header__action">{action}</div> : null}
    </div>
  )
}
