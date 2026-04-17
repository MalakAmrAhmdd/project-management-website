from fastapi import APIRouter, Depends
from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Project, Phase, Milestone, Member, Allocation, ItemState

router = APIRouter()


@router.get("/summary")
async def dashboard_summary(db: AsyncSession = Depends(get_db)):
    """Main dashboard summary stats."""
    # Total projects
    proj_count = (await db.execute(select(sqlfunc.count(Project.id)))).scalar_one()

    # Active milestones
    active_ms = (await db.execute(
        select(sqlfunc.count(Milestone.id)).where(Milestone.state == ItemState.ACTIVE)
    )).scalar_one()

    # Total members
    member_count = (await db.execute(select(sqlfunc.count(Member.id)))).scalar_one()

    # Over-allocated resources (allocation_percentage > 1.0)
    over_alloc = (await db.execute(
        select(sqlfunc.count(Member.id)).where(Member.allocation_percentage > 1.0)
    )).scalar_one()

    # Under-utilized resources (0 < allocation_percentage < 1.0)
    under_alloc = (await db.execute(
        select(sqlfunc.count(Member.id)).where(
            Member.allocation_percentage > 0,
            Member.allocation_percentage < 1.0,
        )
    )).scalar_one()

    # Optimal resources (allocation_percentage == 1.0)
    optimal = (await db.execute(
        select(sqlfunc.count(Member.id)).where(Member.allocation_percentage == 1.0)
    )).scalar_one()

    # Unallocated (allocation_percentage == 0)
    unallocated = (await db.execute(
        select(sqlfunc.count(Member.id)).where(Member.allocation_percentage == 0)
    )).scalar_one()

    # Projects by state
    state_counts = {}
    for state in ItemState:
        count = (await db.execute(
            select(sqlfunc.count(Project.id)).where(Project.state == state)
        )).scalar_one()
        state_counts[state.value] = count

    return {
        "total_projects": proj_count,
        "active_milestones": active_ms,
        "total_members": member_count,
        "over_allocated_resources": over_alloc,
        "under_utilized_resources": under_alloc,
        "optimal_resources": optimal,
        "unallocated_resources": unallocated,
        "projects_by_state": state_counts,
    }


@router.get("/resource-health")
async def resource_health(db: AsyncSession = Depends(get_db)):
    """Resource allocation health data for charts."""
    result = await db.execute(
        select(
            Member.id, Member.name, Member.email,
            Member.allocation_percentage, Member.overall_avg_velocity,
        ).order_by(Member.name)
    )
    members = []
    for row in result.all():
        status = "unallocated"
        if row[3] > 1.0:
            status = "over_allocated"
        elif row[3] == 1.0:
            status = "optimal"
        elif row[3] > 0:
            status = "under_utilized"

        members.append({
            "id": row[0],
            "name": row[1],
            "email": row[2],
            "allocation_percentage": row[3],
            "overall_avg_velocity": row[4],
            "status": status,
        })
    return members


@router.get("/project-timeline")
async def project_timeline(db: AsyncSession = Depends(get_db)):
    """Timeline data for all projects with their phases and milestones (for Gantt chart)."""
    result = await db.execute(
        select(Project).order_by(Project.name)
    )
    projects = result.scalars().all()

    timeline = []
    for proj in projects:
        phase_result = await db.execute(
            select(Phase).where(Phase.project_id == proj.id).order_by(Phase.order_index)
        )
        phases_data = []
        for phase in phase_result.scalars().all():
            ms_result = await db.execute(
                select(Milestone).where(Milestone.phase_id == phase.id).order_by(Milestone.order_index)
            )
            milestones_data = []
            for ms in ms_result.scalars().all():
                milestones_data.append({
                    "id": ms.id,
                    "name": ms.name,
                    "state": ms.state.value,
                    "is_placeholder": ms.is_placeholder,
                    "total_estimated_points": ms.total_estimated_points,
                    "num_allocated_resources": ms.num_allocated_resources,
                    "start_date": str(ms.actual_start_date or ms.original_start_date or ""),
                    "end_date": str(ms.adaptive_end_date or ms.original_end_date or ""),
                    "original_end_date": str(ms.original_end_date or ""),
                })
            phases_data.append({
                "id": phase.id,
                "name": phase.name,
                "state": phase.state.value,
                "is_placeholder": phase.is_placeholder,
                "start_date": str(phase.actual_start_date or phase.original_start_date or ""),
                "end_date": str(phase.adaptive_end_date or phase.original_end_date or ""),
                "milestones": milestones_data,
            })
        timeline.append({
            "id": proj.id,
            "name": proj.name,
            "state": proj.state.value,
            "start_date": str(proj.actual_start_date or proj.original_start_date or ""),
            "end_date": str(proj.adaptive_end_date or proj.original_end_date or ""),
            "phases": phases_data,
        })

    return timeline
