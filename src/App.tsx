import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { ViewId } from './types'
import { AppProvider, useApp } from './lib/AppContext'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { TodayView } from './components/TodayView'
import { HangulView } from './components/HangulView'
import { WordsView } from './components/WordsView'
import { PhrasesView } from './components/PhrasesView'
import { PracticeView } from './components/PracticeView'
import { ProgressView } from './components/ProgressView'

function Toast() {
  const { toast } = useApp()
  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          key={toast.id}
          className="toast"
          role="status"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
        >
          {toast.message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function Shell() {
  const [view, setView] = useState<ViewId>('today')
  const [canScrollToTop, setCanScrollToTop] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigate = (nextView: ViewId) => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'instant' })
    setCanScrollToTop(false)
    setView(nextView)
  }

  const supportsQuickTop = view === 'words' || view === 'phrases'

  return (
    <div className="app-shell">
      <Sidebar activeView={view} onNavigate={navigate} />
      <main className="main">
        <TopBar
          activeView={view}
          canScrollToTop={supportsQuickTop && canScrollToTop}
          onNavigate={navigate}
          onScrollToTop={scrollToTop}
        />
        <div
          ref={contentRef}
          className="content"
          onScroll={(event) => setCanScrollToTop(event.currentTarget.scrollTop > 80)}
        >
          {/* Tab views intentionally switch synchronously. On iOS, waiting for an exit
              animation left a brief empty (black) WebView frame between tabs. */}
          <div className="view">
            {view === 'today' ? <TodayView onNavigate={navigate} /> : null}
            {view === 'hangul' ? <HangulView /> : null}
            {view === 'words' ? <WordsView /> : null}
            {view === 'phrases' ? <PhrasesView /> : null}
            {view === 'practice' ? <PracticeView /> : null}
            {view === 'progress' ? <ProgressView /> : null}
            <footer className="app-copyright">copyright@cmzkdsx</footer>
          </div>
        </div>
      </main>
      <Toast />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
