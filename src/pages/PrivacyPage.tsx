import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-[#020202]">
      <Header />
      
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: January 7, 2026</p>

            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
                <p className="text-muted-foreground mb-4">We collect information you provide directly:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Account information (name, email, password)</li>
                  <li>Profile information (country, timezone, trading preferences)</li>
                  <li>Payment information (processed securely via Stripe)</li>
                  <li>Trading data (journal entries, performance metrics)</li>
                  <li>Communications (support tickets, feedback)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Provide and improve our services</li>
                  <li>Send trading signals and notifications</li>
                  <li>Process payments and subscriptions</li>
                  <li>Personalize your experience</li>
                  <li>Provide customer support</li>
                  <li>Send marketing communications (with your consent)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Data Security</h2>
                <p className="text-muted-foreground">
                  We implement industry-standard security measures to protect your data, including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                  <li>SSL/TLS encryption for all data in transit</li>
                  <li>Encrypted storage for sensitive data</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>Strict access controls for our team members</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Data Sharing</h2>
                <p className="text-muted-foreground">
                  We do not sell your personal information. We may share data with:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                  <li>Payment processors (Stripe, PayPal) for transactions</li>
                  <li>Email service providers for communications</li>
                  <li>Analytics providers (anonymized data only)</li>
                  <li>Law enforcement when legally required</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
                <p className="text-muted-foreground mb-4">You have the right to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Access your personal data</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Export your data in a portable format</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Withdraw consent at any time</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Cookies</h2>
                <p className="text-muted-foreground">
                  We use cookies and similar technologies to remember your preferences, analyze traffic, 
                  and improve your experience. You can control cookie settings in your browser.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
                <p className="text-muted-foreground">
                  We retain your data for as long as your account is active or as needed to provide services. 
                  Upon account deletion, we remove personal data within 30 days, except where retention is 
                  required by law.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our Service is not intended for users under 18. We do not knowingly collect information 
                  from children.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
                <p className="text-muted-foreground">
                  For privacy-related inquiries, contact our Data Protection Officer at privacy@traderedge.com
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
