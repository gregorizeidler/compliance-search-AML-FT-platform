import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { ThemeModeSwitch } from '../components/ThemeModeSwitch';
import { Search, ShieldCheck, Globe, Building, Zap, Shield, Database, TrendingUp } from 'lucide-react';
import styles from './_index.module.css';

const IndexPage = () => {
  return (
    <>
      <Helmet>
        <title>AML Compliance Search Platform | Floot</title>
        <meta
          name="description"
          content="Streamline your AML and FT compliance with our powerful search platform. Search real-time data synchronized from official OFAC, UN, EU, and Interpol sources."
        />
      </Helmet>
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <div className={styles.logo}>
            <div className={styles.logoIconWrapper}>
              <ShieldCheck size={28} className={styles.logoIcon} />
            </div>
            <span className={styles.logoText}>ComplianceSearch</span>
          </div>
          <nav className={styles.nav}>
            <Link to="/#features" className={styles.navLink}>Features</Link>
            <Link to="/#pricing" className={styles.navLink}>Pricing</Link>
            <Button asChild variant="ghost">
              <Link to="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link to="/search">Start Searching</Link>
            </Button>
            <ThemeModeSwitch />
          </nav>
        </header>

        <main>
          <section className={styles.hero}>
            <div className={styles.heroBackground}>
              <div className={styles.heroGrid}></div>
              <div className={styles.heroGlow}></div>
            </div>
            <div className={styles.heroContent}>
              <div className={styles.heroTextContent}>
                <div className={styles.heroBadge}>
                  <Zap size={16} />
                  <span>Real-time Compliance Intelligence</span>
                </div>
                <h1 className={styles.heroHeadline}>
                  Next-Generation
                  <span className={styles.heroGradientText}> AML Screening</span>
                  <br />
                  Platform
                </h1>
                <p className={styles.heroSubheadline}>
                  Empower your compliance team with our unified AI-powered search platform.
                  Screen individuals and entities against real-time data synchronized directly 
                  from official OFAC, UN, EU, and Interpol sources with unprecedented accuracy.
                </p>
                <div className={styles.heroCta}>
                  <Button asChild size="lg" className={styles.heroPrimaryButton}>
                    <Link to="/search">
                      <Search size={20} />
                      Start Your First Search
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className={styles.heroSecondaryButton}>
                    <Link to="/admin">
                      <TrendingUp size={20} />
                      View Analytics
                    </Link>
                  </Button>
                </div>
                <div className={styles.heroStats}>
                  <div className={styles.heroStat}>
                    <div className={styles.heroStatNumber}>99.9%</div>
                    <div className={styles.heroStatLabel}>Accuracy Rate</div>
                  </div>
                  <div className={styles.heroStat}>
                    <div className={styles.heroStatNumber}>24/7</div>
                    <div className={styles.heroStatLabel}>Live Updates</div>
                  </div>
                  <div className={styles.heroStat}>
                    <div className={styles.heroStatNumber}>4+</div>
                    <div className={styles.heroStatLabel}>Data Sources</div>
                  </div>
                </div>
              </div>
              <div className={styles.heroImageContainer}>
                <div className={styles.heroCard}>
                  <div className={styles.heroCardHeader}>
                    <div className={styles.heroCardTitle}>Live Screening Dashboard</div>
                    <div className={styles.heroCardStatus}>
                      <div className={styles.statusDot}></div>
                      Online
                    </div>
                  </div>
                  <div className={styles.heroCardContent}>
                    <div className={styles.searchDemoBox}>
                      <Search size={18} className={styles.searchDemoIcon} />
                      <span>Searching: "Vladimir Putin"</span>
                    </div>
                    <div className={styles.resultsList}>
                      <div className={styles.resultItem}>
                        <Shield size={16} />
                        <span>OFAC Match Found</span>
                        <Badge variant="destructive">High Risk</Badge>
                      </div>
                      <div className={styles.resultItem}>
                        <Globe size={16} />
                        <span>UN Sanctions List</span>
                        <Badge variant="warning">Medium Risk</Badge>
                      </div>
                      <div className={styles.resultItem}>
                        <Building size={16} />
                        <span>EU Restrictive Measures</span>
                        <Badge variant="destructive">High Risk</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="features" className={styles.features}>
            <div className={styles.featuresContent}>
              <div className={styles.featuresHeader}>
                <h2 className={styles.sectionTitle}>
                  The Future of <span className={styles.gradientText}>Compliance Technology</span>
                </h2>
                <p className={styles.sectionSubtitle}>
                  Built for modern financial institutions that demand precision, speed, and reliability.
                </p>
              </div>
              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIconWrapper}>
                    <Database size={28} />
                    <div className={styles.featureIconGlow}></div>
                  </div>
                  <h3>Real-time Data Synchronization</h3>
                  <p>Access live data synchronized every minute from official OFAC, UN, EU, and Interpol APIs, ensuring your compliance checks are always current.</p>
                  <div className={styles.featureHighlight}>
                    <span>99.9% Uptime Guarantee</span>
                  </div>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureIconWrapper}>
                    <Zap size={28} />
                    <div className={styles.featureIconGlow}></div>
                  </div>
                  <h3>Lightning-Fast Search</h3>
                  <p>Advanced indexing and AI-powered matching algorithms deliver results in milliseconds, not minutes. Screen thousands of entities instantly.</p>
                  <div className={styles.featureHighlight}>
                    <span>&lt;100ms Response Time</span>
                  </div>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureIconWrapper}>
                    <Shield size={28} />
                    <div className={styles.featureIconGlow}></div>
                  </div>
                  <h3>Enterprise Security</h3>
                  <p>Bank-grade encryption, SOC 2 compliance, and comprehensive audit trails ensure your sensitive compliance data stays protected.</p>
                  <div className={styles.featureHighlight}>
                    <span>SOC 2 Type II Certified</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.searchPreview}>
            <div className={styles.searchPreviewContent}>
              <h2 className={styles.sectionTitle}>
                Experience <span className={styles.gradientText}>Instant Screening</span>
              </h2>
              <p className={styles.sectionSubtitle}>
                See how our advanced search interface delivers comprehensive results in real-time.
              </p>
              <div className={styles.searchBox}>
                <div className={styles.searchInputWrapper}>
                  <Search size={20} className={styles.searchIcon} />
                  <Input
                    type="text"
                    placeholder="Search by name, e.g., 'Vladimir Putin'"
                    className={styles.previewInput}
                    readOnly
                  />
                  <div className={styles.searchInputGlow}></div>
                </div>
                <Button asChild size="lg" className={styles.searchButton}>
                  <Link to="/search">Search Now</Link>
                </Button>
              </div>
              <div className={styles.listBadges}>
                <Badge className={styles.sourceBadge}>OFAC SDN</Badge>
                <Badge className={styles.sourceBadge}>UN Sanctions</Badge>
                <Badge className={styles.sourceBadge}>EU Consolidated</Badge>
                <Badge className={styles.sourceBadge}>Interpol Red</Badge>
              </div>
            </div>
          </section>

          <section className={styles.adminCta}>
            <div className={styles.adminCtaContent}>
              <div className={styles.adminCtaBackground}></div>
              <h2 className={styles.sectionTitle}>
                Advanced <span className={styles.gradientText}>Administration</span>
              </h2>
              <p className={styles.sectionSubtitle}>
                Monitor data synchronization, track API usage, and manage your compliance infrastructure with our comprehensive admin dashboard.
              </p>
              <Button asChild size="lg" variant="secondary" className={styles.adminButton}>
                <Link to="/admin">
                  <ShieldCheck size={20} />
                  Access Control Center
                </Link>
              </Button>
            </div>
          </section>
        </main>

        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <div className={styles.footerLogo}>
              <ShieldCheck size={24} />
              <span>ComplianceSearch</span>
            </div>
            <p>&copy; {new Date().getFullYear()} Floot Inc. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default IndexPage;