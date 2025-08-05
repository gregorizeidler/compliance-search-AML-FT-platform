import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Search, Home, Settings } from 'lucide-react';
import { ThemeModeSwitch } from './ThemeModeSwitch';
import styles from './SharedLayout.module.css';

interface SharedLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const SharedLayout = ({ children, className }: SharedLayoutProps) => {
  const location = useLocation();

  const navLinks = [
    { href: '/', label: 'Home', icon: <Home size={18} /> },
    { href: '/search', label: 'Search', icon: <Search size={18} /> },
    { href: '/admin', label: 'Admin', icon: <Settings size={18} /> },
  ];

  return (
    <div className={`${styles.layout} ${className || ''}`}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <div className={styles.logoIconWrapper}>
              <ShieldCheck size={28} className={styles.logoIcon} />
            </div>
            <div className={styles.logoText}>
              <span className={styles.logoMain}>Compliance</span>
              <span className={styles.logoSub}>Platform</span>
            </div>
          </div>
          <ThemeModeSwitch className={styles.themeSwitch} />
        </div>
        <nav className={styles.nav}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`${styles.navLink} ${location.pathname === link.href ? styles.active : ''}`}
            >
              <div className={styles.navIconWrapper}>
                {link.icon}
              </div>
              <span className={styles.navLabel}>{link.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
};