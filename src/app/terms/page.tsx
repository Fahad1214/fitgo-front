import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | FitGo',
  description: 'FitGo website terms of service and conditions of use.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-gray-300">Last updated: May 2, 2026</p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 prose prose-gray max-w-none">
            <p className="text-gray-600 not-prose">
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of the FitGo
              website and related services (&quot;Services&quot;). By using our Services, you agree to
              these Terms.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">1. Use of the Services</h2>
            <p className="text-gray-600 leading-relaxed">
              FitGo provides health, fitness, and wellness content for informational purposes. You
              agree to use the Services only in compliance with applicable laws and these Terms. You
              must not misuse the Services, attempt unauthorized access, or interfere with the
              operation of the site.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">2. Accounts</h2>
            <p className="text-gray-600 leading-relaxed">
              If you create an account, you are responsible for safeguarding your credentials and
              for all activity under your account. Notify us promptly of any unauthorized use.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">3. Content and tools</h2>
            <p className="text-gray-600 leading-relaxed">
              Content on FitGo (including blog articles and tools such as video processing) is
              provided for general information. It is not medical advice. Always consult qualified
              professionals before changing your diet, exercise, or health regimen. Tools that
              process third-party media may be subject to the rights and policies of those platforms;
              you represent that you have the right to use any content you submit.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">4. Intellectual property</h2>
            <p className="text-gray-600 leading-relaxed">
              FitGo and its licensors retain rights to the Services, branding, and original content.
              You may not copy, modify, or distribute our materials without permission except as
              allowed by law or expressly permitted by us.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">5. Disclaimer</h2>
            <p className="text-gray-600 leading-relaxed">
              The Services are provided &quot;as is&quot; without warranties of any kind, to the fullest
              extent permitted by law. We do not guarantee uninterrupted or error-free operation.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">6. Limitation of liability</h2>
            <p className="text-gray-600 leading-relaxed">
              To the maximum extent permitted by law, FitGo and its team will not be liable for
              indirect, incidental, or consequential damages arising from your use of the Services.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">7. Changes</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update these Terms from time to time. The &quot;Last updated&quot; date will change
              when we do. Continued use of the Services after changes means you accept the updated
              Terms.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">8. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              For questions about these Terms, contact us through our{' '}
              <Link href="/contact-us" className="text-orange-600 font-semibold hover:underline">
                Contact
              </Link>{' '}
              page.
            </p>

            <p className="text-sm text-gray-500 mt-10 not-prose border-t border-gray-200 pt-6">
              This page is a general template and may not meet your jurisdiction’s requirements.
              Have it reviewed by a qualified attorney if you need binding legal terms.
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
