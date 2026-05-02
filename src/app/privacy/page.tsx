import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | FitGo',
  description: 'How FitGo collects, uses, and protects your information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-300">Last updated: May 2, 2026</p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 prose prose-gray max-w-none">
            <p className="text-gray-600 not-prose">
              FitGo (&quot;we&quot;, &quot;us&quot;) respects your privacy. This Privacy Policy describes how we
              collect, use, and share information when you use our website and related services
              (&quot;Services&quot;).
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">1. Information we collect</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>
                <strong className="text-gray-800">Account data:</strong> If you sign up or log in,
                we may collect identifiers such as email address and profile details you choose to
                provide.
              </li>
              <li>
                <strong className="text-gray-800">Usage data:</strong> We may collect technical
                information such as browser type, device type, pages viewed, and approximate
                location derived from IP address.
              </li>
              <li>
                <strong className="text-gray-800">Content you submit:</strong> If you use features
                that process URLs or media, that input is handled to perform the service and may be
                processed on our servers for the duration of the request.
              </li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">2. How we use information</h2>
            <p className="text-gray-600 leading-relaxed">
              We use the information we collect to provide and improve the Services, communicate
              with you, secure our site, analyze usage, and comply with law. We do not sell your
              personal information.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">3. Cookies and similar technologies</h2>
            <p className="text-gray-600 leading-relaxed">
              We may use cookies or similar technologies for essential site function, preferences,
              and analytics. You can control cookies through your browser settings; blocking some
              cookies may limit certain features.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">4. Third-party services</h2>
            <p className="text-gray-600 leading-relaxed">
              We may use third-party providers (for example, hosting, authentication, or content
              delivery) that process data on our behalf. Their use of your information is governed
              by their policies. We encourage you to review those policies when you use integrated
              services.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">5. Data retention and security</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain information only as long as needed for the purposes described or as required
              by law. We use reasonable measures to protect data, but no method of transmission over
              the internet is completely secure.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">6. Your rights</h2>
            <p className="text-gray-600 leading-relaxed">
              Depending on where you live, you may have rights to access, correct, delete, or
              export your personal data, or to object to certain processing. To exercise these
              rights, contact us using the information below.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">7. Children</h2>
            <p className="text-gray-600 leading-relaxed">
              Our Services are not directed to children under 13 (or the age required in your
              country). We do not knowingly collect personal information from children.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">8. Changes to this policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date will
              change when we do. We encourage you to review this page periodically.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">9. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              For privacy-related questions, contact us through our{' '}
              <Link href="/contact-us" className="text-orange-600 font-semibold hover:underline">
                Contact
              </Link>{' '}
              page.
            </p>

            <p className="text-sm text-gray-500 mt-10 not-prose border-t border-gray-200 pt-6">
              This policy is a general template. Adjust it for your actual data practices and have
              it reviewed by a qualified professional if you need a legally complete document.
            </p>
          </div>

          <p className="text-center mt-8">
            <Link
              href="/"
              className="text-orange-600 font-semibold hover:text-orange-700"
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
