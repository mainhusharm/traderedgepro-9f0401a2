import { Link } from 'react-router-dom';
import { ArrowUpRight, Twitter, MessageCircle } from 'lucide-react';
import LogoSceneAntimatter from '@/components/canvas/LogoSceneAntimatter';

const socialLinks = [
  { icon: Twitter, href: 'https://x.com/Traderredgepro', label: 'Twitter', disabled: false },
  { icon: MessageCircle, href: 'https://discord.gg/EXB6R8d2', label: 'Discord', disabled: false },
];

const Footer = () => {
  const productLinks = [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/membership' },
    { label: 'MT5 Bots', href: '/mt5-bots' },
    { label: 'Prop Firms', href: '/prop-comparison' },
    { label: 'Futures', href: '/futures' },
  ];

  const resourceLinks = [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' },
  ];

  const dashboardLinks = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Signals', href: '/signal-history' },
    { label: 'Achievements', href: '/achievements' },
    { label: 'Profile', href: '/profile' },
  ];

  const legalLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Refund Policy', href: '/refund-policy' },
  ];

  return (
    <footer className="relative border-t border-white/[0.03]">
      {/* Subtle gradient line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      
      <div className="container mx-auto px-6 py-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 group mb-4">
              <div className="w-8 h-8 relative">
                <LogoSceneAntimatter className="w-full h-full" scale={0.45} interactive={false} />
              </div>
              <span className="text-lg font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                TraderEdge Pro
              </span>
            </Link>
            <p className="text-sm text-muted-foreground/70 mb-4">
              AI-powered trading signals for prop firm success.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <div key={social.label} className="relative group">
                  {social.disabled ? (
                    <div
                      className="w-9 h-9 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground/30 cursor-not-allowed"
                      title="Coming Soon"
                    >
                      <social.icon className="w-4 h-4" />
                    </div>
                  ) : (
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground/50 hover:text-primary hover:border-primary/50 transition-all"
                      aria-label={social.label}
                    >
                      <social.icon className="w-4 h-4" />
                    </a>
                  )}
                  {social.disabled && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-background border border-border rounded text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Coming Soon
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resource Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Dashboard Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Dashboard</h4>
            <ul className="space-y-2">
              {dashboardLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-white/[0.03] flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-xs text-muted-foreground/50">
            © {new Date().getFullYear()} TraderEdge Pro. All rights reserved.
          </span>
          
          <a
            href="mailto:support@traderedgepro.com"
            className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-primary transition-colors group"
          >
            <span>support@traderedgepro.com</span>
            <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
