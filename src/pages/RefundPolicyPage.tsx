import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Ban, AlertTriangle, HelpCircle, Mail, Shield } from 'lucide-react';

const RefundPolicyPage = () => {
  return (
    <div className="min-h-screen bg-[#020202]">
      <Header />
      
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: January 9, 2026</p>

            {/* Main No Refund Banner */}
            <div className="p-8 rounded-2xl bg-destructive/10 border-2 border-destructive/50 mb-8 text-center">
              <Ban className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-destructive mb-4">NO REFUNDS</h2>
              <p className="text-xl text-foreground">
                All sales are final. No refunds, cancellations, or chargebacks.
              </p>
            </div>

            <div className="space-y-8">
              {/* Why No Refunds */}
              <section className="p-6 rounded-xl bg-white/5 border border-white/10">
                <h2 className="text-2xl font-semibold mb-4">Why We Cannot Offer Refunds</h2>
                <p className="text-muted-foreground mb-4">
                  TraderEdge provides <strong>instant-access digital services</strong>. Unlike physical products, 
                  our services cannot be "returned" once delivered. Here's why:
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">1.</span>
                    <div>
                      <strong>Immediate Delivery:</strong> Your subscription is activated within seconds of payment. 
                      You immediately gain access to all trading signals, tools, and features.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">2.</span>
                    <div>
                      <strong>Service Consumed:</strong> Trading signals are time-sensitive. Once you receive a signal 
                      and can act on it, the service has been fully delivered.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">3.</span>
                    <div>
                      <strong>Cannot Be Undone:</strong> We cannot "take back" the signals you've received or the 
                      knowledge you've gained from our platform.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">4.</span>
                    <div>
                      <strong>Abuse Prevention:</strong> Without this policy, bad actors could subscribe, copy our 
                      signals, then request a refund - essentially stealing our intellectual property.
                    </div>
                  </li>
                </ul>
              </section>

              {/* What Happens When You Subscribe */}
              <section className="p-6 rounded-xl bg-primary/5 border border-primary/20">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-primary" />
                  What Happens When You Subscribe
                </h2>
                <ol className="space-y-4 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">1</span>
                    <div>
                      <strong>Payment Processed:</strong> Your payment is processed securely.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">2</span>
                    <div>
                      <strong>Instant Access:</strong> Your account is immediately activated with full access to your plan's features.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">3</span>
                    <div>
                      <strong>Service Begins:</strong> You can log in, view signals, use tools, and access all features.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">4</span>
                    <div>
                      <strong>Delivery Complete:</strong> The moment you access your dashboard, service delivery is complete.
                    </div>
                  </li>
                </ol>
              </section>

              {/* Not Grounds for Refund */}
              <section className="p-6 rounded-xl bg-risk/5 border border-risk/20">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-risk">
                  <AlertTriangle className="w-6 h-6" />
                  NOT Grounds for Refund
                </h2>
                <p className="text-muted-foreground mb-4">The following are NOT valid reasons for requesting a refund:</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-risk">✗</span>
                    "I didn't read the terms" - Terms are clearly displayed before purchase
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-risk">✗</span>
                    "I changed my mind" - This is a final sale
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-risk">✗</span>
                    "The signals didn't make me money" - Trading results depend on execution and market conditions
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-risk">✗</span>
                    "I don't use the service anymore" - You received what you paid for
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-risk">✗</span>
                    "I forgot to cancel" - You are responsible for managing your subscription
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-risk">✗</span>
                    "Someone else used my card" - Contact your bank about unauthorized use
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-risk">✗</span>
                    "I expected something different" - All features are clearly described
                  </li>
                </ul>
              </section>

              {/* Disputes Warning */}
              <section className="p-6 rounded-xl bg-destructive/10 border-2 border-destructive/30">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-6 h-6" />
                  Warning About Fraudulent Disputes
                </h2>
                <p className="text-muted-foreground mb-4">
                  Filing a credit card chargeback or PayPal dispute after receiving our services is considered <strong>FRAUD</strong>.
                </p>
                <p className="text-muted-foreground mb-4">
                  We maintain comprehensive records to defend against fraudulent claims:
                </p>
                <ul className="space-y-2 text-muted-foreground mb-4">
                  <li>• Your terms acceptance timestamp and IP address</li>
                  <li>• Every login with date, time, and device information</li>
                  <li>• Every signal you received with delivery confirmation</li>
                  <li>• Dashboard views and feature usage</li>
                  <li>• Payment receipts and confirmation emails</li>
                </ul>
                <p className="text-foreground font-semibold">
                  Consequences: Account termination, blacklisting, legal action for costs and damages.
                </p>
              </section>

              {/* FAQ */}
              <section className="p-6 rounded-xl bg-white/5 border border-white/10">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-primary" />
                  Frequently Asked Questions
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Can I get a refund if I cancel immediately?</h3>
                    <p className="text-muted-foreground">
                      No. Once payment is processed and your account is activated, no refunds are available - 
                      even if you cancel seconds later. The service has already been delivered.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">What if I have technical issues?</h3>
                    <p className="text-muted-foreground">
                      Contact our support team. We will resolve any technical issues, but technical problems 
                      are not grounds for refund. We will ensure you receive the service you paid for.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Can I cancel my subscription?</h3>
                    <p className="text-muted-foreground">
                      Yes, you can cancel anytime from your dashboard. This stops future billing, but 
                      no refund is provided for the current billing period. Access continues until expiration.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">What if the signals lose money?</h3>
                    <p className="text-muted-foreground">
                      Trading involves risk. We provide signals based on our analysis, but results depend on 
                      market conditions and your execution. Trading losses are never grounds for refund.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Is there a trial period?</h3>
                    <p className="text-muted-foreground">
                      We occasionally offer trial coupons for new users. Check our website or contact support 
                      if you'd like to try before committing to a full subscription.
                    </p>
                  </div>
                </div>
              </section>

              {/* Contact Before Purchase */}
              <section className="p-6 rounded-xl bg-success/5 border border-success/20">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-success">
                  <Mail className="w-6 h-6" />
                  Questions Before Purchasing?
                </h2>
                <p className="text-muted-foreground mb-4">
                  If you have ANY questions about our services, features, or this refund policy, 
                  please contact us <strong>BEFORE</strong> making a purchase:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>📧 Email: <a href="mailto:support@traderedgepro.com" className="text-primary hover:underline">support@traderedgepro.com</a></li>
                  <li>💬 Live Chat: Available on our website</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  We're happy to answer questions and help you decide if TraderEdge is right for you. 
                  Once you purchase, however, our no-refund policy applies.
                </p>
              </section>

              {/* Final Statement */}
              <div className="text-center p-8 rounded-xl bg-muted/20">
                <p className="text-lg text-muted-foreground">
                  By completing your purchase, you confirm that you have read, understood, and agree to this 
                  Refund Policy and our <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RefundPolicyPage;
