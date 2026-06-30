import Link from "next/link";
import { InlineInput } from "@/components/InlineInput";
import { Users, FolderKanban, ChevronRight, Trash2 } from "lucide-react";

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

function TeamCard({
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
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <InlineInput
            value={name}
            onSave={(v) => onEditName?.(v)}
            className="text-2xl font-bold"
          />
          <InlineInput
            value={description || ""}
            onSave={(v) => onEditDescription?.(v)}
            placeholder="Add a description..."
            className="text-surface-500 text-sm mt-1"
          />
        </div>

        {showActions && (
          <div className="flex items-center gap-2">
            {viewHref ? (
              <Link href={viewHref} className="text-primary-600 hover:text-primary-700 p-1" title="View team">
                <ChevronRight className="w-5 h-5" />
              </Link>
            ) : null}
            {onDelete && (
              <button onClick={onDelete} className="text-red-400 hover:text-red-600 p-1" title="Delete team">
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