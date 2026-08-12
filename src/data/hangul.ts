import type { HangulLetter } from '../types'

export const consonants: HangulLetter[] = [
  { char: 'ㄱ', roman: 'g/k', name: '기역', tip: '舌根轻触上颚，像“歌”的开头声。' },
  { char: 'ㄴ', roman: 'n', name: '니은', tip: '舌尖抵住上齿龈，鼻音轻而短。' },
  { char: 'ㄷ', roman: 'd/t', name: '디귿', tip: '舌尖碰齿龈后迅速弹开，介于 d 与 t。' },
  { char: 'ㄹ', roman: 'r/l', name: '리을', tip: '舌尖轻弹上齿龈，像英语 light 的闪音。' },
  { char: 'ㅁ', roman: 'm', name: '미음', tip: '双唇合拢送鼻音，和 m 几乎一样。' },
  { char: 'ㅂ', roman: 'b/p', name: '비읍', tip: '双唇轻闭后打开，介于 b 与 p。' },
  { char: 'ㅅ', roman: 's', name: '시옷', tip: '舌面靠近上颚，气流从窄缝挤出。' },
  { char: 'ㅇ', roman: 'ng/-', name: '이응', tip: '作声母时不发音，作韵尾时发 ng。' },
  { char: 'ㅈ', roman: 'j', name: '지읒', tip: '像中文“知”的声母，但更轻。' },
  { char: 'ㅊ', roman: 'ch', name: '치읓', tip: '送气比 ㅈ 更强，像“吃”。' },
  { char: 'ㅋ', roman: 'k', name: '키읔', tip: '强送气，像咳嗽时发出的 k。' },
  { char: 'ㅌ', roman: 't', name: '티읕', tip: '强送气 t，舌尖顶得更用力。' },
  { char: 'ㅍ', roman: 'p', name: '피읖', tip: '强送气 p，双唇开得更干脆。' },
  { char: 'ㅎ', roman: 'h', name: '히읗', tip: '喉部轻送气，和 h 接近。' },
]

export const vowels: HangulLetter[] = [
  { char: 'ㅏ', roman: 'a', name: '아', tip: '嘴自然张开，像“啊”。' },
  { char: 'ㅑ', roman: 'ya', name: '야', tip: '先轻发 y，再滑到 ㅏ。' },
  { char: 'ㅓ', roman: 'eo', name: '어', tip: '嘴微张、舌头略后缩，类似“哦”但更短。' },
  { char: 'ㅕ', roman: 'yeo', name: '여', tip: '先轻发 y，再滑到 ㅓ。' },
  { char: 'ㅗ', roman: 'o', name: '오', tip: '双唇收圆，像“哦”。' },
  { char: 'ㅛ', roman: 'yo', name: '요', tip: '先轻发 y，再滑到 ㅗ。' },
  { char: 'ㅜ', roman: 'u', name: '우', tip: '双唇更收拢，像“呜”。' },
  { char: 'ㅠ', roman: 'yu', name: '유', tip: '先轻发 y，再滑到 ㅜ。' },
  { char: 'ㅡ', roman: 'eu', name: '으', tip: '嘴唇向两侧微展，舌尖放平，中文没有这个音。' },
  { char: 'ㅣ', roman: 'i', name: '이', tip: '嘴角向两侧拉开，像“衣”。' },
]

export const compoundConsonants: HangulLetter[] = [
  { char: 'ㄲ', roman: 'kk', name: '쌍기역', tip: 'ㄱ 的紧音，喉部收紧、更短促。' },
  { char: 'ㄸ', roman: 'tt', name: '쌍디귿', tip: 'ㄷ 的紧音，发音更有力。' },
  { char: 'ㅃ', roman: 'pp', name: '쌍비읍', tip: 'ㅂ 的紧音，双唇绷紧。' },
  { char: 'ㅆ', roman: 'ss', name: '쌍시옷', tip: 'ㅅ 的紧音，气流更紧。' },
  { char: 'ㅉ', roman: 'jj', name: '쌍지읒', tip: 'ㅈ 的紧音，短促有力。' },
]

export const compoundVowels: HangulLetter[] = [
  { char: 'ㅐ', roman: 'ae', name: '애', tip: '嘴巴张得比 ㅔ 大，介于 a 与 e。' },
  { char: 'ㅒ', roman: 'yae', name: '얘', tip: '先发 y，再滑到 ㅐ。' },
  { char: 'ㅔ', roman: 'e', name: '에', tip: '嘴角微展，类似英语 bed 的 e。' },
  { char: 'ㅖ', roman: 'ye', name: '예', tip: '先发 y，再滑到 ㅔ。' },
  { char: 'ㅘ', roman: 'wa', name: '와', tip: 'ㅗ 和 ㅏ 快速连读。' },
  { char: 'ㅙ', roman: 'wae', name: '왜', tip: 'ㅗ 和 ㅐ 快速连读。' },
  { char: 'ㅚ', roman: 'oe', name: '외', tip: '嘴唇收圆后快速展开。' },
  { char: 'ㅝ', roman: 'wo', name: '워', tip: 'ㅜ 和 ㅓ 快速连读。' },
  { char: 'ㅞ', roman: 'we', name: '웨', tip: 'ㅜ 和 ㅔ 快速连读。' },
  { char: 'ㅟ', roman: 'wi', name: '위', tip: 'ㅜ 和 ㅣ 快速连读。' },
  { char: 'ㅢ', roman: 'ui', name: '의', tip: '先发 ㅡ，再快速滑到 ㅣ。' },
]

export const initialOrder = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
]

export const medialOrder = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ',
]

const initialIndex = new Map(initialOrder.map((char, index) => [char, index]))
const medialIndex = new Map(medialOrder.map((char, index) => [char, index]))

export function composeSyllable(initial: string, medial: string): string {
  const i = initialIndex.get(initial)
  const m = medialIndex.get(medial)
  if (i === undefined || m === undefined) return `${initial}${medial}`
  return String.fromCharCode(0xac00 + (i * 21 + m) * 28)
}

export const syllableTips = [
  '韩文按“声母 + 元音”拼写成一个方块字，例如 ㄱ + ㅏ = 가。',
  'ㅇ 放在开头时不发音，它只是占位；放在音节末尾时发 ng。',
  '先记 14 个基础辅音和 10 个基础元音，就能拼出大部分日常音节。',
  '复合元音不是两个音孤立相加，而是快速滑过，像 wa、wo。',
]
