import { audioUrlFor } from './audioMap'

let voices: SpeechSynthesisVoice[] = []
let currentAudio: HTMLAudioElement | null = null
let lastPlayAt = 0

const playDebounceMs = 260

function refreshVoices() {
  if ('speechSynthesis' in window) {
    voices = window.speechSynthesis.getVoices()
  }
}

if (typeof window !== 'undefined') {
  refreshVoices()
  window.speechSynthesis?.addEventListener('voiceschanged', refreshVoices)
}

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function koreanVoiceCount(): number {
  return voices.filter((voice) => voice.lang.toLowerCase().startsWith('ko')).length
}

function speakWithSystem(text: string, rate: number): boolean {
  if (!speechSupported()) return false
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ko-KR'
  utterance.rate = rate
  utterance.pitch = 1
  const koreanVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith('ko'))
  if (koreanVoice) utterance.voice = koreanVoice
  window.speechSynthesis.speak(utterance)
  return true
}

function playLocalAudio(url: string, text: string, rate: number): boolean {
  if (typeof window === 'undefined') return false
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }
  const audio = new Audio(url)
  audio.preload = 'auto'
  audio.playbackRate = rate
  currentAudio = audio
  audio.play().catch(() => {
    if (currentAudio === audio) currentAudio = null
    speakWithSystem(text, rate)
  })
  return true
}

export function speakAudio(url: string, text: string, rate = 1): boolean {
  if (typeof window === 'undefined') return false
  const now = performance.now()
  if (now - lastPlayAt < playDebounceMs) return true
  lastPlayAt = now
  return playLocalAudio(url, text, rate)
}

export function speakKorean(text: string, rate = 1): boolean {
  if (typeof window === 'undefined') return false
  const now = performance.now()
  if (now - lastPlayAt < playDebounceMs) return true
  lastPlayAt = now

  const url = audioUrlFor(text)
  if (url) return playLocalAudio(url, text, rate)
  return speakWithSystem(text, rate)
}
