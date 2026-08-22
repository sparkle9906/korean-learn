export type PronunciationRuleId =
  | 'batchim'
  | 'liaison'
  | 'nasalization'
  | 'liquidization'
  | 'tensing'
  | 'h-assimilation'

export type PronunciationExample = {
  spelling: string
  syllables: string
  pronunciation: string
  roman: string
  explanation: string
}

export type PronunciationRule = {
  id: PronunciationRuleId
  level: '先学会' | '继续练'
  title: string
  koreanTitle: string
  summary: string
  explanation: string
  examples: PronunciationExample[]
  tip?: string
}

export const pronunciationRules: PronunciationRule[] = [
  {
    id: 'batchim',
    level: '先学会',
    title: '收音：音节末尾要收住',
    koreanTitle: '받침',
    summary: '辅音落在音节最后时叫“收音”。它常常会收住，不会像开头的辅音那样完整放出来。',
    explanation: '先辨认每个方块最下方的字母；例如 ㅅ 放在词尾时，通常按 [ㄷ] 的收音来处理。',
    examples: [
      {
        spelling: '옷',
        syllables: '옷',
        pronunciation: '옫',
        roman: 'ot',
        explanation: '词尾的 ㅅ 作为收音时，按 [ㄷ] 类的短促收音处理。',
      },
      {
        spelling: '책',
        syllables: '책',
        pronunciation: '책',
        roman: 'chaek',
        explanation: '末尾的 ㄱ 收住即可，不要在后面额外加一个“格”。',
      },
    ],
    tip: '方括号里的内容是更接近实际听感的提示，不是要用中文拼音替代韩语发音。',
  },
  {
    id: 'liaison',
    level: '先学会',
    title: '连音：收音遇到元音会往后连',
    koreanTitle: '연음',
    summary: '前一个音节有收音、后一个音节以元音开头时，收音常会连到后一个音节。',
    explanation: '看清词中间有没有“收音 + ㅇ（元音开头）”的组合；这时不要在中间停顿。',
    examples: [
      {
        spelling: '한국어',
        syllables: '한 국 어',
        pronunciation: '한구거',
        roman: 'hangugeo',
        explanation: '국 的收音 ㄱ 连到 어 的开头，听起来更像“한구거”。',
      },
      {
        spelling: '책이',
        syllables: '책 이',
        pronunciation: '채기',
        roman: 'chaegi',
        explanation: '책 的收音 ㄱ 连到 이 的开头。',
      },
      {
        spelling: '옷을',
        syllables: '옷 을',
        pronunciation: '오슬',
        roman: 'oseul',
        explanation: '옷 的收音 ㅅ 连到 을 的开头，听感会变得连续。',
      },
    ],
    tip: '先慢读两个音节，再把中间的停顿拿掉；自然读法会更顺。',
  },
  {
    id: 'nasalization',
    level: '继续练',
    title: '鼻音化：遇到 ㄴ、ㅁ 会变顺口',
    koreanTitle: '비음화',
    summary: '某些收音后面接 ㄴ 或 ㅁ 时，会为了顺口而向鼻音靠拢。',
    explanation: '听到 ㄴ、ㅁ 前面的辅音变得像“ng / m / n”时，不是你听错了，而是自然的同化。',
    examples: [
      {
        spelling: '국물',
        syllables: '국 물',
        pronunciation: '궁물',
        roman: 'gungmul',
        explanation: '국 的收音 ㄱ 遇到 ㅁ，会鼻音化，听起来接近“궁물”。',
      },
    ],
  },
  {
    id: 'liquidization',
    level: '继续练',
    title: '流音化：ㄴ 和 ㄹ 会靠近',
    koreanTitle: '유음화',
    summary: 'ㄴ 和 ㄹ 相邻时，常会读得更接近两个 ㄹ 的连续音。',
    explanation: '这类变化主要发生在词中间；跟读时让舌尖的动作连起来，不要把 ㄴ、ㄹ 分得太开。',
    examples: [
      {
        spelling: '신라',
        syllables: '신 라',
        pronunciation: '실라',
        roman: 'silla',
        explanation: 'ㄴ 后面接 ㄹ，发音会流畅地靠近“실라”。',
      },
    ],
  },
  {
    id: 'tensing',
    level: '继续练',
    title: '紧音化：前面的收音让后音更紧',
    koreanTitle: '된소리되기',
    summary: '某些收音后面的平音会变得更紧、更有力，听起来像双辅音。',
    explanation: '不要靠拉长音量模仿；重点是后一个辅音起音更紧、更干脆。',
    examples: [
      {
        spelling: '학교',
        syllables: '학 교',
        pronunciation: '학꾜',
        roman: 'hakgyo',
        explanation: 'ㄱ 收音后面的 ㄱ 会紧音化，因此听起来接近“학꾜”。',
      },
    ],
  },
  {
    id: 'h-assimilation',
    level: '继续练',
    title: 'ㅎ：有时弱化，有时影响旁边的音',
    koreanTitle: 'ㅎ 탈락 · 거센소리',
    summary: 'ㅎ 在组合中常不按单独的“h”出现；它可能弱化，也可能让旁边辅音更送气。',
    explanation: '遇到 ㅎ 不要机械地逐字母读。先听自然读法，再回看它对相邻音节造成的变化。',
    examples: [
      {
        spelling: '좋다',
        syllables: '좋 다',
        pronunciation: '조타',
        roman: 'jota',
        explanation: 'ㅎ 的影响让后面的 ㄷ 变得更送气，整体听起来接近“조타”。',
      },
      {
        spelling: '많이',
        syllables: '많 이',
        pronunciation: '마니',
        roman: 'mani',
        explanation: 'ㅎ 在这里弱化，常听成更顺的“마니”。',
      },
    ],
  },
]

export type WordPronunciationHint = {
  ruleId: PronunciationRuleId
  label: string
  pronunciation: string
}

export const wordPronunciationHints: Record<string, WordPronunciationHint> = {
  w50: { ruleId: 'tensing', label: '紧音化', pronunciation: '학꾜' },
  w134: { ruleId: 'liaison', label: '连音', pronunciation: '한구거' },
  w291: { ruleId: 'liaison', label: '连音', pronunciation: '오슬 입따' },
  w375: { ruleId: 'h-assimilation', label: 'ㅎ 的影响', pronunciation: '조타' },
  w385: { ruleId: 'h-assimilation', label: 'ㅎ 的弱化', pronunciation: '마니' },
}
