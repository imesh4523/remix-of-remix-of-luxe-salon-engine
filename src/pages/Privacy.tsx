import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MobileNav from '@/components/MobileNav';

const Privacy = () => {
  const sections = [
    {
      title: 'Information We Collect',
      content: `We collect information you provide directly to us, such as when you create an account, 
      make a booking, or contact us for support. This includes your name, email address, phone number, 
      and payment information.`,
    },
    {
      title: 'How We Use Your Information',
      content: `We use the information we collect to provide, maintain, and improve our services, 
      process transactions, send you booking confirmations, and communicate with you about promotions 
      and updates.`,
    },
    {
      title: 'Information Sharing',
      content: `We share your information with salon partners only when necessary to fulfill your bookings. 
      We do not sell your personal information to third parties.`,
    },
    {
      title: 'Data Security',
      content: `We implement appropriate security measures to protect your personal information against 
      unauthorized access, alteration, disclosure, or destruction.`,
    },
    {
      title: 'Your Rights',
      content: `You have the right to access, correct, or delete your personal information. You can update 
      your account information at any time through the app settings.`,
    },
    {
      title: 'Cookies & Tracking',
      content: `We use cookies and similar technologies to enhance your experience, analyze usage patterns, 
      and personalize content. You can manage cookie preferences in your browser settings.`,
    },
    {
      title: 'Contact Us',
      content: `If you have any questions about this Privacy Policy, please contact us at privacy@glamour.lk 
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
            <h1 className="font-serif text-xl font-semibold">Privacy Policy</h1>
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
              At Glamour, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our mobile application and services.
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

export default Privacy;
