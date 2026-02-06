import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Settings } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';

const CookieConsentBanner = () => {
  const { hasConsented, preferences, acceptAll, acceptNecessary, savePreferences } = useCookieConsent();
  const [showSettings, setShowSettings] = useState(false);
  const [localPreferences, setLocalPreferences] = useState(preferences);

  // Don't show if already consented or still loading
  if (hasConsented !== false && hasConsented !== null) return null;

  const handleSavePreferences = () => {
    savePreferences(localPreferences);
    setShowSettings(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      >
        <div className="max-w-4xl mx-auto">
          <div className="glass-card border-primary/20 p-6 shadow-2xl">
            {!showSettings ? (
              /* Main Banner */
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <Cookie className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">We value your privacy</h3>
                    <p className="text-sm text-muted-foreground">
                      We use cookies to enhance your browsing experience and analyze site traffic. 
                      By clicking "Accept All", you consent to our use of cookies.{' '}
                      <Link to="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                    className="flex-1 md:flex-none"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={acceptNecessary}
                    className="flex-1 md:flex-none"
                  >
                    Necessary Only
                  </Button>
                  <Button
                    size="sm"
                    onClick={acceptAll}
                    className="flex-1 md:flex-none bg-primary hover:bg-primary/90"
                  >
                    Accept All
                  </Button>
                </div>
              </div>
            ) : (
              /* Settings Panel */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Cookie Preferences</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSettings(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Necessary Cookies */}
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium text-foreground">Necessary Cookies</p>
                      <p className="text-sm text-muted-foreground">
                        Required for the website to function properly
                      </p>
                    </div>
                    <Switch checked disabled />
                  </div>

                  {/* Analytics Cookies */}
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium text-foreground">Analytics Cookies</p>
                      <p className="text-sm text-muted-foreground">
                        Help us understand how visitors interact with our website
                      </p>
                    </div>
                    <Switch
                      checked={localPreferences.analytics}
                      onCheckedChange={(checked) => 
                        setLocalPreferences(prev => ({ ...prev, analytics: checked }))
                      }
                    />
                  </div>

                  {/* Marketing Cookies */}
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-foreground">Marketing Cookies</p>
                      <p className="text-sm text-muted-foreground">
                        Used to deliver personalized advertisements
                      </p>
                    </div>
                    <Switch
                      checked={localPreferences.marketing}
                      onCheckedChange={(checked) => 
                        setLocalPreferences(prev => ({ ...prev, marketing: checked }))
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowSettings(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSavePreferences}>
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CookieConsentBanner;
