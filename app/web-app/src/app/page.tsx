import Link from "next/link"
import { Button } from "~/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Mic, Target, Users, Bot } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-slate-50 shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <img src="/andi-logo-192.png" alt="ANDI logo" className="h-8 w-8" />
              <span className="text-2xl font-bold text-slate-900">ANDI</span>
            </div>
            <Button asChild className="bg-slate-700 hover:bg-slate-800 text-slate-50">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Transform Teaching Through <span className="text-slate-700">AI-Powered Classroom Analysis</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            ANDI listens to your classroom, analyzes teaching effectiveness, and provides personalized coaching insights to help every educator thrive. <span className="font-medium text-slate-700">Your favorite teacher's favorite teacher.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-slate-700 hover:bg-slate-800 text-slate-50">
              <Link href="/auth/signin">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" className="border-slate-300 text-slate-700 hover:bg-slate-100">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              AI-Powered Classroom Analysis
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              From audio to action in minutes. ANDI captures classroom conversations and provides growth-focused insights without scores or judgment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-slate-50 border-slate-200 hover:bg-slate-100 transition-colors">
              <CardHeader>
                <Mic className="h-12 w-12 text-slate-600 mb-4" />
                <CardTitle className="text-slate-900">Classroom Audio Analysis</CardTitle>
                <CardDescription className="text-slate-600">
                  Capture and analyze real classroom conversations to understand teaching patterns, student engagement, and learning dynamics.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-50 border-slate-200 hover:bg-slate-100 transition-colors">
              <CardHeader>
                <Target className="h-12 w-12 text-slate-600 mb-4" />
                <CardTitle className="text-slate-900">CIQ Framework Insights</CardTitle>
                <CardDescription className="text-slate-600">
                  Measure classroom impact through our proprietary Classroom Impact Quotient, focusing on Equity, Creativity, and Innovation.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-50 border-slate-200 hover:bg-slate-100 transition-colors">
              <CardHeader>
                <Users className="h-12 w-12 text-slate-600 mb-4" />
                <CardTitle className="text-slate-900">Non-Evaluative Coaching</CardTitle>
                <CardDescription className="text-slate-600">
                  Receive personalized, growth-focused recommendations that celebrate strengths and identify opportunities for development.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to Transform Your Teaching?
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Making quality instructional coaching accessible to all educators. Built by educators, for educators.
          </p>
          <Button size="lg" asChild className="bg-slate-700 hover:bg-slate-800 text-slate-50">
            <Link href="/auth/signin">Start Your Journey</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src="/andi-logo-192.png" alt="ANDI logo" className="h-6 w-6" />
              <span className="text-lg font-semibold text-slate-100">ANDI</span>
            </div>
            <p className="text-slate-400">
              © 2024 ANDI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
