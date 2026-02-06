import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Shield, AlertTriangle, FileText, Scale, Clock, Ban, Activity } from 'lucide-react';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-[#020202]">
      <Header />
      
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground mb-4">Last updated: January 9, 2026</p>
            
            {/* Important Notice Banner */}
            <div className="p-6 rounded-xl bg-warning/10 border border-warning/30 mb-8">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-warning shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-warning mb-2">IMPORTANT NOTICE - PLEASE READ CAREFULLY</h3>
                  <p className="text-warning/80 text-sm">
                    By purchasing any TraderEdge subscription, you acknowledge that you are purchasing access to 
                    <strong> DIGITAL SERVICES </strong> that are <strong>DELIVERED INSTANTLY</strong> upon payment. 
                    <strong> ALL SALES ARE FINAL - NO REFUNDS OR CANCELLATIONS.</strong>
                  </p>
                  <Link to="/refund-policy" className="text-warning underline text-sm mt-2 inline-block">
                    Read our full Refund Policy →
                  </Link>
                </div>
              </div>
            </div>

            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary" />
                  1. Acceptance of Terms
                </h2>
                <p className="text-muted-foreground">
                  By accessing or using TraderEdge ("the Service"), you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our Service. Your purchase and continued use 
                  of the Service constitutes your acceptance of these terms, including our no-refund policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-primary" />
                  2. Digital Service Nature
                </h2>
                <p className="text-muted-foreground">
                  TraderEdge provides <strong>DIGITAL SERVICES</strong> including but not limited to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                  <li>Real-time trading signals delivered through our dashboard and notifications</li>
                  <li>Access to our proprietary trading analytics and performance tracking tools</li>
                  <li>AI-powered trading assistance and risk management tools</li>
                  <li>Educational content and market analysis</li>
                  <li>Access to our community and support features</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  These services are delivered <strong>IMMEDIATELY</strong> upon successful payment processing. 
                  You will receive instant access to your dashboard and all features included in your subscription plan.
                </p>
              </section>

              <section className="bg-destructive/10 border border-destructive/30 rounded-xl p-6">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-destructive">
                  <Ban className="w-6 h-6" />
                  3. NO REFUND POLICY
                </h2>
                <div className="space-y-4">
                  <p className="text-foreground font-semibold">
                    ALL SALES ARE FINAL. NO REFUNDS, CANCELLATIONS, OR CHARGEBACKS WILL BE HONORED.
                  </p>
                  <p className="text-muted-foreground">
                    Due to the instant-access nature of our digital services:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>No refunds will be issued under any circumstances once payment is processed</li>
                    <li>No partial refunds are available</li>
                    <li>No cancellation of active subscriptions with refund</li>
                    <li>Access to the service upon successful payment constitutes full delivery</li>
                    <li>Your first login and/or receipt of trading signals confirms service delivery</li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    By completing your purchase, you expressly acknowledge and agree that:
                  </p>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-2">
                    <li>You are purchasing access to digital content/services</li>
                    <li>The service is delivered immediately upon payment</li>
                    <li>You waive your right to withdraw from this purchase after delivery begins</li>
                    <li>This is consistent with EU Consumer Rights Directive Article 16(m) and similar provisions worldwide</li>
                  </ol>
                </div>
              </section>

              <section className="bg-risk/10 border border-risk/30 rounded-xl p-6">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-risk">
                  <AlertTriangle className="w-6 h-6" />
                  4. Dispute & Chargeback Policy
                </h2>
                <div className="space-y-4">
                  <p className="text-foreground font-semibold">
                    WARNING: FRAUDULENT DISPUTES WILL RESULT IN IMMEDIATE ACTION
                  </p>
                  <p className="text-muted-foreground">
                    Filing a payment dispute or chargeback after receiving access to our services constitutes:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li><strong>Fraud</strong> - Obtaining services through false pretenses</li>
                    <li><strong>Breach of Contract</strong> - Violation of these Terms of Service</li>
                    <li><strong>Theft of Services</strong> - Using services without payment</li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    Consequences of fraudulent disputes:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Immediate and permanent account termination</li>
                    <li>Blacklisting from all TraderEdge services</li>
                    <li>We will contest all disputes with comprehensive evidence including:
                      <ul className="list-disc list-inside ml-6 mt-2">
                        <li>Your terms acceptance timestamp and IP address</li>
                        <li>Login history and activity logs</li>
                        <li>Trading signals received and viewed</li>
                        <li>Dashboard access records</li>
                        <li>Payment confirmation and receipts</li>
                      </ul>
                    </li>
                    <li>Potential legal action for recovery of costs and damages</li>
                    <li>Report to fraud prevention databases</li>
                  </ul>
                </div>
              </section>

              <section className="bg-primary/10 border border-primary/30 rounded-xl p-6">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-primary">
                  <Activity className="w-6 h-6" />
                  5. Activity Tracking & Evidence Collection
                </h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    To protect against fraudulent disputes and ensure service quality, TraderEdge maintains comprehensive 
                    records of your service usage, including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li><strong>Login Records:</strong> Timestamps, IP addresses, and device information for each login</li>
                    <li><strong>Signal Delivery:</strong> Every trading signal sent to your account with timestamps</li>
                    <li><strong>Dashboard Activity:</strong> Pages viewed and features accessed</li>
                    <li><strong>Terms Acceptance:</strong> Timestamp and IP when you accepted these terms</li>
                    <li><strong>Payment Details:</strong> Transaction records and confirmation timestamps</li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    This data serves as conclusive evidence of service delivery and will be used to defend against 
                    any fraudulent dispute claims.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Scale className="w-6 h-6 text-primary" />
                  6. PayPal Payments - Additional Terms
                </h2>
                <p className="text-muted-foreground">
                  If you choose to pay via PayPal, you additionally acknowledge and agree that:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                  <li>PayPal's Buyer Protection does NOT apply to digital services that have been delivered</li>
                  <li>Filing a PayPal dispute for delivered digital services constitutes fraud</li>
                  <li>You were clearly informed of our no-refund policy before payment</li>
                  <li>You had the opportunity to ask questions before purchasing</li>
                  <li>A detailed invoice describing the digital services was provided</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-primary" />
                  7. Subscription & Billing
                </h2>
                <p className="text-muted-foreground">
                  Subscriptions are billed on a recurring basis (monthly or quarterly depending on your plan). 
                  By subscribing, you authorize us to charge your payment method for all applicable fees.
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                  <li>You may cancel future renewals at any time through your dashboard</li>
                  <li>Cancellation stops future billing but does NOT provide any refund</li>
                  <li>Access continues until the end of your current billing period</li>
                  <li>No proration or partial refunds for mid-cycle cancellations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Risk Disclaimer</h2>
                <p className="text-muted-foreground">
                  <strong>IMPORTANT:</strong> Trading in financial markets involves substantial risk of loss and is 
                  not suitable for every investor. The signals and information provided by TraderEdge are for 
                  educational and informational purposes only and should not be construed as investment advice.
                </p>
                <p className="text-muted-foreground mt-4">
                  Past performance does not guarantee future results. You should never trade with money you cannot 
                  afford to lose. We strongly recommend consulting with a licensed financial advisor before making 
                  any investment decisions.
                </p>
                <p className="text-muted-foreground mt-4">
                  <strong>Trading losses are NOT grounds for refunds.</strong> The success of any trading signal 
                  depends on market conditions and your execution - we cannot guarantee profits.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. User Accounts</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>You must provide accurate and complete information when creating an account</li>
                  <li>You are responsible for maintaining the security of your account credentials</li>
                  <li>You must be at least 18 years old to use our Service</li>
                  <li>One account per person; account sharing is prohibited</li>
                  <li>Account sharing will result in immediate termination without refund</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Prohibited Conduct</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Sharing signals or content with non-subscribers</li>
                  <li>Automated scraping or data collection</li>
                  <li>Reverse engineering our algorithms</li>
                  <li>Using the Service for illegal activities</li>
                  <li>Harassment of other users or staff</li>
                  <li>Attempting to obtain refunds through false claims</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">11. Intellectual Property</h2>
                <p className="text-muted-foreground">
                  All content, including signals, analysis, algorithms, and educational materials, is the 
                  exclusive property of TraderEdge and is protected by copyright and other intellectual 
                  property laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">12. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  TraderEdge shall not be liable for any trading losses, lost profits, or any indirect, 
                  incidental, or consequential damages arising from your use of the Service. Our maximum 
                  liability is limited to the amount you paid for your current subscription period.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
                <p className="text-muted-foreground">
                  These Terms shall be governed by and construed in accordance with applicable laws. 
                  Any disputes shall be resolved through binding arbitration.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
                <p className="text-muted-foreground">
                  For questions about these Terms of Service, please contact us at:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2">
                  <li>Email: legal@traderedgepro.com</li>
                  <li>Support: support@traderedgepro.com</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  <strong>BEFORE purchasing:</strong> If you have ANY questions about our services, pricing, or 
                  refund policy, please contact us BEFORE making a payment. Once payment is processed and access 
                  is granted, no refunds will be issued.
                </p>
              </section>
            </div>

            {/* Final Acknowledgment */}
            <div className="mt-12 p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="font-bold text-lg mb-4">By Using TraderEdge, You Acknowledge:</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  You have read and understood these Terms of Service
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  You understand this is a digital service delivered instantly
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  You acknowledge and accept our NO REFUND policy
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  You understand that your activity is tracked for dispute protection
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  You will not file fraudulent disputes after receiving services
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TermsPage;
