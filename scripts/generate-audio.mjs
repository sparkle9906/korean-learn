import { build } from 'esbuild'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputRoot = path.join(rootDir, 'public')
const apiUrl = 'https://api.fish.audio/v1/tts'

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

function argValue(name) {
  const prefix = `${name}=`
  return process.argv.slice(2).find((arg) => arg.startsWith(prefix))?.slice(prefix.length)
}

async function loadDotEnv() {
  const text = await readFile(path.join(rootDir, '.env.local'), 'utf8')
  const env = {}
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const index = line.indexOf('=')
    if (index === -1) continue
    const key = line.slice(0, index).trim()
    let value = line.slice(index + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

async function main() {
  const env = await loadDotEnv()
  const apiKey = env.FISH_API_KEY || process.env.FISH_API_KEY
  const referenceId = env.FISH_REFERENCE_ID || process.env.FISH_REFERENCE_ID || '58d18592ae344ce2a9844af90a2505a3'
  const model = env.FISH_MODEL || process.env.FISH_MODEL || 's2.1-pro-free'
  if (!apiKey) {
    console.error('Missing FISH_API_KEY in .env.local')
    process.exit(1)
  }

  const scope = argValue('--scope') ?? 'all'
  const limit = Number(argValue('--limit') ?? '0') || Infinity
  const concurrency = Math.max(1, Number(argValue('--concurrency') ?? '1') || 1)
  const force = process.argv.includes('--force')
  const dryRun = process.argv.includes('--dry-run')

  const catalogFile = path.join(rootDir, '.tmp-audio-catalog.mjs')
  await build({
    entryPoints: [path.join(rootDir, 'src/data/audioCatalog.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: catalogFile,
    logLevel: 'silent',
  })
  const { audioItems } = await import(pathToFileURL(catalogFile).href)
  await rm(catalogFile, { force: true })

  let items = audioItems
  if (scope !== 'all') items = items.filter((item) => item.path.startsWith(`audio/${scope}/`))
  if (Number.isFinite(limit)) items = items.slice(0, limit)

  if (dryRun) {
    console.log(`Dry run: ${items.length} audio items (scope: ${scope})`)
    for (const item of items.slice(0, 5)) console.log(`  ${item.id} -> ${item.path}`)
    if (items.length > 5) console.log(`  ...and ${items.length - 5} more`)
    return
  }

  let cursor = 0
  let generated = 0
  let skipped = 0
  let stopping = false
  const failures = []

  async function generateOne(item) {
    const outputPath = path.join(outputRoot, ...item.path.split('/'))
    if (!force) {
      try {
        const info = await stat(outputPath)
        if (info.size > 0) return 'skipped'
      } catch {
        // File does not exist yet.
      }
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      let response
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            model,
          },
          body: JSON.stringify({
            text: item.text,
            reference_id: referenceId,
            format: 'mp3',
          }),
        })
      } catch (error) {
        if (attempt < 2) {
          await delay(800 * (attempt + 1))
          continue
        }
        throw error instanceof Error ? error : new Error(String(error))
      }

      if (!response.ok) {
        const body = await response.text().catch(() => '')
        const detail = body.length > 300 ? `${body.slice(0, 300)}...` : body
        if (response.status !== 402 && (response.status === 429 || response.status >= 500) && attempt < 2) {
          await delay(1000 * (attempt + 1))
          continue
        }
        throw new Error(`Fish Audio ${response.status}: ${detail}`)
      }

      const audio = Buffer.from(await response.arrayBuffer())
      await mkdir(path.dirname(outputPath), { recursive: true })
      await writeFile(outputPath, audio)
      return 'generated'
    }
    throw new Error(`Fish Audio retries exhausted for ${item.id}`)
  }

  async function worker() {
    while (!stopping) {
      const index = cursor
      cursor += 1
      if (index >= items.length) break
      const item = items[index]
      try {
        const result = await generateOne(item)
        if (result === 'generated') {
          generated += 1
          if (generated % 10 === 0) console.log(`Generated ${generated} files...`)
        } else {
          skipped += 1
        }
      } catch (error) {
        stopping = error instanceof Error && error.message.includes('402')
        failures.push({ item, error: error instanceof Error ? error : new Error(String(error)) })
        if (!stopping) console.warn(`Failed ${item.id}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()))

  const manifestFiles = []
  for (const item of audioItems) {
    const outputPath = path.join(outputRoot, ...item.path.split('/'))
    try {
      const info = await stat(outputPath)
      if (info.size > 0) manifestFiles.push(item.path)
    } catch {
      // Not generated.
    }
  }
  await mkdir(path.join(outputRoot, 'audio'), { recursive: true })
  await writeFile(
    path.join(outputRoot, 'audio', 'manifest.json'),
    JSON.stringify({ count: manifestFiles.length, files: manifestFiles }, null, 2),
  )

  if (failures.some((failure) => failure.error.message.includes('402'))) {
    console.error('Fish Audio API credit is insufficient; no new audio was generated for these requests.')
    process.exitCode = 1
  } else if (failures.length > 0) {
    console.error(`Finished with ${failures.length} failed items.`)
    process.exitCode = 1
  }

  console.log(`Done: ${generated} generated, ${skipped} skipped, ${failures.length} failed, ${manifestFiles.length} files in manifest.`)
}

main()
