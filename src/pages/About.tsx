import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Shield, Star, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MobileNav from '@/components/MobileNav';

const About = () => {
  const values = [
    {
      icon: Heart,
      title: 'Passion for Beauty',
      description: 'We believe everyone deserves to feel beautiful and confident.',
    },
    {
      icon: Shield,
      title: 'Trust & Safety',
      description: 'All our partner salons are verified and reviewed for quality.',
    },
    {
      icon: Star,
      title: 'Excellence',
      description: 'We curate only the best salons with skilled professionals.',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building connections between clients and beauty professionals.',
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
            <h1 className="font-serif text-xl font-semibold">About Us</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto">
              <span className="text-4xl font-serif font-bold text-primary-foreground">G</span>
            </div>
            <h2 className="font-serif text-3xl font-bold gradient-text">Glamour</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your gateway to the finest beauty experiences in Sri Lanka
            </p>
          </div>

          {/* Story */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="font-serif text-xl font-semibold">Our Story</h3>
            <p className="text-muted-foreground leading-relaxed">
              Glamour was born from a simple idea: connecting people with the best beauty 
              professionals in their area. We noticed how difficult it was to find and book 
              trusted salons, so we created a platform that makes the entire experience seamless.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Today, we partner with hundreds of verified salons across Sri Lanka, helping 
              thousands of customers discover their perfect beauty destination every day.
            </p>
          </div>

          {/* Values */}
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-semibold">Our Values</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-xl p-5 space-y-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <value.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-semibold">{value.title}</h4>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="glass-card rounded-2xl p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">500+</p>
                <p className="text-sm text-muted-foreground">Partner Salons</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">50K+</p>
                <p className="text-sm text-muted-foreground">Happy Customers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">4.8</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <MobileNav />
    </div>
  );
};

export default About;
