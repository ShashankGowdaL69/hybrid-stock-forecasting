import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Header from './pages/components/Header';
import Footer from './pages/components/Footer';
import Home from './pages/Home';
import Insights from './pages/Insights/Insights';
import SentimentAnalysis from './pages/SentimentAnalysis';
import Predictions from './pages/Predictions';
import Support from './pages/Support';
import Dashboard from './pages/components/Dashboard';
import SideNav from './pages/components/SideNav';
import SentimentSimulation from './pages/SentimentSimulation';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Dashboard>
      <div className="flex min-h-screen">
        <SideNav isOpen={isOpen} setIsOpen={setIsOpen} />

        <main
          className={`flex-1 transition-all duration-300 ${
            isOpen ? 'md:ml-64' : 'md:ml-0'
          }`}
        >
          {children}
        </main>
      </div>
    </Dashboard>
  );
};

const App = () => {
  return (
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
            <DashboardLayout>
              <Home />
            </DashboardLayout>
          }
        />

        <Route
          path="/insights"
          element={
            <DashboardLayout>
              <Insights />
            </DashboardLayout>
          }
        />

        <Route
          path="/sentiment"
          element={
            <DashboardLayout>
              <SentimentAnalysis />
            </DashboardLayout>
          }
        />

        <Route
          path="/predictions"
          element={
            <DashboardLayout>
              <Predictions />
            </DashboardLayout>
          }
        />

        <Route
          path="/sentiment-simulation"
          element={
            <DashboardLayout>
              <SentimentSimulation />
            </DashboardLayout>
          }
        />

        <Route
          path="/support"
          element={
            <DashboardLayout>
              <Support />
            </DashboardLayout>
          }
        />

      </Routes>
    </Router>
  );
};

export default App;