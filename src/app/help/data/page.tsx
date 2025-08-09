export default function DataPracticesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Data Practices</h1>
      <div className="prose prose-gray max-w-none">
        <p>
          This page outlines how we handle your data and the controls available to you.
        </p>
        <h2>Storage & Security</h2>
        <ul>
          <li>We store data in Supabase (PostgreSQL) with Row Level Security.</li>
          <li>Passwords are never stored in plain text.</li>
          <li>Transport is encrypted via HTTPS.</li>
        </ul>
        <h2>Your Controls</h2>
        <ul>
          <li>Update profile information in Settings.</li>
          <li>Request data export or deletion by contacting support.</li>
          <li>Manage email preferences from emails or settings where available.</li>
        </ul>
        <h2>Third Parties</h2>
        <p>We use providers like Supabase and email/OAuth providers (Google, Facebook, GitHub) solely to provide app functionality.</p>
      </div>
    </div>
  )
}
