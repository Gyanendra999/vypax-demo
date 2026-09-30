import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../common/Header';
import { Sidebar } from '../common/Sidebar';
import { AssistantPanel } from '../common/AssistantPanel';
import { NewShipmentModal } from '../common/NewShipmentModal';
import { tradeService } from '../../services/tradeService';

export const DashboardLayout: React.FC = () => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isNewShipmentOpen, setIsNewShipmentOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = tradeService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-[#F8FAFC] text-slate-900 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        onOpenNewShipment={() => setIsNewShipmentOpen(true)}
        onToggleAssistant={() => setIsAssistantOpen((prev) => !prev)}
        isAssistantOpen={isAssistantOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className="hidden md:block shrink-0">
          <Sidebar
            onResetData={() => {
              showToast('Demo workspace data reset to baseline');
            }}
          />
        </div>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative z-50 w-72 bg-white">
              <Sidebar
                onCloseMobile={() => setIsMobileMenuOpen(false)}
                onResetData={() => {
                  setIsMobileMenuOpen(false);
                  showToast('Demo workspace data reset to baseline');
                }}
              />
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ showToast, openNewShipment: () => setIsNewShipmentOpen(true) }} />
        </main>

        {/* Trade Assistant Panel */}
        <AssistantPanel
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
        />
      </div>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-white shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* New Shipment Modal */}
      {isNewShipmentOpen && (
        <NewShipmentModal
          onClose={() => setIsNewShipmentOpen(false)}
          onShipmentCreated={(id) => {
            showToast(`Shipment ${id} created and staged for documentation`);
          }}
        />
      )}
    </div>
  );
};
