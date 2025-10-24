import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Terms of Service</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Last Updated: {new Date().toLocaleDateString()}</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using NFL Analytics Pro ("the Service"), you accept and agree to be bound by the terms
                and provision of this agreement. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p>
                NFL Analytics Pro is an informational platform that provides AI-powered analytics and predictions for NFL
                games. The Service is provided for informational and entertainment purposes only.
              </p>
              <p className="mt-4 font-semibold text-destructive">
                IMPORTANT: This service does NOT provide gambling advice. All predictions and analyses are for
                informational purposes only. Users should not use this service for making betting decisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <p>
                To access certain features of the Service, you may be required to create an account. You are responsible
                for:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Prohibited Uses</h2>
              <p>You agree not to use the Service to:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Make gambling or betting decisions</li>
                <li>Transmit malicious code or harmful materials</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Use the Service for commercial purposes without permission</li>
                <li>Scrape, crawl, or systematically collect data from the Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. No Warranties</h2>
              <p>
                The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind. We do not guarantee
                the accuracy, completeness, or reliability of any predictions, analyses, or information provided.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
              <p>
                In no event shall NFL Analytics Pro, its officers, directors, employees, or agents be liable for any
                indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of
                profits, data, use, goodwill, or other intangible losses resulting from your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
              <p>
                All content, features, and functionality of the Service are owned by NFL Analytics Pro and are protected
                by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of any material changes by
                posting the new Terms of Service on this page.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the Service immediately, without prior notice or
                liability, for any reason, including breach of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us through the application.
              </p>
            </section>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
