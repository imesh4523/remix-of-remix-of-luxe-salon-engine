import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, Mail, Phone, FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import MobileNav from '@/components/MobileNav';

const Help = () => {
  const faqs = [
    {
      question: 'How do I book an appointment?',
      answer: 'Browse salons on the Explore page, select a salon, choose a service, pick a stylist, select your preferred date and time, then confirm your booking.',
    },
    {
      question: 'Can I cancel my booking?',
      answer: 'Yes, you can cancel bookings up to 24 hours before the appointment time. Go to My Bookings and select the booking you want to cancel.',
    },
    {
      question: 'How do I become a vendor?',
      answer: 'Contact us through the support channels below to register your salon on our platform. We\'ll guide you through the onboarding process.',
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept all major credit/debit cards (Visa, Mastercard, Amex). Cash payments can be made directly at the salon.',
    },
    {
      question: 'How do I leave a review?',
      answer: 'After your appointment is completed, you\'ll receive a notification to rate your experience. You can also leave reviews from your booking history.',
    },
  ];

  const supportOptions = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team',
      action: 'Start Chat',
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'support@glamour.lk',
      action: 'Send Email',
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: '+94 11 234 5678',
      action: 'Call Now',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-card border-b border-border/50 pt-safe">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/profile">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-serif text-xl font-semibold">Help & Support</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Support Options */}
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Contact Support</h2>
            {supportOptions.map((option, index) => (
              <motion.div
                key={option.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <option.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{option.title}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1">
                    {option.action}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* FAQs */}
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Frequently Asked Questions</h2>
            <div className="glass-card rounded-xl overflow-hidden">
              <Accordion type="single" collapsible>
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-border/50">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          {/* Docs Link */}
          <Link to="/terms" className="block">
            <Button variant="outline" className="w-full gap-2 glass-button">
              <FileText className="h-4 w-4" />
              Terms & Privacy Policy
            </Button>
          </Link>
        </motion.div>
      </div>

      <MobileNav />
    </div>
  );
};

export default Help;
