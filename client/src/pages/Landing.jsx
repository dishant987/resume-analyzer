import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Sparkles, FileText, ArrowRight, CheckCircle2, ShieldCheck, Zap, Star, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useAuth } from '../lib/auth-context'

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.12 } }
}

const steps = [
  {
    icon: Upload,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    title: 'Upload Resume',
    desc: 'Drag and drop your PDF or DOCX file. Our secure parser extracts text formatting and sections instantly.',
    stepNum: '01'
  },
  {
    icon: Sparkles,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    title: 'Multi-Dimension Analysis',
    desc: 'Our AI model analyzes your resume across 6 key hiring criteria, scoring compatibility and finding hidden issues.',
    stepNum: '02'
  },
  {
    icon: FileText,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    title: 'Side-by-Side Optimization',
    desc: 'Accept or edit AI suggestions side-by-side. Clean up wording, fix grammar, and export a polished resume.',
    stepNum: '03'
  },
]

export default function Landing() {
  const { user, loading } = useAuth()
  const [isOptimized, setIsOptimized] = useState(true)
  const [isScanning, setIsScanning] = useState(false)

  const triggerScan = () => {
    setIsScanning(true)
    setTimeout(() => {
      setIsScanning(false)
      setIsOptimized(true)
    }, 1800)
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden transition-colors duration-300">

      {/* Decorative Aurora Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern -z-10 opacity-70" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-25%] left-[5%] w-[45%] aspect-square rounded-full bg-blue-500/10 blur-[150px] dark:bg-blue-500/5 animate-pulse" />
        <div className="absolute top-[-15%] right-[5%] w-[40%] aspect-square rounded-full bg-violet-500/10 blur-[150px] dark:bg-violet-500/5" />
        <div className="absolute top-[40%] left-[25%] w-[30%] aspect-square rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      </div>

      {/* Floating Keyword Particles in Background */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none -z-5">
        {[
          { text: 'React 19', top: '18%', left: '10%', delay: 0 },
          { text: 'CI/CD Pipelines', top: '25%', right: '12%', delay: 1.5 },
          { text: 'TypeScript', top: '48%', left: '6%', delay: 0.8 },
          { text: 'Agile Roadmaps', top: '55%', right: '8%', delay: 2.2 },
          { text: 'Python / ML', top: '78%', left: '12%', delay: 1.2 },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0.2, y: 0 }}
            animate={{ 
              opacity: [0.2, 0.5, 0.2], 
              y: [-12, 12, -12] 
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: item.delay
            }}
            className="absolute px-3.5 py-1.5 rounded-full border border-border bg-card/40 backdrop-blur-xs text-xs font-semibold text-muted-foreground shadow-xs"
            style={{ top: item.top, left: item.left, right: item.right }}
          >
            {item.text}
          </motion.div>
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-20 md:pt-32 md:pb-28 max-w-6xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <span 
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-bold text-primary mb-8 shadow-xs hover:border-primary/30 transition-colors"
              style={{ backgroundColor: 'color-mix(in srgb, var(--card) 60%, transparent)' }}
            >
              <Star className="h-3 w-3 fill-primary text-primary" />
              Powered by Gemini 2.5 Flash
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] md:leading-[1.05]"
          >
            Optimize your resume for
            <br />
            <span className="bg-gradient-to-r from-blue-500 via-violet-500 to-indigo-600 bg-clip-text text-transparent drop-shadow-xs">
              maximum ATS impact
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            ResuLens scans your resume for critical keyword gaps, structural issues, and formatting errors. Get an instant score and implement side-by-side AI rewrites.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 px-4"
          >
            {!loading && user ? (
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/35 transition-all text-base py-6 px-8 rounded-full">
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5 ml-1" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/35 transition-all text-base py-6 px-8 rounded-full">
                    Analyze My Resume
                    <ArrowRight className="h-5 w-5 ml-1" />
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-base py-6 px-8 rounded-full">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </motion.div>
        </div>

        {/* Interactive Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-20 md:mt-28 mb-6">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Interactive Sandbox:</span>
          <div className="inline-flex bg-secondary/80 p-1.5 rounded-full border border-border shadow-xs backdrop-blur-md">
            <button
              onClick={() => { setIsOptimized(false); setIsScanning(false) }}
              className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${!isOptimized && !isScanning
                  ? 'bg-card text-foreground shadow-sm border border-border/20 scale-105'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Original Resume
            </button>
            <button
              onClick={() => { setIsOptimized(true); setIsScanning(false) }}
              className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${isOptimized && !isScanning
                  ? 'bg-card text-foreground shadow-sm border border-border/20 scale-105'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Optimized by AI
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={triggerScan}
            disabled={isScanning}
            className="rounded-full gap-1.5 cursor-pointer text-xs font-bold px-4 py-5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            Run Live Simulation
          </Button>
        </div>

        {/* Live Preview Mockup Container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative border border-border/80 rounded-3xl shadow-2xl overflow-hidden max-w-5xl mx-auto border-t-white/10"
          style={{ 
            backgroundColor: 'color-mix(in srgb, var(--card) 60%, transparent)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
          }}
        >
          {/* Mockup Toolbar */}
          <div className="h-12 border-b border-border/60 bg-muted/40 flex items-center px-5 justify-between">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <div className="w-3 h-3 rounded-full bg-green-400/80" />
            </div>
            <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 font-mono">
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
              resulens-dashboard_live.png
            </div>
            <div className="w-10" />
          </div>

          {/* Scanning Overlay */}
          <AnimatePresence mode="wait">
            {isScanning ? (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center z-20"
              >
                <div className="relative h-16 w-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
                  <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" />
                </div>
                <p className="font-bold text-base text-foreground">Analyzing structure & grammar...</p>
                <p className="text-xs text-muted-foreground mt-1">Checking ATS section standards</p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Mockup Content Grid */}
          <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Middle Column (Score & Recommendations) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Score Widget */}
              <div className="border border-border/60 rounded-2xl p-6 bg-background/50 backdrop-blur-xs relative overflow-hidden transition-all duration-300">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-foreground">ATS Compatibility Score</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Scanned against global recruitment parsers</p>
                  </div>
                  <motion.span
                    key={isOptimized ? 'opt-score' : 'orig-score'}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`text-3xl font-black transition-colors duration-300 ${isOptimized ? 'text-emerald-500' : 'text-destructive'}`}
                  >
                    {isOptimized ? '96/100' : '48/100'}
                  </motion.span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden border border-border/20">
                  <motion.div
                    initial={{ width: '48%' }}
                    animate={{ width: isOptimized ? '96%' : '48%' }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`h-full rounded-full transition-colors duration-300 ${isOptimized ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-destructive to-red-400'}`}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed font-medium transition-all">
                  {isOptimized
                    ? '✓ Exceptional compatibility. Sections are standard, language uses active metrics-driven phrasing, and skills keywords are properly represented.'
                    : '⚠ Red flag: resume lacks active, metric-driven achievements. Keywords match rate is below optimal hiring levels.'
                  }
                </p>
              </div>

              {/* Keyword Recommendations */}
              <div className="border border-border/60 rounded-2xl p-6 bg-background/50 backdrop-blur-xs space-y-4">
                <h4 className="font-bold text-sm text-foreground">Recommended Skill Keywords</h4>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { text: 'React Context', opt: true },
                    { text: 'TypeScript', opt: true },
                    { text: 'CI/CD Pipelines', opt: true },
                    { text: 'GraphQL', opt: false },
                    { text: 'Microservices', opt: false },
                  ].map((tag) => (
                    <motion.span
                      key={tag.text}
                      layout
                      className={`text-xs px-3.5 py-1.5 rounded-xl font-bold border flex items-center gap-1.5 transition-all ${isOptimized
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : tag.opt
                            ? 'bg-destructive/10 text-destructive border-destructive/20'
                            : 'bg-secondary text-muted-foreground border-border/40'
                        }`}
                    >
                      {isOptimized ? '✓' : tag.opt ? '✗' : '+'} {tag.text}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Sample Bullet Comparison */}
              <div className="border border-border/60 rounded-2xl p-6 bg-background/50 backdrop-blur-xs space-y-3">
                <h4 className="font-bold text-sm text-foreground">Experience Bullet Point</h4>
                <AnimatePresence mode="wait">
                  {isOptimized ? (
                    <motion.div
                      key="opt-bullet"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-xs text-foreground bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4 font-semibold leading-relaxed"
                    >
                      💡 Designed and pioneered responsive user dashboards using React Context and TypeScript, increasing search speed by 42% and boosting daily active session count.
                    </motion.div>
                  ) : (
                    <motion.div
                      key="orig-bullet"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-xs text-muted-foreground bg-destructive/5 border border-destructive/15 rounded-xl p-4 leading-relaxed font-medium"
                    >
                      ⚠️ I was responsible for working on the main front-end screen using react. I also did some typing stuff and helped the database guys.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column: Mini Checklist */}
            <div className="border border-border/60 rounded-2xl p-6 bg-background/50 backdrop-blur-xs flex flex-col justify-between space-y-6">
              <div>
                <h3 className="font-bold text-sm text-foreground mb-4">ATS Compliance Checks</h3>
                <ul className="space-y-3.5">
                  {[
                    { text: 'Standard single-column format', check: true },
                    { text: 'No complex tables or graphics', check: true },
                    { text: 'Contains active email address', check: true },
                    { text: 'Skills section correctly parsed', check: false },
                    { text: 'Quantitative experience points', check: false },
                  ].map((item, idx) => {
                    const pass = isOptimized ? true : item.check
                    return (
                      <li key={idx} className="flex items-start gap-2.5 text-xs">
                        {pass ? (
                          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <span className={pass ? "text-muted-foreground" : "text-foreground font-semibold"}>
                          {item.text}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
              <div className="pt-5 border-t border-border/60">
                <div className="text-xs text-muted-foreground mb-3 font-semibold">Ready to improve?</div>
                <Link to={!loading && user ? "/dashboard" : "/signup"} className="block w-full">
                  <div className="w-full text-center py-3 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:opacity-90 shadow-md shadow-primary/20 transition-all cursor-pointer">
                    {!loading && user ? "Go to Dashboard" : "Optimize My Resume"}
                  </div>
                </Link>
              </div>
            </div>

          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="border-y border-border bg-secondary/20 px-4 py-24 transition-colors duration-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Engineered for your career success</h2>
            <p className="mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
              ResuLens simplifies the tedious work of resume alignment, parsing metrics, and wording optimization.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: 'ATS-Friendly Formats',
                desc: 'Rest easy knowing your exported PDFs and DOCX follow standard layouts that parsers can parse correctly without loss of content.'
              },
              {
                icon: Zap,
                title: 'Instant Actionable Scores',
                desc: 'Detailed breakdown across 6 components including Projects, Experience, and Grammar, so you know exactly where to make adjustments.'
              },
              {
                icon: Sparkles,
                title: 'Intelligent AI Rewriting',
                desc: 'Powered by advanced language models to offer professional, context-rich wording modifications tailored to your specific field.'
              }
            ].map((feat, idx) => (
              <div key={idx} className="border border-border/60 rounded-2xl bg-card p-8 shadow-xs hover:shadow-lg hover:border-border transition-all duration-300 group">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <feat.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-3 group-hover:text-primary transition-colors">{feat.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="px-4 py-24 max-w-6xl mx-auto">

        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">How ResuLens works</h2>
          <p className="mt-3.5 text-muted-foreground text-sm sm:text-base">Three simple steps to elevate your professional profile.</p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid gap-8 md:grid-cols-3"
        >
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              variants={fadeUp}
              className="relative border border-border/60 rounded-2xl bg-card p-8 hover:shadow-lg hover:border-border transition-all duration-300 group overflow-hidden"
            >
              {/* Step indicator absolute text */}
              <div className="absolute top-4 right-6 text-4xl sm:text-5xl font-black text-foreground/5 select-none font-mono">
                {step.stepNum}
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border ${step.color} group-hover:scale-110 transition-transform`}>
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-3">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Bottom CTA */}
      <section className="relative px-4 py-24 text-center max-w-5xl mx-auto border-t border-border/80">
        {/* Glow behind card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[450px] aspect-square rounded-full bg-primary/10 blur-[100px] pointer-events-none -z-10" />

        <div className="relative z-10 bg-gradient-to-br from-card to-secondary/40 rounded-3xl p-10 sm:p-16 border border-border/80 shadow-xl max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">Start optimizing for free</h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto mb-10 leading-relaxed">
            Gain immediate insight into how recruiters and algorithms view your resume. Build your edge today.
          </p>
          <Link to={!loading && user ? "/dashboard" : "/signup"}>
            <Button size="lg" className="shadow-lg shadow-primary/25 rounded-full py-6 px-8 text-base font-bold">
              {!loading && user ? "Go to Dashboard" : "Upload Resume Now"}
              <ArrowRight className="h-5 w-5 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 px-4 py-10 text-center text-xs text-muted-foreground bg-card transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>ResuLens &mdash; Professional AI-powered resume analysis.</div>
          <div className="flex gap-6 font-medium">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
