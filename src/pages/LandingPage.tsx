import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Layers,
  Compass,
  Calculator,
  FileText,
  Ship,
  CheckCircle2,
  AlertTriangle,
  Globe,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-slate-200">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white shadow-xs">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">vypax</span>
          <span className="font-mono text-[11px] text-slate-400">· DEMO WORKSPACE</span>
        </div>

        <nav className="hidden items-center gap-6 md:flex text-xs font-medium text-slate-600">
          <a href="#workflow" className="hover:text-slate-950 transition-colors">
            Workflow
          </a>
          <a href="#messy-middle" className="hover:text-slate-950 transition-colors">
            The Messy Middle
          </a>
          <a href="#platform" className="hover:text-slate-950 transition-colors">
            Capabilities
          </a>
          <Link to="/calculator" className="hover:text-slate-950 transition-colors">
            Cost Calculator
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-slate-800 transition-colors"
          >
            <span>Open Demo</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-2xs mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
          <span>Operational Layer for Global Trade Workflows</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl max-w-3xl mx-auto leading-tight">
          Move trade from complexity to control.
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Vypax brings trade discovery, cost intelligence, documentation, shipment execution, and
          tracking into one operational workflow.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <span>Open Demo</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <a
            href="#workflow"
            className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Explore Workflow
          </a>
        </div>

        {/* Workflow Progression Diagram */}
        <div id="workflow" className="mt-16 rounded-xl border border-slate-200 bg-white p-6 shadow-xs text-left">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              The Trade Lifecycle
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              End-to-End Operational Pipeline
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7 text-xs">
            {[
              {
                step: '01',
                name: 'Discover',
                detail: 'Identify viable corridors, market demand, and tariff codes.',
                route: '/opportunities',
              },
              {
                step: '02',
                name: 'Calculate',
                detail: 'Model CIF landed costs, duties, and gross margins.',
                route: '/calculator',
              },
              {
                step: '03',
                name: 'Prepare',
                detail: 'Generate commercial invoices, packing lists, and origin certs.',
                route: '/documents',
              },
              {
                step: '04',
                name: 'Book',
                detail: 'Coordinate forwarders, container allocations, and cut-offs.',
                route: '/shipments',
              },
              {
                step: '05',
                name: 'Execute',
                detail: 'CFS gate-in, customs LEO, and vessel berth loading.',
                route: '/shipments',
              },
              {
                step: '06',
                name: 'Track',
                detail: 'Monitor ocean voyages, milestone changes, and exceptions.',
                route: '/shipments/VPX-24017',
              },
              {
                step: '07',
                name: 'Deliver',
                detail: 'Port discharge, import clearance, and proof of receipt.',
                route: '/activity',
              },
            ].map((s) => (
              <div
                key={s.name}
                onClick={() => navigate(s.route)}
                className="group cursor-pointer rounded-lg border border-slate-100 bg-slate-50/70 p-3 hover:border-slate-300 hover:bg-white transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-400">{s.step}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300 group-hover:bg-blue-600 transition-colors" />
                </div>
                <h4 className="mt-2 text-xs font-semibold text-slate-900 group-hover:text-blue-900">
                  {s.name}
                </h4>
                <p className="mt-1 text-[11px] text-slate-500 leading-normal">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 1: One workflow. Multiple handoffs. */}
      <section className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Operational Realities
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              One workflow. Multiple handoffs.
            </h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Every international trade shipment moves across a fragile chain of participants:
              exporters, importers, Custom House Agents (CHAs), freight forwarders, container
              transporters, bonded warehouses, CFS operators, port terminals, customs inspection
              authorities, and ocean carriers.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            <div className="rounded-lg border border-slate-200 p-4">
              <span className="font-mono text-[11px] text-slate-400">01 / Regulatory</span>
              <h3 className="mt-1 font-semibold text-slate-900">Customs & Compliance Desk</h3>
              <p className="mt-1.5 text-slate-600">
                HS code determination, preferential tariff eligibility (CEPA, EUR-1), and
                electronic shipping bill assessments.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <span className="font-mono text-[11px] text-slate-400">02 / Logistics</span>
              <h3 className="mt-1 font-semibold text-slate-900">Forwarders & Port CFS</h3>
              <p className="mt-1.5 text-slate-600">
                Equipment booking, carting orders, fumigation verification, and gate-in cut-off
                adherence before vessel berthing.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <span className="font-mono text-[11px] text-slate-400">03 / Financial</span>
              <h3 className="mt-1 font-semibold text-slate-900">Trade Finance & Receivables</h3>
              <p className="mt-1.5 text-slate-600">
                Landed cost integrity, letter of credit compliance, proof of delivery verification,
                and export realization reconciliation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Built for the messy middle. */}
      <section id="messy-middle" className="border-t border-slate-200 bg-[#F8FAFC] py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Pain Points
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Built for the messy middle.
            </h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Global trade is not stalled by shipping hardware—it is stalled by fragmented data and
              manual coordination across unlinked systems.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
            {[
              {
                title: 'Spreadsheets',
                desc: 'Scattered pricing matrices and freight rate calculators that drift out of sync.',
              },
              {
                title: 'PDFs & Scans',
                desc: 'Invoices, packing lists, and certificates manually retyped into customs portals.',
              },
              {
                title: 'Email & WhatsApp',
                desc: 'Critical booking confirmations and cut-off changes buried in message threads.',
              },
              {
                title: 'Manual Follow-ups',
                desc: 'Phoning CFS leads and forwarders daily to confirm container carting status.',
              },
              {
                title: 'Repeated Data Entry',
                desc: 'Same cargo descriptions entered into 5 different documents and carrier systems.',
              },
              {
                title: 'Shipment Exceptions',
                desc: 'Rolled vessels or customs queries discovered too late to avoid demurrage penalties.',
              },
              {
                title: 'Document Mismatches',
                desc: 'Discrepancies in weight or HS codes halting container loading at port gates.',
              },
              {
                title: 'Untracked Handoffs',
                desc: 'Lost operational visibility when cargo transitions from road transporter to terminal.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-3.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mb-2 block" />
                <h4 className="font-semibold text-slate-900">{item.title}</h4>
                <p className="mt-1 text-[11px] text-slate-500 leading-normal">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: One operational workspace */}
      <section id="platform" className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Core Capabilities
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              One operational workspace.
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Vypax structures trade operations into interconnected functional modules designed to
              eliminate information loss.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3 text-xs">
            <div className="rounded-lg border border-slate-200 p-5 bg-[#F8FAFC]">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 text-white mb-3">
                <Calculator className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Cost & Landed Intelligence</h3>
              <p className="mt-1.5 text-slate-600 leading-relaxed">
                Estimate unit economics, CIF freight, marine insurance, and destination tariffs
                before booking container slots.
              </p>
              <Link
                to="/calculator"
                className="mt-4 inline-flex items-center gap-1 font-medium text-blue-700 hover:text-blue-900"
              >
                <span>Launch Calculator</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="rounded-lg border border-slate-200 p-5 bg-[#F8FAFC]">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 text-white mb-3">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Trade Document Engine</h3>
              <p className="mt-1.5 text-slate-600 leading-relaxed">
                Manage commercial invoices, packing lists, shipping bills, and bills of lading with
                audit verification states.
              </p>
              <Link
                to="/documents"
                className="mt-4 inline-flex items-center gap-1 font-medium text-blue-700 hover:text-blue-900"
              >
                <span>Open Document Hub</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="rounded-lg border border-slate-200 p-5 bg-[#F8FAFC]">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 text-white mb-3">
                <Ship className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Shipment Execution Tower</h3>
              <p className="mt-1.5 text-slate-600 leading-relaxed">
                Track sequential milestones from booking and CFS gate-in to customs clearance,
                vessel departure, and final delivery.
              </p>
              <Link
                to="/shipments"
                className="mt-4 inline-flex items-center gap-1 font-medium text-blue-700 hover:text-blue-900"
              >
                <span>View Shipments</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-slate-200 bg-slate-900 py-16 text-white text-center">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Start with one shipment.
          </h2>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            Experience how Vypax brings clarity to international trade execution. Explore the live
            demo workspace seeded with realistic operational data.
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-100 transition-colors"
            >
              <span>Open Demo Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="mx-auto max-w-5xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300 tracking-tight">vypax</span>
            <span>·</span>
            <span>Operating layer for international trade</span>
          </div>
          <p className="text-[11px]">
            Demo Environment · Fictional operational data for prototype validation
          </p>
        </div>
      </footer>
    </div>
  );
};
