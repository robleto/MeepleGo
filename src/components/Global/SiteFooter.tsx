import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-10 md:grid-cols-4 text-sm">
        <div className="space-y-3">
          <div className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            MeepleGo
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs">
            A fast, personal way to rank, award, and reflect on the board games you play.
          </p>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
            Product
          </h4>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>
              <Link
                href="/games"
                className="hover:text-gray-900 dark:hover:text-gray-100 transition"
              >
                Games
              </Link>
            </li>
            <li>
              <Link
                href="/lists"
                className="hover:text-gray-900 dark:hover:text-gray-100 transition"
              >
                Lists
              </Link>
            </li>
            <li>
              <Link
                href="/rankings"
                className="hover:text-gray-900 dark:hover:text-gray-100 transition"
              >
                Rankings
              </Link>
            </li>
            <li>
              <Link
                href="/awards"
                className="hover:text-gray-900 dark:hover:text-gray-100 transition"
              >
                Awards
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
            Resources
          </h4>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>
              <Link
                href="/help/data"
                className="hover:text-gray-900 dark:hover:text-gray-100 transition"
              >
                Data & Privacy
              </Link>
            </li>
            <li>
              <Link
                href="/help/privacy"
                className="hover:text-gray-900 dark:hover:text-gray-100 transition"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/help/terms"
                className="hover:text-gray-900 dark:hover:text-gray-100 transition"
              >
                Terms of Service
              </Link>
            </li>
            <li>
              <Link
                href="/import"
                className="hover:text-gray-900 dark:hover:text-gray-100 transition"
              >
                Import
              </Link>
            </li>
            <li>
              <a
                href="mailto:feedback@meeplego.com?subject=MeepleGo%20Feedback"
                className="hover:text-gray-900 dark:hover:text-gray-100 transition text-blue-600 dark:text-blue-400"
              >
                Send Feedback
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
            Meta
          </h4>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>
              <a
                href="https://boardgamegeek.com"
                target="_blank"
                className="hover:text-gray-900 dark:hover:text-gray-100 transition"
                rel="noreferrer"
              >
                BGG
              </a>
            </li>
            <li>
              <span className="text-gray-400 dark:text-gray-500">
                v0.1 preview
              </span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 py-4 text-center text-[11px] text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} MeepleGo. Not affiliated with
        BoardGameGeek.
      </div>
    </footer>
  )
}
