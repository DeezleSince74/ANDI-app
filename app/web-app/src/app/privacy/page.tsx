import Link from "next/link"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { GraduationCap, ArrowLeft, Shield, Lock, Eye } from "lucide-react"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">ANDI Labs</span>
            </div>
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-center">Privacy Policy</CardTitle>
            <p className="text-center text-gray-600">Last updated: July 3, 2025</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-6">
              {/* Privacy Highlights */}
              <section className="bg-blue-50 p-6 rounded-lg">
                <h2 className="text-2xl font-semibold text-blue-900 mb-4 flex items-center">
                  <Shield className="h-6 w-6 mr-2" />
                  Privacy at a Glance
                </h2>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-start space-x-2">
                    <Lock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-blue-900">FERPA Compliant</h3>
                      <p className="text-blue-800">We protect educational records in accordance with federal law</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Eye className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-blue-900">No Data Selling</h3>
                      <p className="text-blue-800">We never sell or share your data with third parties for profit</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-blue-900">Secure by Design</h3>
                      <p className="text-blue-800">Enterprise-grade security protects all your information</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
                <p className="text-gray-700 leading-relaxed">
                  ANDI Labs (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy and the privacy of students. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered instructional coaching platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Account Information</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
                  <li>Name, email address, and professional credentials</li>
                  <li>School or institution affiliation</li>
                  <li>Teaching subjects and grade levels</li>
                  <li>Professional experience and certifications</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">Usage Data</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
                  <li>Platform interactions and feature usage</li>
                  <li>AI coaching session data and preferences</li>
                  <li>Content creation and modification history</li>
                  <li>Performance analytics and progress tracking</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">Student Data (when applicable)</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
                  <li>Aggregated, de-identified performance metrics only</li>
                  <li>No personally identifiable student information</li>
                  <li>Classroom-level analytics for instructional improvement</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We use your information to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Provide personalized AI coaching and recommendations</li>
                  <li>Analyze teaching patterns to improve instructional strategies</li>
                  <li>Generate insights and reports for professional development</li>
                  <li>Improve our AI models and platform functionality</li>
                  <li>Communicate important updates and educational resources</li>
                  <li>Ensure platform security and prevent misuse</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Educational Privacy Compliance</h2>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">FERPA Compliance</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We comply with the Family Educational Rights and Privacy Act (FERPA) and act as a school official with legitimate educational interests when processing educational records.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">COPPA Compliance</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Our platform is designed for educator use. We do not knowingly collect personal information from children under 13 without proper parental consent and school authorization.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">State Privacy Laws</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We comply with state student privacy laws, including California&apos;s Student Online Personal Information Protection Act (SOPIPA) and similar regulations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We do not sell, trade, or rent your personal information. We may share information only in these limited circumstances:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>With your consent:</strong> When you explicitly authorize data sharing</li>
                  <li><strong>Service providers:</strong> Trusted partners who help operate our platform (under strict contracts)</li>
                  <li><strong>Legal requirements:</strong> When required by law or to protect rights and safety</li>
                  <li><strong>Institutional administrators:</strong> School officials with legitimate educational interests</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We implement comprehensive security measures including:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>End-to-end encryption for data transmission and storage</li>
                  <li>Multi-factor authentication and access controls</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>SOC 2 Type II compliance and security certifications</li>
                  <li>Employee training on data privacy and security</li>
                  <li>Incident response procedures and breach notification protocols</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights and Choices</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  You have the right to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correct:</strong> Update or correct inaccurate information</li>
                  <li><strong>Delete:</strong> Request deletion of your account and data</li>
                  <li><strong>Port:</strong> Export your data in a machine-readable format</li>
                  <li><strong>Restrict:</strong> Limit how we process your information</li>
                  <li><strong>Object:</strong> Opt out of certain data processing activities</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
                <p className="text-gray-700 leading-relaxed">
                  We retain your data only as long as necessary to provide services and comply with legal obligations. When you delete your account, we will delete your personal data within 30 days, except where retention is required by law or legitimate business interests.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Users</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you are located outside the United States, please note that we transfer, store, and process your information in the United States. We implement appropriate safeguards for international data transfers in compliance with applicable privacy laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children&apos;s Privacy</h2>
                <p className="text-gray-700 leading-relaxed">
                  Our service is not directed to children under 13. We do not knowingly collect personal information from children under 13 without verifiable parental consent and appropriate school authorization under FERPA.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and sending notice to your registered email address at least 30 days before the changes take effect.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  If you have questions about this Privacy Policy or want to exercise your privacy rights, contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    <strong>Privacy Officer:</strong> privacy@andilabs.ai<br />
                    <strong>Data Protection Officer:</strong> dpo@andilabs.ai<br />
                    <strong>General Inquiries:</strong> support@andilabs.ai<br />
                    <strong>Mailing Address:</strong><br />
                    ANDI Labs, Inc.<br />
                    Attn: Privacy Officer<br />
                    [Your Address]
                  </p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}