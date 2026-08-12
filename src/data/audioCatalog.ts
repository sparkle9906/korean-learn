import type { HangulLetter } from '../types'
import {
  composeSyllable,
  compoundConsonants,
  compoundVowels,
  consonants,
  initialOrder,
  medialOrder,
  vowels,
} from './hangul'
import { phrases } from './phrases'
import { words } from './words'

export type AudioItem = {
  id: string
  text: string
  path: string
}

const letterGroups: Array<{ prefix: string; items: HangulLetter[] }> = [
  { prefix: 'c', items: consonants },
  { prefix: 'v', items: vowels },
  { prefix: 'cc', items: compoundConsonants },
  { prefix: 'cv', items: compoundVowels },
]

const letterItems: AudioItem[] = letterGroups.flatMap((group) =>
  group.items.map((letter, index) => {
    const number = String(index + 1).padStart(2, '0')
    return {
      id: `letter-${group.prefix}-${number}`,
      text: letter.name,
      path: `audio/letters/${group.prefix}${number}.mp3`,
    }
  }),
)

const syllableItems: AudioItem[] = initialOrder.flatMap((initial) =>
  medialOrder.map((medial) => {
    const syllable = composeSyllable(initial, medial)
    const hex = String(syllable.codePointAt(0)!.toString(16)).padStart(4, '0')
    return {
      id: `syllable-${hex}`,
      text: syllable,
      path: `audio/syllables/${hex}.mp3`,
    }
  }),
)

export const audioItems: AudioItem[] = [
  ...words.map((word) => ({
    id: `word-${word.id}`,
    text: word.ko,
    path: `audio/words/${word.id}.mp3`,
  })),
  ...phrases.map((phrase) => ({
    id: `phrase-${phrase.id}`,
    text: phrase.ko,
    path: `audio/phrases/${phrase.id}.mp3`,
  })),
  ...letterItems,
  ...syllableItems,
]
