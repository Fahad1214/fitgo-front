import React from "react";

const ContactUs = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-gray-300">Get in touch with us</p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                We&apos;d Love to Hear From You
              </h2>
              <p className="text-lg text-gray-600">
                Have questions or feedback? Feel free to reach out to us!
              </p>
            </div>

            <div className="space-y-8">
              {/* Email Contact */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6">
                  <svg
                    className="w-10 h-10 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Email Us</h3>
                <p className="text-gray-600 mb-6">
                  Send us an email and we&apos;ll get back to you as soon as possible.
                </p>
                <a
                  href="mailto:fali08822@gmail.com"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg transition font-semibold text-lg shadow-md hover:shadow-lg"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  fali08822@gmail.com
                </a>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <div className="text-center md:text-left">
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">Response Time</h4>
                  <p className="text-gray-600">
                    We typically respond within 24-48 hours during business days.
                  </p>
                </div>
                <div className="text-center md:text-left">
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">Business Hours</h4>
                  <p className="text-gray-600">
                    Monday - Friday: 9:00 AM - 6:00 PM
                    <br />
                    Saturday - Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;