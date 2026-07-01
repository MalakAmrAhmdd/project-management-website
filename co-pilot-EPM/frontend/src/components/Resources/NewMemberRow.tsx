// src/components/NewMemberRow.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Team } from "@/types";

export function NewMemberRow({
  teams,
  onSave,
  onCancel,
  isVisible,
}: {
  teams: Team[];
  onSave: (data: any) => void;
  onCancel: () => void;
  isVisible: (key: string) => boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Engineer");
  const [teamId, setTeamId] = useState(teams[0]?.id ?? 1);
  const nameRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && name && email) onSave({ name, email, role, team_id: teamId });
    if (e.key === "Escape") onCancel();
  };

  useEffect(() => { nameRef.current?.focus(); }, []);

  return (
    <tr className="border-b border-surface-100 bg-primary-50">
      <td className="px-3 py-2"></td>
      {isVisible("name") && (
        <td className="px-3 py-2">
          <input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="input py-1 px-2 text-sm"
            onKeyDown={handleKeyDown} />
        </td>
      )}
      {isVisible("email") && (
        <td className="px-3 py-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input py-1 px-2 text-sm"
            onKeyDown={handleKeyDown} />
        </td>
      )}
      {isVisible("role") && (
        <td className="px-3 py-2">
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" className="input py-1 px-2 text-sm"
            onKeyDown={handleKeyDown} />
        </td>
      )}
      {isVisible("team") && (
        <td className="px-3 py-2">
          <select value={teamId} onChange={(e) => setTeamId(Number(e.target.value))} className="input py-1 px-2 text-sm w-36">
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </td>
      )}
      {isVisible("allocation") && <td></td>}
      {isVisible("velocity") && <td></td>}
      {isVisible("actions") && (
        <td className="px-3 py-2 text-center space-x-2">
          <button
            onClick={() => { if (name && email) onSave({ name, email, role, team_id: teamId }); }}
            className="btn-primary text-xs py-1 px-3"
          >Save</button>
          <button onClick={onCancel} className="btn-secondary text-xs py-1 px-3">Cancel</button>
        </td>
      )}
    </tr>
  );
}
