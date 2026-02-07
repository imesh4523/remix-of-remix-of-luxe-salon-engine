import { motion } from 'framer-motion';
import { Store, TrendingUp, Calendar, CreditCard, Users, Shield, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { useAuth } from '@/hooks/useAuth';

const Business = () => {
  const { user, hasRole, loading } = useAuth();

  // Show loading while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  // Only redirect to vendor dashboard if user has ACTUAL vendor role (not admin)
  // Admin should NOT be redirected - they use /main-admin instead
  const hasVendorRole = hasRole('vendor');
  if (user && hasVendorRole) {
    return <Navigate to="/vendor" replace />;
  }

  const benefits = [
    {
      icon: Users,
      title: '50,000+ Active Customers',
      description: 'Reach a growing community of beauty enthusiasts actively looking for services.',
    },
    {
      icon: Calendar,
      title: 'Smart Booking System',
      description: 'Automated scheduling, reminders, and calendar management for your team.',
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Get paid directly to your bank account with transparent commission rates.',
    },
    {
      icon: TrendingUp,
      title: 'Growth Analytics',
      description: 'Track your performance, customer reviews, and revenue in real-time.',
    },
  ];

  const steps = [
    { step: 1, title: 'Apply', description: 'Fill out a quick application form' },
    { step: 2, title: 'Verify', description: 'We review and approve your salon' },
    { step: 3, title: 'Setup', description: 'Add your services and staff' },
    { step: 4, title: 'Earn', description: 'Start receiving bookings!' },
  ];

  return (
    <div className="min-h-screen relative">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/30 backdrop-blur-[2px]" />
        
        {/* Decorative Orbs */}
        <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-violet-400/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-[350px] h-[350px] bg-pink-400/15 rounded-full blur-[80px]" />

        <div className="container relative z-10 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-6"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Partner with Glamour</span>
            </motion.div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Grow Your{' '}
              <span className="gradient-text">Beauty Business</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Join Sri Lanka's fastest-growing salon marketplace. Reach more customers, 
              manage bookings effortlessly, and increase your revenue.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
            >
              <Link to="/auth?mode=signup&role=vendor">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98, y: 2 }}
                  className="relative group gap-2 text-lg px-8 py-4 rounded-xl font-semibold text-white overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)',
                    boxShadow: `
                      0 6px 0 #5b21b6,
                      0 8px 8px rgba(0,0,0,0.15),
                      0 12px 20px rgba(139,92,246,0.3),
                      inset 0 2px 3px rgba(255,255,255,0.3)
                    `,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Apply Now - It's Free
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </motion.button>
              </Link>

              {user && hasVendorRole && (
                <Link to="/vendor">
                  <Button variant="outline" size="lg" className="gap-2">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </motion.div>

            {/* Already a partner link */}
            {!user && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 text-sm text-muted-foreground"
              >
                Already a partner?{' '}
                <Link to="/auth" className="text-primary hover:underline font-medium">
                  Sign in to your dashboard
                </Link>
              </motion.p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />
        <div className="container px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold">
              Why <span className="gradient-text">Partner</span> With Us?
            </h2>
            <p className="text-muted-foreground mt-2">
              Everything you need to run a successful salon business
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="glass-card p-6 rounded-2xl hover:shadow-glow-rose transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-white/40 backdrop-blur-sm" />
        <div className="container px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-muted-foreground mt-2">
              Get started in 4 simple steps
            </p>
          </motion.div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="flex flex-col items-center text-center"
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 text-white font-bold text-xl"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    boxShadow: '0 4px 0 #5b21b6, 0 6px 12px rgba(139,92,246,0.3)',
                  }}
                >
                  {step.step}
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground max-w-[150px]">{step.description}</p>
                
                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <ArrowRight className="hidden md:block h-6 w-6 text-primary/30 absolute translate-x-[100px]" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Info */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
        <div className="container px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card-elevated p-8 md:p-12 rounded-3xl max-w-3xl mx-auto text-center"
          >
            <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">
              Transparent Pricing
            </h2>
            <p className="text-muted-foreground mb-6">
              We only charge a small commission on successful bookings. No hidden fees, no monthly charges.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text">15%</div>
                <div className="text-sm text-muted-foreground">Standard Commission</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text">Rs 0</div>
                <div className="text-sm text-muted-foreground">Monthly Fee</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text">Weekly</div>
                <div className="text-sm text-muted-foreground">Payouts</div>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              {[
                'Free salon profile setup',
                'Unlimited staff & services',
                'Real-time booking notifications',
                'Customer reviews & ratings',
              ].map((feature, i) => (
                <div key={i} className="flex items-center justify-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-white/40 to-accent/5 backdrop-blur-sm" />
        <div className="container px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              Ready to <span className="gradient-text">Get Started</span>?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join hundreds of successful salons already growing their business with Glamour.
            </p>
            <Link to="/auth?mode=signup&role=vendor">
              <Button size="lg" className="gap-2 shadow-glow-rose">
                <Store className="h-5 w-5" />
                Apply Now - It's Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 relative mb-20 md:mb-0">
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm border-t border-white/50" />
        <div className="container px-4 relative z-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-lg font-serif font-bold text-primary-foreground">G</span>
              </div>
              <span className="font-serif text-lg font-semibold gradient-text">Glamour</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Glamour. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <MobileNav />
    </div>
  );
};

export default Business;
