export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
      <div className="prose prose-gray max-w-none">
        <p>
          By using MeepleGo, you agree to these terms. Please read them carefully.
        </p>
        <h2>Use of Service</h2>
        <ul>
          <li>You must be 13 or older to use the service.</li>
          <li>You are responsible for your account and all activity under it.</li>
          <li>Don’t misuse the service or attempt to access it using methods other than provided interfaces.</li>
        </ul>
        <h2>Content</h2>
        <p>You retain rights to content you submit. You grant us a license to host and display it in the app.</p>
        <h2>Termination</h2>
        <p>We may suspend or terminate access if these terms are violated.</p>
        <h2>Contact</h2>
        <p>Questions? Contact us at support@meeplego.com.</p>
      </div>
    </div>
  )
}
