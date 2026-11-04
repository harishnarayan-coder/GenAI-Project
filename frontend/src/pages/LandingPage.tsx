import { Link } from 'react-router-dom';
import { Brain, Sparkles, CheckSquare, Database, Users, BarChart2, ArrowRight, Zap, Shield, Clock, ChevronRight } from 'lucide-react';
import Navbar from '../components/layout/Navbar';

const features = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: 'AI-Powered Analysis',
    desc: 'Google Gemini AI analyzes meeting notes to extract key information with high accuracy.',
    color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  {
    icon: <Database className="w-6 h-6" />,
    title: 'RAG Technology',
    desc: 'Retrieval-Augmented Generation uses your past meetings as context for smarter analysis.',
    color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  },
  {
    icon: <CheckSquare className="w-6 h-6" />,
    title: 'Action Item Extraction',
    desc: 'Automatically identifies tasks, assigns owners, deadlines, and priorities from your notes.',
    color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Decision Tracking',
    desc: 'Captures approved, rejected, and deferred decisions so nothing falls through the cracks.',
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Team Accountability',
    desc: 'Assign action items to team members and track completion with status updates.',
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    icon: <BarChart2 className="w-6 h-6" />,
    title: 'Analytics & Reports',
    desc: 'Visual dashboards showing meeting productivity, task completion rates, and trends.',
    color: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  },
];

const steps = [
  { num: '01', title: 'Upload Meeting Notes', desc: 'Paste text directly or upload PDF, DOCX, or TXT files from any meeting.' },
  { num: '02', title: 'AI Processes & Analyzes', desc: 'Gemini AI with RAG context analyzes your notes in seconds.' },
  { num: '03', title: 'Review Structured Output', desc: 'Get executive summary, decisions, action items, and follow-ups instantly.' },
  { num: '04', title: 'Track & Manage Tasks', desc: 'Use Kanban board and task manager to drive completion.' },
];

const MockDashboard = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-6 max-w-2xl mx-auto">
    <div className="flex items-center justify-between mb-5">
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Meeting Analysis</p>
        <h3 className="font-semibold text-gray-900 dark:text-white">Q4 Strategy Review</h3>
      </div>
      <span className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-xs font-medium px-2.5 py-1 rounded-full">Analyzed</span>
    </div>
    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-4">
      <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">Executive Summary</p>
      <p className="text-sm text-gray-700 dark:text-gray-300">The team aligned on Q4 priorities focusing on product launch, marketing campaign, and hiring plan...</p>
    </div>
    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Action Items</p>
    <div className="space-y-2.5">
      {[
        { title: 'Finalize product roadmap', person: 'Sarah K.', priority: 'High', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
        { title: 'Draft marketing proposal', person: 'Mike R.', priority: 'Medium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
        { title: 'Schedule hiring interviews', person: 'HR Team', priority: 'Low', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      ].map((item, i) => (
        <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <CheckSquare className="w-4 h-4 text-indigo-500" />
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.person}</p>
            </div>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.color}`}>{item.priority}</span>
        </div>
      ))}
    </div>
  </div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              Powered by Generative AI & RAG
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Turn Every Meeting Into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                Meaningful Action.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
              Transform unstructured meeting notes into intelligent summaries, decisions, and actionable tasks using Generative AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 text-gray-700 dark:text-gray-300 font-semibold px-7 py-3.5 rounded-xl transition-colors"
              >
                Sign In <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="mt-12">
            <MockDashboard />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">A complete meeting intelligence platform built for modern teams.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 dark:text-gray-400">From raw notes to actionable insights in four simple steps.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RAG Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-sm font-medium px-3 py-1 rounded-full mb-4">
                <Database className="w-4 h-4" /> RAG Technology
              </div>
              <h2 className="text-3xl font-bold mb-4">Context-Aware AI Analysis</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Our RAG (Retrieval-Augmented Generation) pipeline uses ChromaDB and Sentence Transformers to retrieve relevant context from your past meeting documents, making every analysis smarter and more accurate.
              </p>
              <div className="space-y-3">
                {[
                  'Builds a semantic knowledge base from your documents',
                  'Retrieves relevant past meeting context automatically',
                  'Identifies recurring issues and unresolved topics',
                  'Provides context-aware summaries and action items',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="space-y-3">
                {[
                  { step: '1. Upload', desc: 'Past meeting docs', icon: '📄', color: 'bg-blue-50 dark:bg-blue-900/20' },
                  { step: '2. Embed', desc: 'Generate semantic vectors', icon: '🔢', color: 'bg-violet-50 dark:bg-violet-900/20' },
                  { step: '3. Retrieve', desc: 'Find relevant context', icon: '🔍', color: 'bg-indigo-50 dark:bg-indigo-900/20' },
                  { step: '4. Generate', desc: 'Context-aware analysis', icon: '✨', color: 'bg-green-50 dark:bg-green-900/20' },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${item.color}`}>
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{item.step}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why MeetMind AI?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: <Clock className="w-7 h-7 text-indigo-600" />, title: 'Save Hours Weekly', desc: 'Eliminate manual note-taking and task distribution after every meeting.' },
              { icon: <Shield className="w-7 h-7 text-violet-600" />, title: 'Never Miss a Task', desc: 'AI ensures every action item, deadline, and decision is captured accurately.' },
              { icon: <Zap className="w-7 h-7 text-amber-500" />, title: 'Instant Insights', desc: 'Get structured output within seconds of uploading your meeting notes.' },
            ].map((b, i) => (
              <div key={i} className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="flex justify-center mb-4">{b.icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{b.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-violet-700">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to transform your meetings?</h2>
          <p className="text-indigo-100 mb-8 text-lg">Join teams that use MeetMind AI to stay accountable and productive.</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-400" />
            <span className="font-semibold text-white">MeetMind AI</span>
          </div>
          <p className="text-sm">© 2024 MeetMind AI. GenAI Project. Built with FastAPI, React & Google Gemini.</p>
          <div className="flex gap-4 text-sm">
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
