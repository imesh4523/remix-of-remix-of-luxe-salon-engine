import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MobileNav from '@/components/MobileNav';

const Terms = () => {
  const sections = [
    {
      title: 'Acceptance of Terms',
      content: `By accessing or using the Glamour application, you agree to be bound by these Terms of Service. 
      If you do not agree to these terms, please do not use our services.`,
    },
    {
      title: 'Use of Services',
      content: `You may use our services only for lawful purposes and in accordance with these Terms. 
      You agree not to use our services in any way that violates any applicable laws or regulations.`,
    },
    {
      title: 'Account Registration',
      content: `To use certain features of our services, you must register for an account. You are responsible 
      for maintaining the confidentiality of your account credentials and for all activities under your account.`,
    },
    {
      title: 'Bookings & Payments',
      content: `When you make a booking through Glamour, you agree to pay the specified price for the service. 
      Cancellation policies vary by salon and will be displayed at the time of booking.`,
    },
    {
      title: 'Salon Partners',
      content: `Glamour acts as an intermediary between you and salon partners. We are not responsible for 
      the quality of services provided by salons, though we work to maintain high standards among our partners.`,
    },
    {
      title: 'User Content',
      content: `You may submit reviews and ratings for salons. You retain ownership of your content but grant 
      us a license to use, display, and distribute it in connection with our services.`,
    },
    {
      title: 'Intellectual Property',
      content: `The Glamour app, including its content, features, and functionality, is owned by us and is 
      protected by copyright, trademark, and other intellectual property laws.`,
    },
    {
      title: 'Limitation of Liability',
      content: `To the maximum extent permitted by law, Glamour shall not be liable for any indirect, incidental, 
      special, consequential, or punitive damages arising from your use of our services.`,
    },
    {
      title: 'Changes to Terms',
      content: `We may update these Terms from time to time. We will notify you of any changes by posting the 
      new Terms on this page and updating the "Last updated" date.`,
    },
    {
      title: 'Contact',
      content: `If you have any questions about these Terms of Service, please contact us at legal@glamour.lk 
      or through our Contact page.`,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-card border-b border-border/50 pt-safe">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-serif text-xl font-semibold">Terms of Service</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Intro */}
          <div className="glass-card rounded-2xl p-6">
            <p className="text-muted-foreground">
              Last updated: February 1, 2026
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Welcome to Glamour. These Terms of Service govern your use of our mobile application and services. 
              Please read them carefully before using our platform.
            </p>
          </div>

          {/* Sections */}
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card rounded-xl p-5 space-y-3"
            >
              <h3 className="font-semibold text-lg">{section.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{section.content}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <MobileNav />
    </div>
  );
};

export default Terms;
