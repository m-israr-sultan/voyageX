"use client";

import { useEffect, useMemo, useState } from "react";
import { FaSpinner, FaSync } from "react-icons/fa";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { analyticsAdminApi } from "@/lib/api";

type RangePreset = "today" | "7d" | "30d" | "90d" | "custom";

const COLORS = ["#008A1E", "#22C55E", "#84CC16", "#F59E0B", "#3B82F6", "#8B5CF6", "#EC4899", "#EF4444"];

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function presetToRange(preset: RangePreset): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  if (preset === "today") {
    // start === end (single day)
  } else if (preset === "7d") start.setDate(start.getDate() - 6);
  else if (preset === "30d") start.setDate(start.getDate() - 29);
  else if (preset === "90d") start.setDate(start.getDate() - 89);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

function Card({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border rounded-xl p-3 sm:p-4 min-w-0 overflow-hidden">
      <p className="text-xs text-gray-500 truncate">{label}</p>
      <p className="text-lg sm:text-xl font-semibold mt-1 text-gray-900 break-words">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5 break-words">{sub}</p>}
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-xl p-3 sm:p-5 min-w-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      <div className="min-w-0 w-full">{children}</div>
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const [preset, setPreset] = useState<RangePreset>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [geography, setGeography] = useState<any>(null);
  const [traffic, setTraffic] = useState<any>(null);
  const [devices, setDevices] = useState<any>(null);
  const [sources, setSources] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [timeseries, setTimeseries] = useState<any>(null);

  const range = useMemo(() => {
    if (preset === "custom" && customStart && customEnd) return { startDate: customStart, endDate: customEnd };
    return presetToRange(preset);
  }, [preset, customStart, customEnd]);

  const load = async () => {
    setLoading(true);
    try {
      const [ov, geo, traf, dev, src, biz, ts] = await Promise.all([
        analyticsAdminApi.getOverview(range),
        analyticsAdminApi.getGeography(range),
        analyticsAdminApi.getTraffic(range),
        analyticsAdminApi.getDevices(range),
        analyticsAdminApi.getSources(range),
        analyticsAdminApi.getBusinessMetrics(range),
        analyticsAdminApi.getTimeseries(range),
      ]);
      setOverview(ov.data?.data ?? ov.data);
      setGeography(geo.data?.data ?? geo.data);
      setTraffic(traf.data?.data ?? traf.data);
      setDevices(dev.data?.data ?? dev.data);
      setSources(src.data?.data ?? src.data);
      setBusiness(biz.data?.data ?? biz.data);
      setTimeseries(ts.data?.data ?? ts.data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.startDate, range.endDate]);

  const deviceChartData = (devices?.devices ?? []).map((d: any) => ({ name: d.device, value: d.sessions }));
  const sourceChartData = (sources?.sources ?? []).map((s: any) => ({ name: s.source, value: s.sessions }));
  const visitorSeries = (timeseries?.series ?? []).map((s: any) => ({
    date: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    visitors: s.visitors,
    sessions: s.sessions,
  }));
  const bookingsSeries = (business?.bookingsTimeseries ?? []).map((b: any) => ({
    date: new Date(b.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    bookings: b.count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Platform Analytics</h1>
          <p className="text-sm text-gray-500">All visitors, traffic, devices, sources, and business performance</p>
        </div>
        <button onClick={load} className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg flex items-center gap-2">
          <FaSync className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Range filter */}
      <div className="flex flex-wrap items-center gap-2">
        {(["today", "7d", "30d", "90d", "custom"] as RangePreset[]).map((p) => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg border ${
              preset === p ? "bg-[#008A1E] text-white border-[#008A1E]" : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            {p === "today" ? "Today" : p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : p === "90d" ? "90 Days" : "Custom"}
          </button>
        ))}
        {preset === "custom" && (
          <>
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm" />
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm" />
          </>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><FaSpinner className="animate-spin text-gray-400 text-2xl" /></div>
      ) : (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-1 min-[375px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card label="Total Visits" value={overview?.totalVisitors ?? 0} />
            <Card label="Unique Visitors" value={overview?.uniqueVisitors ?? 0} />
            <Card label="Returning Visitors" value={overview?.returningVisitors ?? 0} />
            <Card label="New Visitors" value={overview?.newVisitors ?? 0} />
            <Card label="Registered Active" value={overview?.registeredActive ?? 0} />
            <Card label="Anonymous Active" value={overview?.anonymousActive ?? 0} />
            <Card label="Page Views" value={overview?.pageViews ?? 0} />
            <Card label="Active Today" value={overview?.activeToday ?? 0} sub={`${overview?.activeThisWeek ?? 0} this week · ${overview?.activeThisMonth ?? 0} this month`} />
          </div>

          {/* Visitor trend */}
          <Section title="Visitor Trend">
            <div className="h-56 sm:h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visitorSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="visitors" stroke="#008A1E" strokeWidth={2} dot={false} name="Unique Visitors" />
                  <Line type="monotone" dataKey="sessions" stroke="#3B82F6" strokeWidth={2} dot={false} name="Sessions" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>

          {/* Geography */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Section title="Top Countries">
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {(geography?.topCountries ?? []).length === 0 && <p className="text-sm text-gray-400">No data yet.</p>}
                {(geography?.topCountries ?? []).map((c: any) => (
                  <div key={c.country} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{c.country}</span>
                    <span className="font-medium text-gray-900">{c.visitors}</span>
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Pakistan vs International">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Pakistan", value: geography?.pakistanVsInternational?.pakistan ?? 0 },
                        { name: "International", value: geography?.pakistanVsInternational?.international ?? 0 },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={75}
                    >
                      <Cell fill="#008A1E" />
                      <Cell fill="#3B82F6" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-xs text-gray-500 mt-1">
                {geography?.pakistanVsInternational?.pakistanPercent ?? 0}% from Pakistan
              </p>
            </Section>
            <Section title="Traffic Sources">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#008A1E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
          </div>

          {/* Traffic — top pages + top entities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section title="Top Pages">
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {(traffic?.topPages ?? []).length === 0 && <p className="text-sm text-gray-400">No data yet.</p>}
                {(traffic?.topPages ?? []).map((p: any) => (
                  <div key={p.path} className="flex items-center justify-between text-sm gap-2">
                    <span className="text-gray-700 truncate">{p.path}</span>
                    <span className="font-medium text-gray-900 flex-shrink-0">{p.views}</span>
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Devices">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deviceChartData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>
                      {deviceChartData.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Section>
          </div>

          {/* Most viewed entities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Most Viewed Guides", rows: traffic?.mostViewedGuides ?? [] },
              { title: "Most Viewed Agencies", rows: traffic?.mostViewedAgencies ?? [] },
              { title: "Most Viewed Packages", rows: traffic?.mostViewedPackages ?? [] },
              { title: "Most Viewed Destinations", rows: traffic?.mostViewedDestinations ?? [] },
            ].map((block) => (
              <Section key={block.title} title={block.title}>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {block.rows.length === 0 && <p className="text-sm text-gray-400">No data yet.</p>}
                  {block.rows.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between text-sm gap-2">
                      <span className="text-gray-700 truncate">{r.name}</span>
                      <span className="font-medium text-gray-900 flex-shrink-0">{r.views}</span>
                    </div>
                  ))}
                </div>
              </Section>
            ))}
          </div>

          {/* Founder business metrics */}
          <Section title="Business Performance">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
              <Card label="Total Guides" value={business?.totalGuides ?? 0} sub={`${business?.verifiedGuides ?? 0} verified`} />
              <Card label="Total Agencies" value={business?.totalAgencies ?? 0} sub={`${business?.verifiedAgencies ?? 0} verified`} />
              <Card label="Active Packages" value={business?.totalPackages ?? 0} />
              <Card label="Bookings Created" value={business?.bookingsCreated ?? 0} sub={`${business?.bookingsCompleted ?? 0} completed`} />
              <Card label="Cancellation Rate" value={`${business?.cancellationRate ?? 0}%`} sub={`${business?.disputes ?? 0} disputes`} />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingsSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#008A1E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
