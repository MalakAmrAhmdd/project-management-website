"""
Allocation Service — manages member ↔ milestone allocations,
contribution matrix queries, and triggers recalculation cascades.
"""

from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Allocation, Milestone, Phase, Project, Member, ItemState
from app.services.calculation_engine import (
    recalculate_allocation_effective_velocity,
    recalculate_member,
    cascade_recalculate_from_milestone,
)


async def allocate_member(
    db: AsyncSession,
    member_id: int,
    milestone_id: int,
    velocity_if_100_pct: float = 0.0,
    contribution_percentage: float = 1.0,
    average_fto: float = 0.0,
) -> Allocation:
    """Create a new allocation (member → milestone) and trigger recalculations."""
    alloc = Allocation(
        member_id=member_id,
        milestone_id=milestone_id,
        velocity_if_100_pct=velocity_if_100_pct,
        contribution_percentage=contribution_percentage,
        average_fto=average_fto,
    )
    alloc = await recalculate_allocation_effective_velocity(db, alloc)
    db.add(alloc)
    await db.flush()

    # Trigger cascade
    await cascade_recalculate_from_milestone(
        db, milestone_id, reason=f"Resource {member_id} allocated to milestone {milestone_id}"
    )
    await recalculate_member(db, member_id)

    return alloc


async def update_allocation(
    db: AsyncSession,
    allocation_id: int,
    velocity_if_100_pct: Optional[float] = None,
    contribution_percentage: Optional[float] = None,
    average_fto: Optional[float] = None,
) -> Optional[Allocation]:
    """Update an allocation and trigger recalculations."""
    alloc = await db.get(Allocation, allocation_id)
    if not alloc:
        return None

    if velocity_if_100_pct is not None:
        alloc.velocity_if_100_pct = velocity_if_100_pct
    if contribution_percentage is not None:
        alloc.contribution_percentage = contribution_percentage
    if average_fto is not None:
        alloc.average_fto = average_fto

    alloc = await recalculate_allocation_effective_velocity(db, alloc)

    reason_parts = []
    if velocity_if_100_pct is not None:
        reason_parts.append(f"velocity changed to {velocity_if_100_pct}")
    if contribution_percentage is not None:
        reason_parts.append(f"contribution changed to {contribution_percentage}")
    if average_fto is not None:
        reason_parts.append(f"FTO changed to {average_fto}")
    reason = f"Allocation {allocation_id} updated: {', '.join(reason_parts)}"

    await cascade_recalculate_from_milestone(db, alloc.milestone_id, reason=reason)
    await recalculate_member(db, alloc.member_id)

    return alloc


async def remove_allocation(
    db: AsyncSession,
    allocation_id: int,
) -> bool:
    """Remove an allocation and trigger recalculations."""
    alloc = await db.get(Allocation, allocation_id)
    if not alloc:
        return False

    milestone_id = alloc.milestone_id
    member_id = alloc.member_id

    await db.delete(alloc)
    await db.flush()

    reason = f"Resource {member_id} removed from milestone {milestone_id}"
    await cascade_recalculate_from_milestone(db, milestone_id, reason=reason)
    await recalculate_member(db, member_id)

    return True


async def get_milestone_contribution_matrix(
    db: AsyncSession,
    milestone_id: int,
) -> List[dict]:
    """Get the full contribution matrix for a milestone with member details."""
    result = await db.execute(
        select(Allocation, Member)
        .join(Member, Allocation.member_id == Member.id)
        .where(Allocation.milestone_id == milestone_id)
    )
    rows = result.all()

    matrix = []
    for alloc, member in rows:
        matrix.append({
            "allocation_id": alloc.id,
            "member_id": member.id,
            "member_name": member.name,
            "member_email": member.email,
            "velocity_if_100_pct": alloc.velocity_if_100_pct,
            "contribution_percentage": alloc.contribution_percentage,
            "effective_velocity": alloc.effective_velocity,
            "average_fto": alloc.average_fto,
        })

    return matrix


async def get_member_contribution_matrix(
    db: AsyncSession,
    member_id: int,
) -> List[dict]:
    """Get all active milestone contributions for a member."""
    result = await db.execute(
        select(Allocation, Milestone)
        .join(Milestone, Allocation.milestone_id == Milestone.id)
        .where(Allocation.member_id == member_id)
    )
    rows = result.all()

    matrix = []
    for alloc, milestone in rows:
        # Get parent phase and project for context
        phase = await db.get(Phase, milestone.phase_id)
        project = await db.get(Project, phase.project_id) if phase else None

        matrix.append({
            "allocation_id": alloc.id,
            "milestone_id": milestone.id,
            "milestone_name": milestone.name,
            "milestone_state": milestone.state.value,
            "phase_name": phase.name if phase else "",
            "project_name": project.name if project else "",
            "velocity_if_100_pct": alloc.velocity_if_100_pct,
            "contribution_percentage": alloc.contribution_percentage,
            "effective_velocity": alloc.effective_velocity,
            "average_fto": alloc.average_fto,
        })

    return matrix
