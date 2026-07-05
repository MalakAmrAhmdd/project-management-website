"use client";

import { useState } from "react";
import { Team } from "@/types";

interface CreateProjectFormProps {
  teams: Team[];
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function CreateProjectForm({ teams, onSave, onCancel }: CreateProjectFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [teamId, setTeamId] = useState<number | "">(teams[0]?.id ?? "");

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-surface-800 mb-4">Create New Project</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-surface-600 mb-1">Project Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Platform Modernization" />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-600 mb-1">Team</label>
          <select value={teamId} onChange={(e) => setTeamId(e.target.value ? Number(e.target.value) : "")} className="input">
            <option value="">No team</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-surface-600 mb-1">Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="input" placeholder="Brief description" />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-600 mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-600 mb-1">Target End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
        <button
          onClick={() => {
            if (name) onSave({
              name,
              description,
              original_start_date: startDate || null,
              original_end_date: endDate || null,
              team_id: teamId || null,
            });
          }}
          disabled={!name}
          className="btn-primary"
        >Create Project</button>
      </div>
    </div>
  );
}
