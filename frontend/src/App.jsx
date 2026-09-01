/**
 * App.jsx
 * Root React component.
 * Sets up React Router with all application pages.
 *
 * Data Flow:
 * main.jsx renders <App /> →
 * BrowserRouter wraps everything →
 * MainLayout provides Navbar + Sidebar →
 * Each <Route> renders the corresponding page component
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Layout
import MainLayout from './layouts/MainLayout';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import LiveFireMap from './pages/LiveFireMap';
import RiskPrediction from './pages/RiskPrediction';
import FireReports from './pages/FireReports';
import ReportFire from './pages/ReportFire';
import Analytics from './pages/Analytics';
import About from './pages/About';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing page — no sidebar layout */}
        <Route path="/" element={<LandingPage />} />

        {/* Main app pages — wrapped in MainLayout (Navbar + Sidebar) */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/map" element={<LiveFireMap />} />
          <Route path="/risk" element={<RiskPrediction />} />
          <Route path="/reports" element={<FireReports />} />
          <Route path="/report" element={<ReportFire />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/about" element={<About />} />
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
