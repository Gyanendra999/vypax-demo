import React, { useState } from 'react';
import { X, HelpCircle, Send, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';

interface AssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  disclaimer?: boolean;
}

const PRESET_KNOWLEDGE: Record<string, string> = {
  docs_ready:
    'For export booking readiness, the workspace standardly tracks: (1) Commercial Invoice stating unit prices, terms, and buyer/seller identities, (2) Packing List specifying net/gross weights and pallet counts, and (3) Draft Shipping Bill for Indian customs declaration. Depending on the destination and Incoterm, a Certificate of Origin (e.g. CEPA for UAE or EUR-1 for Europe) or Fumigation Certificate may also be mandatory. Requirements vary by jurisdiction—always verify with your licensed Customs Broker.',
  incoterms_diff:
    'FOB (Free On Board) obligates the seller to deliver goods past the ship\'s rail at the named port of loading. From that moment, the buyer assumes all marine freight, transit insurance, import duties, and discharge risk. In contrast, CIF (Cost, Insurance, and Freight) requires the seller to procure and pay for ocean freight and baseline marine insurance up to the destination port, though risk of loss transfers to the buyer once goods are on board.',
  landed_calc:
    'In Vypax, Estimated Landed Cost is computed as: Product Value (Qty × Unit Price) + Ocean Freight + Transit Cargo Insurance + Destination Customs Duty & Cess + Destination Handling/Port Charges. Under standard WTO valuation rules, ad valorem duty rates apply to the CIF valuation basis. Note that calculations in this demo workspace are illustrative estimates and do not constitute an authoritative legal tax assessment.',
  hs_codes:
    'Harmonized System (HS) codes are 6-to-10 digit standardized numerical classifications developed by the World Customs Organization. The first 6 digits are harmonized globally (e.g., 8483.40 for gears and gearing), while national customs administrations add trailing subheadings (e.g., 8483.40.00) to determine exact import duties, anti-dumping levies, and regulatory import prohibitions.',
  exception_mgmt:
    'When a shipment is marked "Exception" (e.g., due to feeder rollover or port congestion as seen in VPX-24021), the operational protocol is: (1) Request revised booking allocation and feeder cut-off from the carrier agent, (2) Update container gate-in validity and CFS ground rent windows, (3) Revalidate export shipping bill validity dates with Customs EDI, and (4) Notify the consignee with a revised ETA.',
};

export const AssistantPanel: React.FC<AssistantPanelProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Good day. I am the Vypax Trade Assistant. I can assist with trade documentation workflows, landed cost breakdowns, Incoterm definitions, and compliance checklists.',
      timestamp: 'Active',
      disclaimer: true,
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');

    // Match grounded trade response
    setTimeout(() => {
      let reply = '';
      const lower = query.toLowerCase();

      if (lower.includes('document') || lower.includes('ready to book') || lower.includes('booking')) {
        reply = PRESET_KNOWLEDGE.docs_ready;
      } else if (lower.includes('incoterm') || lower.includes('fob') || lower.includes('cif')) {
        reply = PRESET_KNOWLEDGE.incoterms_diff;
      } else if (lower.includes('cost') || lower.includes('landed') || lower.includes('margin') || lower.includes('calculate')) {
        reply = PRESET_KNOWLEDGE.landed_calc;
      } else if (lower.includes('hs code') || lower.includes('tariff') || lower.includes('classification')) {
        reply = PRESET_KNOWLEDGE.hs_codes;
      } else if (lower.includes('exception') || lower.includes('delay') || lower.includes('congestion')) {
        reply = PRESET_KNOWLEDGE.exception_mgmt;
      } else {
        reply = `Regarding "${query}": In international trade execution, operations depend on destination customs regulations, product HS classification, and the agreed Incoterms 2020 rule. For this demo workflow, cross-reference the shipment's verified document repository or run a preliminary simulation in the Trade Calculator before committing cargo to the terminal.`;
      }

      const botMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: 'Just now',
        disclaimer: true,
      };

      setMessages((prev) => [...prev, botMsg]);
    }, 450);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5 bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-white">
            <HelpCircle className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Vypax Assistant</h3>
            <p className="text-[10px] text-slate-500">Trade Intelligence & Workflow Guidance</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Mandatory Disclaimer Note from Prompt */}
      <div className="border-b border-amber-200 bg-amber-50/70 px-4 py-2 text-[11px] text-amber-900 flex items-start gap-1.5">
        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-700 mt-0.5" />
        <p>
          Informational demo guidance only. Not legal customs, tariff, or regulatory advice. Always
          verify filings with licensed trade professionals.
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[88%] rounded-lg p-3 ${
                m.sender === 'user'
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-slate-50 text-slate-800'
              }`}
            >
              <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
            </div>
            <span className="mt-1 text-[10px] text-slate-400 px-1">{m.timestamp}</span>
          </div>
        ))}
      </div>

      {/* Suggested Trade Questions */}
      <div className="border-t border-slate-100 bg-slate-50/50 p-2.5">
        <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
          Operational Inquiries
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() =>
              handleSend('What documents are usually required before this shipment is ready to book?')
            }
            className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-100 text-left"
          >
            Required booking documents?
          </button>
          <button
            onClick={() => handleSend('How is CIF landed cost calculated?')}
            className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-100 text-left"
          >
            How is CIF landed cost calculated?
          </button>
          <button
            onClick={() => handleSend('What is the difference between FOB and CIF Incoterms?')}
            className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-100 text-left"
          >
            FOB vs CIF difference?
          </button>
          <button
            onClick={() => handleSend('How do I handle a port congestion exception?')}
            className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-100 text-left"
          >
            Port congestion exception protocol?
          </button>
        </div>
      </div>

      {/* Input row */}
      <div className="border-t border-slate-200 p-3 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about documentation, Incoterms, duties..."
            className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim()}
            className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 text-white disabled:opacity-40 hover:bg-slate-800"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
