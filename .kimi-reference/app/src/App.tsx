import { useEffect, useRef, useState } from 'react';
import { 
  Zap, 
  Search, 
  Wrench, 
  Shield, 
  Clock, 
  BookOpen, 
  Car,
  Cpu,
  Activity,
  CheckCircle2,
  Star,
  Quote,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Particle Background Component
const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
    }> = [];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha})`;
        ctx.fill();

        // Draw connections
        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 212, 255, ${0.1 * (1 - dist / 150)})`;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'linear-gradient(180deg, #050505 0%, #0a0a0a 100%)' }}
    />
  );
};

// Navigation Component
const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'glass-strong' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-lg animate-pulse-glow" />
              <Cpu className="w-6 h-6 text-cyan-400 relative z-10" />
            </div>
            <span className="font-display font-bold text-xl tracking-wider text-white">
              SPOTON<span className="text-cyan-400">AUTO</span>
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How It Works', 'Testimonials'].map((item) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="font-body text-sm text-gray-300 hover:text-cyan-400 transition-colors relative group"
                whileHover={{ y: -2 }}
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full" />
              </motion.a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <motion.button
              className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              <Car className="w-4 h-4" />
              <span className="font-body text-sm">Parts</span>
            </motion.button>
            <motion.button
              className="btn-cyber"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Login / Sign Up
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-strong border-t border-cyan-500/20"
          >
            <div className="px-4 py-6 space-y-4">
              {['Features', 'How It Works', 'Testimonials'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className="block font-body text-gray-300 hover:text-cyan-400 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <div className="pt-4 border-t border-cyan-500/20 space-y-3">
                <button className="flex items-center gap-2 text-gray-300">
                  <Car className="w-4 h-4" />
                  <span className="font-body">Parts</span>
                </button>
                <button className="btn-cyber w-full">Login / Sign Up</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

// Hero Section
const HeroSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
        setMousePosition({ x: x * 5, y: y * 5 });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 hex-pattern opacity-50" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Status Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass"
            >
              <span className="status-dot" />
              <span className="font-body text-xs tracking-widest text-cyan-400 uppercase">
                AI System Online
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-black text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-tight"
            >
              <span className="text-white">SILENCE THE</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200 glow-text">
                CHECK ENGINE
              </span>
              <br />
              <span className="text-white">LIGHT</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="font-body text-lg sm:text-xl text-gray-400 max-w-lg"
            >
              Instant AI Auto Repair. Diagnose problems and get step-by-step fix guides in seconds.
            </motion.p>

            {/* Trust Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 border-2 border-void flex items-center justify-center"
                  >
                    <span className="text-xs font-bold text-white">{i}</span>
                  </div>
                ))}
              </div>
              <span className="font-body text-sm text-cyan-400">
                Trusted by <span className="font-bold text-white">50,000+</span> DIY Mechanics
              </span>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-4 pt-4"
            >
              <motion.button
                className="btn-cyber-primary flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Zap className="w-4 h-4" />
                Start Free Diagnosis
              </motion.button>
              <motion.button
                className="btn-cyber flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Search className="w-4 h-4" />
                Find Repair Guide
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Right Content - Configuration Panel */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, x: 50, rotateY: 15 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              transform: `perspective(1000px) rotateY(${mousePosition.x}deg) rotateX(${-mousePosition.y}deg)`,
            }}
            className="relative"
          >
            <div className="glass rounded-2xl p-6 sm:p-8 border border-cyan-500/30 glow-border">
              {/* Panel Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display font-bold text-xl text-white">
                    Configuration Panel
                  </h3>
                  <p className="font-body text-sm text-gray-400 mt-1">
                    Select vehicle parameters to calibrate the deep-scan neural network
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                </div>
              </div>

              {/* Step Indicator */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="font-body text-xs tracking-widest text-cyan-400 uppercase">
                  Step 1: Identification
                </span>
              </div>

              {/* VIN Input */}
              <div className="mb-6">
                <label className="font-body text-xs tracking-widest text-gray-400 uppercase mb-2 block">
                  Quick Scan (VIN)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ENTER VIN NUMBER"
                    className="flex-1 font-body text-sm uppercase tracking-wider"
                  />
                  <button className="btn-cyber px-4 py-2 text-xs">
                    DECODE
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                <span className="font-body text-xs text-gray-500 uppercase">or Manual Entry</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
              </div>

              {/* Vehicle Selectors */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <select className="font-body text-sm">
                  <option>Year</option>
                  {Array.from({ length: 48 }, (_, i) => 2027 - i).map((year) => (
                    <option key={year}>{year}</option>
                  ))}
                </select>
                <select className="font-body text-sm">
                  <option>Make</option>
                  <option>Toyota</option>
                  <option>Honda</option>
                  <option>Ford</option>
                  <option>Chevrolet</option>
                  <option>BMW</option>
                </select>
                <select className="font-body text-sm">
                  <option>Model</option>
                </select>
              </div>

              {/* Symptom Input */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Describe symptom (e.g. 'Squeaky Brakes')"
                  className="w-full font-body text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  className="btn-cyber flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Zap className="w-4 h-4" />
                  <span className="text-xs">START AI DIAGNOSIS</span>
                </motion.button>
                <motion.button
                  className="btn-cyber-primary flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Search className="w-4 h-4" />
                  <span className="text-xs">FIND REPAIR GUIDE</span>
                </motion.button>
              </div>

              {/* Status Display */}
              <div className="mt-6 p-4 rounded-lg bg-black/40 border border-cyan-500/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-body text-xs text-gray-500 uppercase tracking-widest">
                    Awaiting Input
                  </span>
                  <span className="font-body text-xs text-cyan-400 animate-text-flicker">
                    NO SIGNAL DETECTED
                  </span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full w-0 bg-gradient-to-r from-cyan-500 to-cyan-300" />
                </div>
              </div>
            </div>

            {/* Floating Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -bottom-4 -right-4 glass rounded-xl p-4 border border-cyan-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <div className="font-display font-bold text-2xl text-white">98.4%</div>
                  <div className="font-body text-xs text-gray-400 uppercase tracking-wider">
                    Accuracy Rate
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Features Section
const FeaturesSection = () => {
  const features = [
    {
      icon: Activity,
      title: '98.4% Accuracy',
      description: 'Trained on millions of repair records and factory service manuals for precise diagnostics.',
      stat: '10M+',
      statLabel: 'Repairs Analyzed',
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'No waiting for a mechanic\'s opinion. Get AI-powered diagnoses in under 30 seconds.',
      stat: '<30s',
      statLabel: 'Avg. Response',
    },
    {
      icon: BookOpen,
      title: 'Factory Manuals',
      description: 'Access OEM specifications, torque values, and step-by-step procedures instantly.',
      stat: '50K+',
      statLabel: 'Manuals Available',
    },
  ];

  return (
    <section id="features" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="font-body text-xs tracking-[0.3em] text-cyan-400 uppercase mb-4 block">
            Why Choose Us
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
            WHY <span className="text-cyan-400">SPOTON</span> AUTO?
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto" />
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="group"
            >
              <div className="glass rounded-2xl p-8 h-full card-hover border border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-500">
                {/* Icon */}
                <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 bg-cyan-500/20 rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-cyan-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <feature.icon className="w-8 h-8 text-cyan-400" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-display font-bold text-xl text-white mb-3">
                  {feature.title}
                </h3>
                <p className="font-body text-gray-400 mb-6">
                  {feature.description}
                </p>

                {/* Stat */}
                <div className="flex items-center gap-2 pt-4 border-t border-cyan-500/10">
                  <span className="font-display font-bold text-2xl text-cyan-400">
                    {feature.stat}
                  </span>
                  <span className="font-body text-xs text-gray-500 uppercase tracking-wider">
                    {feature.statLabel}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Connecting Line SVG */}
        <svg
          className="absolute top-1/2 left-0 w-full h-2 -translate-y-1/2 hidden lg:block pointer-events-none"
          style={{ zIndex: -1 }}
        >
          <motion.path
            d="M 200 0 Q 400 0 600 0 Q 800 0 1000 0 Q 1200 0 1400 0"
            stroke="url(#gradient)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 0.3 }}
            viewport={{ once: true }}
            transition={{ duration: 2, delay: 0.5 }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity="0" />
              <stop offset="50%" stopColor="#00d4ff" stopOpacity="1" />
              <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </section>
  );
};

// How It Works Section
const HowItWorksSection = () => {
  const steps = [
    {
      number: '01',
      title: 'IDENTIFY',
      description: 'Enter your VIN or select your vehicle make, model, and year from our comprehensive database.',
      icon: Car,
    },
    {
      number: '02',
      title: 'DESCRIBE',
      description: 'Tell us the symptoms you\'re experiencing. The more details, the better the diagnosis.',
      icon: Activity,
    },
    {
      number: '03',
      title: 'DIAGNOSE',
      description: 'Our AI analyzes millions of repair records to identify the most likely cause.',
      icon: Cpu,
    },
    {
      number: '04',
      title: 'REPAIR',
      description: 'Get your step-by-step repair guide with parts list, tools needed, and estimated time.',
      icon: Wrench,
    },
  ];

  return (
    <section id="how-it-works" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 hex-pattern opacity-20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[200px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="font-body text-xs tracking-[0.3em] text-cyan-400 uppercase mb-4 block">
            The Process
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
            HOW IT <span className="text-cyan-400">WORKS</span>
          </h2>
          <p className="font-body text-gray-400 max-w-2xl mx-auto">
            From diagnosis to repair in four simple steps. Our AI guides you through the entire process.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              className="relative"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-px">
                  <div className="w-full h-full bg-gradient-to-r from-cyan-500/50 to-transparent" />
                  <motion.div
                    initial={{ x: '-100%' }}
                    whileInView={{ x: '100%' }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.3 + 0.5, duration: 1 }}
                    className="absolute top-0 left-0 w-4 h-full bg-cyan-400 blur-sm"
                  />
                </div>
              )}

              <div className="glass rounded-2xl p-6 h-full border border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-500 group">
                {/* Step Number */}
                <div className="flex items-center justify-between mb-6">
                  <span className="font-display font-black text-4xl text-cyan-400/30 group-hover:text-cyan-400/60 transition-colors animate-text-flicker">
                    {step.number}
                  </span>
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                    <step.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-display font-bold text-lg text-white mb-2">
                  {step.title}
                </h3>
                <p className="font-body text-sm text-gray-400">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Testimonials Section
const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "Saved me $400 on a diagnostic fee! The AI pinpointed the exact issue with my oxygen sensor.",
      author: "Mike T.",
      role: "DIY Enthusiast",
      rating: 5,
    },
    {
      quote: "Fixed my brakes in 30 minutes. The step-by-step guide was incredibly detailed and easy to follow.",
      author: "Sarah K.",
      role: "First-time Mechanic",
      rating: 5,
    },
    {
      quote: "The AI knew exactly what was wrong. Even my mechanic was impressed with the accuracy.",
      author: "James R.",
      role: "Car Owner",
      rating: 5,
    },
    {
      quote: "Best automotive tool I've ever used. Worth every penny for the peace of mind alone.",
      author: "David L.",
      role: "Fleet Manager",
      rating: 5,
    },
    {
      quote: "Diagnosed a transmission issue that two shops couldn't figure out. Absolutely incredible.",
      author: "Emily W.",
      role: "Auto Shop Owner",
      rating: 5,
    },
    {
      quote: "The parts comparison feature alone saved me $200 on my last repair. Game changer!",
      author: "Chris M.",
      role: "Weekend Warrior",
      rating: 5,
    },
  ];

  return (
    <section id="testimonials" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="font-body text-xs tracking-[0.3em] text-cyan-400 uppercase mb-4 block">
            Social Proof
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
            WHAT <span className="text-cyan-400">MECHANICS</span> SAY
          </h2>
        </motion.div>

        {/* Marquee Container */}
        <div className="space-y-6 overflow-hidden">
          {/* Row 1 - Left */}
          <div className="relative">
            <div className="flex gap-6 animate-marquee-left hover:[animation-play-state:paused]">
              {[...testimonials.slice(0, 3), ...testimonials.slice(0, 3)].map((testimonial, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-[350px] glass rounded-xl p-6 border border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300 hover:scale-105"
                >
                  <Quote className="w-8 h-8 text-cyan-400/30 mb-4" />
                  <p className="font-body text-gray-300 mb-4">{testimonial.quote}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center">
                      <span className="font-display font-bold text-sm text-white">
                        {testimonial.author[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-body font-semibold text-white text-sm">
                        {testimonial.author}
                      </div>
                      <div className="font-body text-xs text-gray-500">{testimonial.role}</div>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-cyan-400 text-cyan-400" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2 - Right */}
          <div className="relative">
            <div className="flex gap-6 animate-marquee-right hover:[animation-play-state:paused]">
              {[...testimonials.slice(3, 6), ...testimonials.slice(3, 6)].map((testimonial, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-[350px] glass rounded-xl p-6 border border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300 hover:scale-105"
                >
                  <Quote className="w-8 h-8 text-cyan-400/30 mb-4" />
                  <p className="font-body text-gray-300 mb-4">{testimonial.quote}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center">
                      <span className="font-display font-bold text-sm text-white">
                        {testimonial.author[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-body font-semibold text-white text-sm">
                        {testimonial.author}
                      </div>
                      <div className="font-body text-xs text-gray-500">{testimonial.role}</div>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-cyan-400 text-cyan-400" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// CTA Section
const CTASection = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white mb-6">
            READY TO FIX
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200 glow-text">
              YOUR RIDE?
            </span>
          </h2>
          <p className="font-body text-lg text-gray-400 mb-10 max-w-xl mx-auto">
            Join 50,000+ DIY mechanics who trust SpotOn Auto for accurate diagnoses and step-by-step repair guides.
          </p>

          {/* CTA Button */}
          <motion.div
            className="relative inline-block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Shockwave Effect */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 rounded-xl border-2 border-cyan-400"
                />
              )}
            </AnimatePresence>

            <motion.button
              className="relative btn-cyber-primary text-lg px-10 py-5 flex items-center gap-3 glow-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap className="w-6 h-6" />
              <span className="font-display font-bold tracking-wider">
                {isHovered ? 'GO!' : 'START AI DIAGNOSIS'}
              </span>
              <ArrowRight className="w-6 h-6" />
            </motion.button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-10"
          >
            <div className="flex items-center gap-2 text-gray-400">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span className="font-body text-sm">100% Free to Try</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span className="font-body text-sm">Results in 30 Seconds</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              <span className="font-body text-sm">No Credit Card Required</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

// Footer
const Footer = () => {
  return (
    <footer className="relative py-12 border-t border-cyan-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-cyan-400" />
            <span className="font-display font-bold text-lg tracking-wider text-white">
              SPOTON<span className="text-cyan-400">AUTO</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a href="#" className="font-body text-sm text-gray-400 hover:text-cyan-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="font-body text-sm text-gray-400 hover:text-cyan-400 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="font-body text-sm text-gray-400 hover:text-cyan-400 transition-colors">
              Contact
            </a>
          </div>

          {/* Copyright */}
          <div className="font-body text-sm text-gray-500">
            © 2026 SpotOn Auto. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main App Component
function App() {
  return (
    <div className="relative min-h-screen bg-void text-white overflow-x-hidden">
      {/* Background Effects */}
      <ParticleBackground />
      <div className="noise-overlay" />
      <div className="scanline" />

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
