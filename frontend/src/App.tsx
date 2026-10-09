import { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from '@clerk/clerk-react';

import Header from './pages/components/Header';
import Footer from './pages/components/Footer';
import Home from './pages/Home';
import Predictions from './pages/Predictions';
import Dashboard from './pages/components/Dashboard';
import SideNav from './pages/components/SideNav';
import SentimentSimulation from './pages/SentimentSimulation';
import Watchlist from './pages/Watchlist.tsx';
import ForecastHistory from './pages/ForecastHistory.tsx';

const clerkPubKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

const DashboardLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <SignedIn>
      <Dashboard>
        <div className="flex min-h-screen">
          <SideNav
            isOpen={isOpen}
            setIsOpen={setIsOpen}
          />

          <main
            className={`flex-1 transition-all duration-300 ${
              isOpen ? 'md:ml-64' : 'md:ml-0'
            }`}
          >
            {children}
          </main>
        </div>
      </Dashboard>
    </SignedIn>
  );
};

const ProtectedRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

const App = () => {
  if (!clerkPubKey) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-lg text-center">
          <h1 className="text-2xl font-semibold mb-3">
            Clerk configuration missing
          </h1>

          <p className="text-slate-400">
            Add VITE_CLERK_PUBLISHABLE_KEY to the frontend
            environment before running the application.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router>
        <Routes>

          <Route
            path="/"
            element={
              <>
                <Header />
                <Home />
                <Footer />
              </>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Home />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/predictions"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Predictions />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/sentiment-simulation"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SentimentSimulation />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/watchlist"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Watchlist />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ForecastHistory />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </Router>
    </ClerkProvider>
  );
};

export default App;