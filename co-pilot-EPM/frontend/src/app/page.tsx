"use client";

import { PIE_COLORS } from "@/lib/constants";
import { ResourceHealthTable } from "@/components/Dashboard/ResourceHealthTable";
import { SummaryCard } from "@/components/Dashboard/SummaryCard";
import { ProjectTimeline } from "@/components/Dashboard/ProjectTimeline";
import { useDashboardData } from "@/hooks/useDashboardData";
import { FolderKanban, Users, Target, AlertTriangle } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid
} from "recharts";
import Link from "next/link";


export default function DashboardPage() {
  const {
    summary,
    health,
    timeline,
    allocationPieData,
    projectStateData,
  } = useDashboardData();

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
      <ResourceHealthTable health={health} />

      {/* Project Timeline Gantt */}
      <ProjectTimeline timeline={timeline} />
    </div>
  );
}

