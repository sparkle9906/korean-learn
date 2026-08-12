import { audioItems } from '../data/audioCatalog'

const audioByText = new Map(audioItems.map((item) => [item.text, `/${item.path}`]))

export function audioUrlFor(text: string): string | undefined {
  return audioByText.get(text)
}
