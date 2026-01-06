import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, ScanLine, CheckCircle, AlertTriangle, ArrowRight, Zap, Lock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';

export default function Landing() {
  const features = [
    {
      icon: <ScanLine className="h-8 w-8" />,
      title: 'Instant Scanning',
      description: 'Scan QR codes instantly using your camera or upload an image for verification.',
    },
    {
      icon: <Lock className="h-8 w-8" />,
      title: 'Hash-Based Security',
      description: 'Advanced cryptographic hashing ensures tamper-proof product authentication.',
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'Real-Time Results',
      description: 'Get immediate verification results with detailed product information.',
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: 'Global Database',
      description: 'Access a comprehensive database of verified products worldwide.',
    },
  ];

  const stats = [
    { value: '1M+', label: 'Products Verified' },
    { value: '99.9%', label: 'Accuracy Rate' },
    { value: '50K+', label: 'Daily Scans' },
    { value: '100+', label: 'Trusted Brands' },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent-foreground text-sm font-medium border border-accent/30">
                <Shield className="h-4 w-4" />
                AI-Powered Product Authentication
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold font-display text-primary-foreground mb-6 leading-tight"
            >
              Detect Fake Products
              <br />
              <span className="text-accent">Instantly</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto"
            >
              Protect yourself from counterfeit products with our advanced QR-based verification system. 
              Scan, verify, and shop with confidence.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow">
                <Link to="/auth">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/auth">
                  Login
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Floating elements */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="absolute top-1/4 left-10 hidden lg:block"
        >
          <div className="p-4 rounded-xl glass-card">
            <CheckCircle className="h-12 w-12 text-success" />
          </div>
        </motion.div>
        
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-10 hidden lg:block"
        >
          <div className="p-4 rounded-xl glass-card">
            <AlertTriangle className="h-12 w-12 text-danger" />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-bold font-display text-accent mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our advanced verification system ensures product authenticity through 
              cryptographic hash matching.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="p-6 rounded-xl bg-card border border-border hover:border-accent/50 transition-all hover:shadow-lg"
              >
                <div className="w-14 h-14 rounded-lg gradient-primary flex items-center justify-center mb-4 text-primary-foreground">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold font-display text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display text-primary-foreground mb-4">
              Ready to Verify Products?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust AuthentiScan for product verification.
            </p>
            <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90">
              <Link to="/auth">
                Start Scanning Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
