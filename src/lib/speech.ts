import { audioUrlFor } from './audioMap'

let voices: SpeechSynthesisVoice[] = []
let localAudioFiles: Set<string> | null = null
let currentAudio: HTMLAudioElement | null = null

function refreshVoices() {
  if ('speechSynthesis' in window) {
    voices = window.speechSynthesis.getVoices()
  }
}

if (typeof window !== 'undefined') {
  refreshVoices()
  window.speechSynthesis?.addEventListener('voiceschanged', refreshVoices)
  fetch('/audio/manifest.json')
    .then((response) => (response.ok ? response.json() : null))
    .then((manifest: { files?: string[] } | null) => {
      localAudioFiles = new Set(manifest?.files ?? [])
    })
    .catch(() => {
      localAudioFiles = new Set()
    })
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
  audio.playbackRate = rate
  currentAudio = audio
  audio.play().catch(() => {
    if (currentAudio === audio) currentAudio = null
    speakWithSystem(text, rate)
  })
  return true
}

export function speakKorean(text: string, rate = 1): boolean {
  if (typeof window === 'undefined') return false
  const url = audioUrlFor(text)
  if (localAudioFiles && url && localAudioFiles.has(url.slice(1))) {
    return playLocalAudio(url, text, rate)
  }
  return speakWithSystem(text, rate)
}
