export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
      <div className="prose prose-gray max-w-none">
        <p>
          Your privacy is important to us. This policy explains what data we collect, why we collect it, and how we handle it.
        </p>
        <h2>Information We Collect</h2>
        <ul>
          <li>Account details like email address for authentication and notifications.</li>
          <li>Profile and app content you create, such as lists, rankings, awards.</li>
          <li>Usage and device data to improve the experience.</li>
        </ul>
        <h2>How We Use Information</h2>
        <ul>
          <li>Provide authentication and secure access to your account.</li>
          <li>Send transactional emails (confirmations, password resets) via our email provider.</li>
          <li>Improve features and ensure reliability.</li>
        </ul>
        <h2>Data Retention</h2>
        <p>We retain data for as long as your account is active or as required by law. You can request deletion at any time.</p>
        <h2>Contact</h2>
        <p>Questions? Contact us at privacy@meeplego.com.</p>
      </div>
    </div>
  )
}
