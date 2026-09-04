import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import Header from './pages/components/Header';
import Footer from './pages/components/Footer';
import Home from './pages/Home';
import Insights from './pages/Insights/Insights';
import SentimentAnalysis from './pages/SentimentAnalysis';
import Predictions from './pages/Predictions';
import PortfolioAnalytics from './pages/PortfolioAnalytics';
import SocialInsights from './pages/SocialInsights';
import Support from './pages/Support';
import Dashboard from './pages/components/Dashboard';
import SideNav from './pages/components/SideNav';
import Health from './pages/Health';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <SignedIn>
      <Dashboard>
        <div className="flex min-h-screen">
          <SideNav isOpen={isOpen} setIsOpen={setIsOpen} />
          <div className={`flex-1 p-6 transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-16'}`}>
            {children}
          </div>
        </div>
      </Dashboard>
    </SignedIn>
  );
};

const App = () => {
  return (
    <ClerkProvider publishableKey={clerkPubKey} afterSignInUrl="/insights">
      <Router>
        <Routes>
          <Route path="/" element={<><Header /><Home /><Footer /></>} />
          <Route path="/health" element={<Health />} />
          <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
          <Route path="/sentiment" element={<ProtectedRoute><SentimentAnalysis /></ProtectedRoute>} />
          <Route path="/predictions" element={<ProtectedRoute><Predictions /></ProtectedRoute>} />
          <Route path="/portfolio" element={<ProtectedRoute><PortfolioAnalytics /></ProtectedRoute>} />
          <Route path="/social" element={<ProtectedRoute><SocialInsights /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
          <Route path="*" element={<SignedOut><RedirectToSignIn /></SignedOut>} />
        </Routes>
      </Router>
    </ClerkProvider>
  );
};

export default App;