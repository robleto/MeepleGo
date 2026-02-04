import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-10 md:grid-cols-4 text-sm">
        <div className="space-y-3">
          <div className="text-lg font-semibold tracking-tight text-gray-900">
            MeepleGo
          </div>
          <p className="text-xs text-gray-600 leading-relaxed max-w-xs">
            A fast, personal way to rank, award, and reflect on the board games you play.
          </p>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Product
          </h4>
          <ul className="space-y-2 text-gray-600">
            <li>
              <Link
                href="/games"
                className="hover:text-gray-900 transition"
              >
                Games
              </Link>
            </li>
            <li>
              <Link
                href="/lists"
                className="hover:text-gray-900 transition"
              >
                Lists
              </Link>
            </li>
            <li>
              <Link
                href="/rankings"
                className="hover:text-gray-900 transition"
              >
                Rankings
              </Link>
            </li>
            <li>
              <Link
                href="/awards"
                className="hover:text-gray-900 transition"
              >
                Awards
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Resources
          </h4>
          <ul className="space-y-2 text-gray-600">
            <li>
              <Link
                href="/help/data"
                className="hover:text-gray-900 transition"
              >
                Data & Privacy
              </Link>
            </li>
            <li>
              <Link
                href="/help/privacy"
                className="hover:text-gray-900 transition"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/help/terms"
                className="hover:text-gray-900 transition"
              >
                Terms of Service
              </Link>
            </li>
            <li>
              <Link
                href="/import"
                className="hover:text-gray-900 transition"
              >
                Import
              </Link>
            </li>
            <li>
              <a
                href="mailto:feedback@meeplego.com?subject=MeepleGo%20Feedback"
                className="hover:text-gray-900 transition text-blue-600"
              >
                Send Feedback
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Meta
          </h4>
          <ul className="space-y-2 text-gray-600">
            <li>
              <a
                href="https://boardgamegeek.com"
                target="_blank"
                className="hover:text-gray-900 transition"
                rel="noreferrer"
              >
                BGG
              </a>
            </li>
            <li>
              <span className="text-gray-400">
                v0.1 preview
              </span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-200 py-4 text-center text-[11px] text-gray-500">
        &copy; {new Date().getFullYear()} MeepleGo. Not affiliated with
        BoardGameGeek.
      </div>
    </footer>
  )
}
