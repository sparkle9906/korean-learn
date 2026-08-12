import { chromium } from 'playwright'

const errors = []
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
})
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
await page.waitForSelector('.today-hero')
await page.screenshot({ path: 'shots-today.png', fullPage: true })

const checks = [
  ['hangul', '谚文', '.hangul-composer'],
  ['words', '单词', '.word-grid'],
  ['phrases', '短语', '.phrase-list'],
  ['practice', '练习', '.practice-setup'],
  ['progress', '进度', '.progress-summary'],
]

for (const [name, label, selector] of checks) {
  await page.locator(`button.nav-item[aria-label="${label}"]`).click()
  await page.waitForSelector(selector)
  await page.waitForTimeout(350)
  console.log(`${name}: ${await page.locator('.section-header h2').first().textContent().catch(() => 'no header')}`)
  await page.screenshot({ path: `shots-${name}.png`, fullPage: true })
}

const overflow = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  scrollHeight: document.documentElement.scrollHeight,
  clientHeight: document.documentElement.clientHeight,
}))
console.log(`desktop overflow: ${JSON.stringify(overflow)}`)

await page.locator('button.nav-item[aria-label="单词"]').click()
await page.waitForSelector('.word-grid')
console.log(`word cards: ${await page.locator('.word-card').count()}`)

await page.locator('button.nav-item[aria-label="练习"]').click()
await page.waitForSelector('.practice-setup')
await page.getByRole('button', { name: /开始 10 题/ }).click()
await page.waitForSelector('.question-card')
console.log(`quiz options: ${await page.locator('.option').count()}`)
await page.screenshot({ path: 'shots-quiz.png', fullPage: true })

await page.locator('.option').first().click()
await page.waitForSelector('.answer-feedback')
console.log(`feedback after answer: ${await page.locator('.answer-feedback').count()}`)

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
mobile.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`mobile console: ${msg.text()}`)
})
mobile.on('pageerror', (err) => errors.push(`mobile pageerror: ${err.message}`))
await mobile.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
await mobile.waitForSelector('.today-hero')
await mobile.screenshot({ path: 'shots-mobile.png', fullPage: true })
const mobileOverflow = await mobile.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}))
console.log(`mobile overflow: ${JSON.stringify(mobileOverflow)}`)
await mobile.locator('button.nav-item[aria-label="谚文"]').click()
await mobile.waitForSelector('.hangul-composer')
await mobile.waitForTimeout(350)
await mobile.screenshot({ path: 'shots-mobile-hangul.png', fullPage: true })

console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'NO JS ERRORS')
await browser.close()
