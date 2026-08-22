import { audioItems } from '../data/audioCatalog'

const audioByText = new Map(audioItems.map((item) => [item.text, `/${item.path}`]))
const audioById = new Map(audioItems.map((item) => [item.id, `/${item.path}`]))

export function audioUrlFor(text: string): string | undefined {
  return audioByText.get(text)
}

export function audioUrlForId(id: string): string | undefined {
  return audioById.get(id)
}
