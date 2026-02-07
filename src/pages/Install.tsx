import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Share, Plus, Smartphone, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isInStandaloneMode);

    // Listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen pt-16 pb-20 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-6">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h1 className="font-serif text-3xl font-bold mb-4">
              App <span className="gradient-text">Installed!</span>
            </h1>
            <p className="text-muted-foreground">
              ඔබ දැනටමත් app එක install කරලා තියෙනවා.
            </p>
          </motion.div>
        </div>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 pb-24 px-4">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary to-accent p-0.5 mb-6 shadow-glow-rose">
              <div className="w-full h-full rounded-3xl bg-background flex items-center justify-center">
                <span className="text-4xl font-serif font-bold gradient-text">G</span>
              </div>
            </div>
            <h1 className="font-serif text-3xl font-bold mb-3">
              Install <span className="gradient-text">Glamour</span>
            </h1>
            <p className="text-muted-foreground">
              Home screen එකට add කරන්න. App එකක් වගේ use කරන්න පුළුවන්!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card-elevated p-6 mb-6"
          >
            <h2 className="font-serif text-xl font-semibold mb-4">Benefits</h2>
            <div className="space-y-4">
              {[
                { icon: Smartphone, text: 'Home screen එකෙන් open කරන්න' },
                { icon: Download, text: 'Offline mode support' },
                { icon: CheckCircle, text: 'Fast & smooth experience' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Android / Chrome Install */}
          {deferredPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={handleInstall}
                className="w-full gap-2 h-14 text-lg shadow-glow-rose"
              >
                <Download className="h-5 w-5" />
                Install App
              </Button>
            </motion.div>
          )}

          {/* iOS Install Guide */}
          {isIOS && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={() => setShowIOSGuide(true)}
                className="w-full gap-2 h-14 text-lg shadow-glow-rose"
              >
                <Plus className="h-5 w-5" />
                Add to Home Screen
              </Button>

              {showIOSGuide && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end"
                  onClick={() => setShowIOSGuide(false)}
                >
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    className="w-full glass-card-elevated rounded-t-3xl p-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-serif text-xl font-semibold">iOS Install Guide</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowIOSGuide(false)}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-primary font-bold">1</span>
                        </div>
                        <div>
                          <p className="font-medium">Share button tap කරන්න</p>
                          <p className="text-sm text-muted-foreground">
                            Safari browser එකේ පහළ Share icon එක (<Share className="h-4 w-4 inline" />) tap කරන්න
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-primary font-bold">2</span>
                        </div>
                        <div>
                          <p className="font-medium">"Add to Home Screen" select කරන්න</p>
                          <p className="text-sm text-muted-foreground">
                            Menu එකේ scroll down කරලා "Add to Home Screen" option එක තෝරන්න
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-primary font-bold">3</span>
                        </div>
                        <div>
                          <p className="font-medium">"Add" tap කරන්න</p>
                          <p className="text-sm text-muted-foreground">
                            Top right corner එකේ "Add" button එක tap කරන්න
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* No prompt available - show manual instructions */}
          {!deferredPrompt && !isIOS && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-4 text-center"
            >
              <p className="text-muted-foreground text-sm">
                Browser menu එකෙන් "Add to Home Screen" හෝ "Install App" option එක තෝරන්න.
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <MobileNav />
    </div>
  );
};

export default Install;
