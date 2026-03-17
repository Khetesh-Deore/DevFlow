import { Link } from 'react-router-dom';
import { Code, Zap, Users, Trophy, ArrowRight, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';

const features = [
  { icon: Code, title: 'Monaco Code Editor', description: 'Professional-grade editor with syntax highlighting, auto-completion, and multi-language support.' },
  { icon: Zap, title: 'Real-Time Judging', description: 'Instant feedback on your submissions with detailed test case results and performance metrics.' },
  { icon: Users, title: 'Live Competitions', description: 'Compete with up to 200 participants simultaneously in real-time coding contests.' },
  { icon: Trophy, title: 'Live Leaderboard', description: 'Track your ranking in real-time with dynamic leaderboard updates via WebSocket.' },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(142_71%_45%/0.08),transparent_50%)]" />
        <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 lg:py-36 relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs md:text-sm font-medium mb-4 md:mb-6"
            >
              <Terminal className="h-3.5 w-3.5" />
              Competitive Programming Platform
            </motion.div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-4 md:mb-6">
              Code. Compete.
              <span className="text-gradient"> Conquer.</span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-4">
              DevFlow is a competitive programming platform built for college developers.
              Host contests, solve problems, and climb the leaderboard.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center px-4"
            >
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary px-8 text-base font-semibold w-full sm:w-auto">
                  Start Coding <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="text-base px-8 w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 md:px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 md:mb-4">Built for Developers</h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            Everything you need to host and participate in competitive programming contests.
          </p>
        </motion.div>
        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <motion.div
                whileHover={{ y: -4, borderColor: 'hsl(142 71% 45% / 0.3)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="p-5 md:p-6 rounded-lg border border-border bg-card hover:shadow-lg hover:shadow-primary/5 transition-shadow group h-full"
              >
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base">{feature.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 md:px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center rounded-2xl border border-border bg-card p-8 md:p-12"
        >
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4">Ready to compete?</h2>
          <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">Join DevFlow and start solving problems today.</p>
          <Link to="/register">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 w-full sm:w-auto">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      <footer className="border-t border-border py-6 md:py-8">
        <div className="container mx-auto px-4 md:px-6 text-center text-xs md:text-sm text-muted-foreground">
          © 2026 DevFlow. Built for developers, by developers.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
