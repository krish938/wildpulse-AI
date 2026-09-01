/**
 * layouts/MainLayout.jsx
 * The main app layout used by all dashboard pages.
 * Provides the Navbar at the top and Sidebar on the left.
 * <Outlet /> renders the current page's component.
 */

import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Left sidebar navigation */}
      <Sidebar />

      {/* Right content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top navigation bar */}
        <Navbar />

        {/* Page content — scrollable */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          background: 'var(--bg-primary)',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
