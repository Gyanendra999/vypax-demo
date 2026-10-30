import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, HelpCircle, Layers, Menu, X, Github, ChevronDown, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenNewShipment: () => void;
  onToggleAssistant: () => void;
  isAssistantOpen: boolean;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewShipment,
  onToggleAssistant,
  isAssistantOpen,
  onToggleMobileMenu,
  isMobileMenuOpen,
}) => {
  const location = useLocation();
  const { user, currentWorkspace, openAuthModal } = useAuth();

  const isNavActive = (path: string) => {
    if (path === '/dashboard' && (location.pathname === '/dashboard' || location.pathname === '/')) {
      return true;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      {/* Zone 1: Single Text Element Wordmark with clean geometric mark */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        )}

        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="group flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white shadow-xs">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">
              vyaapx
            </span>
          </Link>
          <button
            type="button"
            onClick={openAuthModal}
            className="hidden items-center text-xs font-normal text-slate-400 sm:inline-flex hover:text-slate-700 cursor-pointer transition-colors"
            title="Switch workspace / Manage organization"
          >
            <span className="mx-1 text-slate-300">·</span>
            <span className="font-mono text-[11px] tracking-wider text-slate-500 uppercase flex items-center gap-1 hover:underline">
              {currentWorkspace ? currentWorkspace.workspace.name : 'Demo Workspace'}
              <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
            </span>
          </button>
        </div>
      </div>

      {/* Zone 2: 4-6 Clean Text Navigation Links */}
      <nav className="hidden items-center gap-6 lg:flex">
        <Link
          to="/dashboard"
          className={`text-xs font-medium transition-colors ${
            isNavActive('/dashboard') ? 'text-slate-950 font-semibold' : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          Overview
        </Link>
        <Link
          to="/opportunities"
          className={`text-xs font-medium transition-colors ${
            isNavActive('/opportunities') ? 'text-slate-950 font-semibold' : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          Opportunities
        </Link>
        <Link
          to="/calculator"
          className={`text-xs font-medium transition-colors ${
            isNavActive('/calculator') ? 'text-slate-950 font-semibold' : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          Trade Calculator
        </Link>
        <Link
          to="/documents"
          className={`text-xs font-medium transition-colors ${
            isNavActive('/documents') ? 'text-slate-950 font-semibold' : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          Documents
        </Link>
        <Link
          to="/shipments"
          className={`text-xs font-medium transition-colors ${
            isNavActive('/shipments') ? 'text-slate-950 font-semibold' : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          Shipments
        </Link>
      </nav>

      {/* Zone 3: 1-2 Primary Action Points */}
      <div className="flex items-center gap-2">
        <a
          href="https://github.com/gyanendra731466/vyaapx"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          title="View on GitHub"
        >
          <Github className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">GitHub</span>
        </a>

        <button
          onClick={onToggleAssistant}
          className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors ${
            isAssistantOpen
              ? 'border-blue-600 bg-blue-50 text-blue-800'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
          title="Vyaapx Trade Assistant"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Trade Assistant</span>
        </button>

        <button
          type="button"
          onClick={openAuthModal}
          className="flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          title="Account & Workspaces"
        >
          <User className="h-3.5 w-3.5 text-slate-500" />
          <span className="hidden md:inline font-medium truncate max-w-[85px]">
            {user ? user.fullName.split(' ')[0] : 'Sign In'}
          </span>
        </button>

        <button
          onClick={onOpenNewShipment}
          className="flex h-8 items-center gap-1.5 rounded-md bg-slate-900 px-3 text-xs font-medium text-white shadow-xs transition-colors hover:bg-slate-800"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Shipment</span>
        </button>
      </div>
    </header>
  );
};
