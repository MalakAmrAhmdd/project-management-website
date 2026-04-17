"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, getStateColor, getAllocationColor, formatDate, computeDuration, computeOverallVelocity } from "@/lib/utils";
import {
  FolderKanban, Users, Target, AlertTriangle, CheckCircle2,
  Clock, TrendingUp, Activity,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from "recharts";
import Link from "next/link";

const PIE_COLORS = ["#ef4444", "#22c55e", "#eab308", "#94a3b8"];

export default function DashboardPage() {
  const { data: summary } = useQuery({ queryKey: ["dashboard-summary"], queryFn: api.dashboardSummary });
  const { data: health } = useQuery({ queryKey: ["resource-health"], queryFn: api.resourceHealth });
  const { data: timeline } = useQuery({ queryKey: ["project-timeline"], queryFn: api.projectTimeline });

  const allocationPieData = summary
    ? [
        { name: "Over-allocated", value: summary.over_allocated_resources },
        { name: "Optimal", value: summary.optimal_resources },
        { name: "Under-utilized", value: summary.under_utilized_resources },
        { name: "Unallocated", value: summary.unallocated_resources },
      ]
    : [];

  const projectStateData = summary
    ? Object.entries(summary.projects_by_state).map(([state, count]) => ({ state, count }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
        <p className="text-surface-500 text-sm mt-1">Overview of your engineering project portfolio</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/projects">
          <SummaryCard
            icon={FolderKanban}
            label="Total Projects"
            value={summary?.total_projects ?? 0}
            color="bg-blue-500"
          />
        </Link>
        <Link href="/management">
          <SummaryCard
            icon={Target}
            label="Active Milestones"
            value={summary?.active_milestones ?? 0}
            color="bg-green-500"
          />
        </Link>
        <Link href="/resources">
          <SummaryCard
            icon={Users}
            label="Total Members"
            value={summary?.total_members ?? 0}
            color="bg-purple-500"
          />
        </Link>
        <Link href="/resources">
          <SummaryCard
            icon={AlertTriangle}
            label="Over-Allocated"
            value={summary?.over_allocated_resources ?? 0}
            color="bg-red-500"
            alert={summary?.over_allocated_resources ? summary.over_allocated_resources > 0 : false}
          />
        </Link>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Allocation Health */}
        <div className="card p-6">
          <h2 className="font-semibold text-surface-800 mb-4">Resource Allocation Health</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}
                >
                  {allocationPieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projects by State */}
        <div className="card p-6">
          <h2 className="font-semibold text-surface-800 mb-4">Projects by State</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectStateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="state" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Resource Health Table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-surface-800">Resource Allocation Overview</h2>
          <Link href="/resources" className="text-primary-600 text-sm font-medium hover:underline">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="text-left py-3 px-3 font-medium text-surface-600">Name</th>
                <th className="text-left py-3 px-3 font-medium text-surface-600">Email</th>
                <th className="text-right py-3 px-3 font-medium text-surface-600">Allocation %</th>
                <th className="text-right py-3 px-3 font-medium text-surface-600">Avg Velocity</th>
                <th className="text-left py-3 px-3 font-medium text-surface-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {health?.map((m) => (
                <tr key={m.id} className="border-b border-surface-100 hover:bg-surface-50 cursor-pointer">
                  <td className="py-3 px-3 font-medium">
                    <Link href="/resources" className="hover:text-primary-600">{m.name}</Link>
                  </td>
                  <td className="py-3 px-3 text-surface-500">{m.email}</td>
                  <td className="py-3 px-3 text-right">
                    <span className={cn("badge", getAllocationColor(m.allocation_percentage))}>
                      {(m.allocation_percentage * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">{m.overall_avg_velocity.toFixed(1)} pts/wk</td>
                  <td className="py-3 px-3">
                    <span className={cn("badge", 
                      m.status === "over_allocated" ? "bg-red-100 text-red-700" :
                      m.status === "optimal" ? "bg-green-100 text-green-700" :
                      m.status === "under_utilized" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-600"
                    )}>
                      {m.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Timeline Gantt */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-surface-800">Project Timeline</h2>
          <Link href="/management" className="text-primary-600 text-sm font-medium hover:underline">
            Manage →
          </Link>
        </div>
        <div className="space-y-4">
          {timeline?.map((proj) => (
            <div key={proj.id} className="border border-surface-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-1">
                <span className={cn("badge", getStateColor(proj.state))}>{proj.state}</span>
                <Link href={`/projects/${proj.id}`} className="font-semibold text-surface-800 hover:text-primary-600">
                  {proj.name}
                </Link>
                <Link href={`/projects/${proj.id}`} className="text-primary-600 text-xs hover:underline ml-auto">
                  Edit →
                </Link>
              </div>
              <div className="flex flex-wrap gap-3 mb-3 text-xs text-surface-500">
                <span>{formatDate(proj.start_date)} — {formatDate(proj.end_date)}</span>
                <span className="text-surface-300">|</span>
                <span>Duration: {computeDuration(proj.start_date, proj.end_date)}</span>
              </div>
              <div className="space-y-2 pl-4">
                {proj.phases.map((phase) => (
                  <div key={phase.id}>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={cn("w-2 h-2 rounded-full",
                        phase.state === "ACTIVE" ? "bg-blue-500" :
                        phase.state === "COMPLETED" ? "bg-green-500" : "bg-gray-300"
                      )} />
                      <span className={cn("font-medium", phase.is_placeholder && "text-surface-400 italic")}>
                        {phase.name}
                      </span>
                      <span className="text-xs text-surface-400">
                        {computeDuration(phase.start_date, phase.end_date)}
                      </span>
                      <span className="text-xs text-surface-400 ml-auto">
                        {formatDate(phase.start_date)} — {formatDate(phase.end_date)}
                      </span>
                    </div>
                    <div className="space-y-1 pl-4 mt-1">
                      {phase.milestones.map((ms) => (
                        <div key={ms.id} className={cn(
                          "flex items-center gap-2 text-xs",
                          ms.is_placeholder && "text-surface-400 italic"
                        )}>
                          <Target className="w-3 h-3 shrink-0" />
                          <Link href="/management" className="hover:text-primary-600">{ms.name}</Link>
                          <span className="text-surface-400">
                            {ms.total_estimated_points}pts · {ms.num_allocated_resources}res
                            · {computeDuration(ms.start_date, ms.end_date)}
                            · {computeOverallVelocity(ms.total_estimated_points, ms.start_date, ms.end_date)}
                          </span>
                          <span className="ml-auto text-surface-400">
                            {formatDate(ms.start_date)} — {formatDate(ms.end_date)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {timeline?.length === 0 && (
            <p className="text-center text-surface-400 py-8">No projects yet. Create one to get started.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color, alert = false }: {
  icon: any; label: string; value: number; color: string; alert?: boolean;
}) {
  return (
    <div className={cn("card p-5", alert && "ring-2 ring-red-300")}>
      <div className="flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white", color)}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-surface-500">{label}</p>
        </div>
        {alert && <AlertTriangle className="w-5 h-5 text-red-500 ml-auto animate-pulse" />}
      </div>
    </div>
  );
}
