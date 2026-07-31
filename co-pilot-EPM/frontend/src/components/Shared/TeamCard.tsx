import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Users,
  FolderKanban,
  ChevronRight,
  Trash2,
  Edit2,
  Check,
  X,
} from "lucide-react";

export interface TeamCardProps {
  id?: number;
  name: string;
  description?: string;
  membersCount?: number;
  projectsCount?: number;
  overAllocated?: number;
  avgVelocity?: number | null;
  onEditName?: (v: string) => void;
  onEditDescription?: (v: string) => void;
  viewHref?: string;
  showActions?: boolean;
  onDelete?: () => void;
  className?: string;
}

export function TeamCard({
  id,
  name,
  description,
  membersCount = 0,
  projectsCount = 0,
  overAllocated = 0,
  avgVelocity = null,
  onEditName,
  onEditDescription,
  viewHref,
  showActions = false,
  onDelete,
  className = "",
}: TeamCardProps) {
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [localName, setLocalName] = useState(name);
  const [localDesc, setLocalDesc] = useState(description || "");

  useEffect(() => setLocalName(name), [name]);
  useEffect(() => setLocalDesc(description || ""), [description]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              {!editingName ? (
                <h2 className="text-2xl font-bold">{localName}</h2>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    className="input flex-1"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (!localName.trim()) return;
                      if (confirm("Are you sure you want to save the name?")) {
                        onEditName?.(localName.trim());
                        setEditingName(false);
                      }
                    }}
                    title="Save name"
                    className="btn-primary text-sm"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setLocalName(name);
                      setEditingName(false);
                    }}
                    title="Cancel"
                    className="btn-secondary text-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {!editingName && (
                <button
                  onClick={() => setEditingName(true)}
                  title="Edit name"
                  className="text-surface-400 hover:text-surface-600 p-1"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 text-surface-500 text-sm">
              {!editingDesc ? (
                <div className="flex-1">
                  {localDesc || "Add a description..."}
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    className="input flex-1"
                    value={localDesc}
                    onChange={(e) => setLocalDesc(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to save the description?",
                        )
                      ) {
                        onEditDescription?.(localDesc);
                        setEditingDesc(false);
                      }
                    }}
                    title="Save description"
                    className="btn-primary text-sm"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setLocalDesc(description || "");
                      setEditingDesc(false);
                    }}
                    title="Cancel"
                    className="btn-secondary text-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {!editingDesc && (
                <button
                  onClick={() => setEditingDesc(true)}
                  title="Edit description"
                  className="text-surface-400 hover:text-surface-600 p-1"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {showActions && (
          <div className="flex items-center gap-2">
            {viewHref ? (
              <Link
                href={viewHref}
                className="text-primary-600 hover:text-primary-700 p-1"
                title="View team"
              >
                <ChevronRight className="w-5 h-5" />
              </Link>
            ) : null}
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-red-400 hover:text-red-600 p-1"
                title="Delete team"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-surface-500">Members</p>
          <p className="text-lg font-bold text-surface-800">
            <span className="inline-flex items-center gap-2">
              <Users className="w-3 h-3 text-blue-700" />
              {membersCount}
            </span>
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-surface-500">Projects</p>
          <p className="text-lg font-bold text-surface-800">
            <span className="inline-flex items-center gap-2">
              <FolderKanban className="w-3 h-3 text-purple-700" />
              {projectsCount}
            </span>
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-surface-500">Over-Allocated</p>
          <p className="text-lg font-bold text-red-600">{overAllocated}</p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-surface-500">Avg Velocity</p>
          <p className="text-lg font-bold text-surface-800">
            {avgVelocity != null ? `${avgVelocity.toFixed(1)} pts/wk` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
export default TeamCard;