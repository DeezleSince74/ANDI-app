import Link from "next/link"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { GraduationCap, ArrowLeft } from "lucide-react"

export default function TermsOfServicePage() {
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
            <CardTitle className="text-3xl text-center">Terms of Service</CardTitle>
            <p className="text-center text-gray-600">Last updated: July 3, 2025</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  By accessing and using ANDI Labs (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  ANDI Labs provides AI-powered instructional coaching services for educators, including but not limited to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Personalized AI guidance for teaching practices</li>
                  <li>Data analytics and insights for student performance</li>
                  <li>Collaborative tools for professional development</li>
                  <li>Workflow automation for educational tasks</li>
                  <li>Resource recommendations and curriculum support</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Educational Use</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  ANDI Labs is designed specifically for educational purposes. Users agree to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Use the service solely for legitimate educational activities</li>
                  <li>Comply with all applicable educational privacy laws (FERPA, COPPA, etc.)</li>
                  <li>Protect student privacy and confidentiality at all times</li>
                  <li>Not share student data with unauthorized third parties</li>
                  <li>Follow their institution&apos;s data governance policies</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. User Accounts and Responsibilities</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Users are responsible for:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Maintaining the confidentiality of their account credentials</li>
                  <li>All activities that occur under their account</li>
                  <li>Immediately notifying us of any unauthorized use of their account</li>
                  <li>Ensuring all information provided is accurate and up-to-date</li>
                  <li>Using the service in accordance with their institution&apos;s policies</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data and Privacy</h2>
                <p className="text-gray-700 leading-relaxed">
                  We take data privacy seriously, especially in educational contexts. Our handling of your data is governed by our Privacy Policy, which forms an integral part of these Terms. We comply with FERPA, GDPR, and other applicable privacy regulations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
                <p className="text-gray-700 leading-relaxed">
                  The Service and its original content, features, and functionality are and will remain the exclusive property of ANDI Labs and its licensors. The service is protected by copyright, trademark, and other laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Prohibited Uses</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  You may not use the Service:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>For any unlawful purpose or to solicit others to perform such acts</li>
                  <li>To violate any international, federal, provincial, or state regulations or laws</li>
                  <li>To transmit or create any harmful, discriminatory, or offensive content</li>
                  <li>To violate student privacy or educational confidentiality requirements</li>
                  <li>To interfere with or circumvent the security features of the Service</li>
                  <li>To impersonate or attempt to impersonate another user or entity</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Service Availability</h2>
                <p className="text-gray-700 leading-relaxed">
                  We strive to maintain high service availability but do not guarantee uninterrupted access. We may modify, suspend, or discontinue the service at any time with reasonable notice to users.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
                <p className="text-gray-700 leading-relaxed">
                  ANDI Labs shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days&apos; notice prior to any new terms taking effect.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Information</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mt-3">
                  <p className="text-gray-700">
                    <strong>Email:</strong> legal@andilabs.ai<br />
                    <strong>Address:</strong> ANDI Labs, Inc.<br />
                    Educational Technology Division<br />
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