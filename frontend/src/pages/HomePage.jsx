import { Link } from 'react-router-dom';
import { Code2, Trophy, Users, Zap, CheckCircle, Lock, Timer, BarChart3, BookOpen, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-fade-in">
              DevFlow
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
              Master Competitive Programming
            </p>
            <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
              Practice problems, compete in live contests, and track your progress. Built for college students who want to excel in coding competitions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link to="/problems" className="bg-blue-600 px-8 py-4 rounded-lg hover:bg-blue-700 font-semibold text-lg transition-colors shadow-lg shadow-blue-600/30">
                Start Solving Problems
              </Link>
              <Link to="/contests" className="bg-gray-800 px-8 py-4 rounded-lg hover:bg-gray-700 font-semibold text-lg transition-colors border border-gray-700">
                View Live Contests
              </Link>
            </div>
            
            {/* Scroll indicator */}
            {/* <div className="flex flex-col items-center gap-2 text-gray-500 animate-bounce">
              <span className="text-xs uppercase tracking-wider">Scroll to explore</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div> */}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      {/* <section className="py-20 border-y border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 text-lg">Get started in three simple steps</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            
            <div className="relative">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 hover:border-blue-600/50 transition-colors h-full">
                <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <span className="text-3xl font-bold text-blue-400">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center">Create Account</h3>
                <p className="text-gray-400 text-center">Sign up with your college email and create your profile. It's free and takes less than a minute.</p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600" />
            </div>

            <div className="relative">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 hover:border-purple-600/50 transition-colors h-full">
                <div className="w-16 h-16 bg-purple-600/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <span className="text-3xl font-bold text-purple-400">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center">Practice & Learn</h3>
                <p className="text-gray-400 text-center">Browse hundreds of problems, write code in your favorite language, and get instant feedback.</p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600" />
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 hover:border-pink-600/50 transition-colors h-full">
              <div className="w-16 h-16 bg-pink-600/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-3xl font-bold text-pink-400">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">Compete & Win</h3>
              <p className="text-gray-400 text-center">Join live contests, climb the leaderboard, and showcase your skills to potential employers.</p>
            </div>

          </div>
        </div>
      </section> */}

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Platform Features</h2>
            <p className="text-gray-400 text-lg">Everything you need to become a competitive programmer</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-600/50 transition-colors">
              <div className="w-12 h-12 bg-blue-600/10 rounded-lg flex items-center justify-center mb-4">
                <Code2 className="text-blue-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multi-Language Support</h3>
              <p className="text-gray-400">Write code in Python, C++, C, Java, or JavaScript with syntax highlighting and auto-completion.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-purple-600/50 transition-colors">
              <div className="w-12 h-12 bg-purple-600/10 rounded-lg flex items-center justify-center mb-4">
                <Trophy className="text-purple-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Live Contests</h3>
              <p className="text-gray-400">Participate in timed contests with real-time leaderboards and instant feedback on submissions.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-pink-600/50 transition-colors">
              <div className="w-12 h-12 bg-pink-600/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="text-pink-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
              <p className="text-gray-400">Track your solved problems, contest ratings, and submission history with detailed analytics.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-green-600/50 transition-colors">
              <div className="w-12 h-12 bg-green-600/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="text-green-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Judging</h3>
              <p className="text-gray-400">Get immediate feedback on your code with our fast and reliable online judge system.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-orange-600/50 transition-colors">
              <div className="w-12 h-12 bg-orange-600/10 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="text-orange-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Problem Library</h3>
              <p className="text-gray-400">Access hundreds of problems categorized by difficulty, tags, and topics with detailed explanations.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-red-600/50 transition-colors">
              <div className="w-12 h-12 bg-red-600/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="text-red-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Leaderboards</h3>
              <p className="text-gray-400">Compete with peers and climb the global leaderboard based on your performance.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Contest Features */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Contest Features</h2>
            <p className="text-gray-400 text-lg">Fair and secure competitive environment</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center shrink-0">
                <Lock className="text-blue-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Copy-Paste Protection</h3>
                <p className="text-gray-400 text-sm">Copy-paste is disabled during live contests to ensure fair competition.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-purple-600/10 rounded-lg flex items-center justify-center shrink-0">
                <Timer className="text-purple-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Real-Time Timer</h3>
                <p className="text-gray-400 text-sm">Live countdown timer with visual alerts as the contest deadline approaches.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-pink-600/10 rounded-lg flex items-center justify-center shrink-0">
                <CheckCircle className="text-pink-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Instant Verdicts</h3>
                <p className="text-gray-400 text-sm">Get immediate feedback on submissions with detailed test case results.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-green-600/10 rounded-lg flex items-center justify-center shrink-0">
                <Shield className="text-green-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Hidden Test Cases</h3>
                <p className="text-gray-400 text-sm">Problems include hidden test cases to prevent hardcoding solutions.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Rules Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Platform Rules</h2>
            <p className="text-gray-400 text-lg">Please read and follow these guidelines</p>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
            <div className="space-y-6">
              
              <div className="flex gap-3">
                <div className="text-blue-400 font-bold shrink-0">1.</div>
                <div>
                  <h4 className="font-semibold mb-1">Fair Play</h4>
                  <p className="text-gray-400 text-sm">All submissions must be your own work. Plagiarism or copying code from external sources during contests is strictly prohibited.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="text-blue-400 font-bold shrink-0">2.</div>
                <div>
                  <h4 className="font-semibold mb-1">Contest Integrity</h4>
                  <p className="text-gray-400 text-sm">During live contests, copy-paste functionality is disabled. Do not attempt to bypass security measures or use external tools.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="text-blue-400 font-bold shrink-0">3.</div>
                <div>
                  <h4 className="font-semibold mb-1">Submission Limits</h4>
                  <p className="text-gray-400 text-sm">Rate limits are in place to prevent spam. You can make up to 10 submissions per problem per 15 minutes.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="text-blue-400 font-bold shrink-0">4.</div>
                <div>
                  <h4 className="font-semibold mb-1">Code of Conduct</h4>
                  <p className="text-gray-400 text-sm">Be respectful to other users. Harassment, offensive language, or disruptive behavior will result in account suspension.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="text-blue-400 font-bold shrink-0">5.</div>
                <div>
                  <h4 className="font-semibold mb-1">Account Security</h4>
                  <p className="text-gray-400 text-sm">Keep your login credentials secure. Do not share your account with others or use multiple accounts.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="text-blue-400 font-bold shrink-0">6.</div>
                <div>
                  <h4 className="font-semibold mb-1">System Abuse</h4>
                  <p className="text-gray-400 text-sm">Do not attempt to exploit vulnerabilities, overload the system, or interfere with other users' experience.</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Coding?</h2>
          <p className="text-gray-400 text-lg mb-8">Join thousands of students improving their programming skills</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-blue-600 px-8 py-4 rounded-lg hover:bg-blue-700 font-semibold text-lg transition-colors shadow-lg shadow-blue-600/30">
              Create Free Account
            </Link>
            <Link to="/login" className="bg-gray-800 px-8 py-4 rounded-lg hover:bg-gray-700 font-semibold text-lg transition-colors border border-gray-700">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>&copy; 2026 DevFlow. Built for competitive programmers.</p>
        </div>
      </footer>

    </div>
  );
}
