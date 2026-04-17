"""
Calculation Engine — the core computational brain of EBS-EPM.

Handles:
  - Member allocation percentage (sum of contribution % across ACTIVE milestones)
  - Member average velocity (mean of effective velocities across ACTIVE milestones)
  - Milestone adaptive end date (from allocated resources' effective velocity)
  - Phase / Project adaptive end date (cascade from children)
  - Resource count propagation upward
  - Change logging for any date modifications
"""

from datetime import date, timedelta
from typing import Optional
from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    Member, Allocation, Milestone, Epic, Phase, Project, ChangeLog, ItemState
)


def _add_business_days(start: date, business_days: int) -> date:
    """Add business days (Mon-Fri) to a start date."""
    if business_days <= 0:
        return start
    current = start
    added = 0
    while added < business_days:
        current += timedelta(days=1)
        if current.weekday() < 5:  # Mon=0..Fri=4
            added += 1
    return current


def _weeks_to_business_days(weeks: float) -> int:
    """Convert weeks to business days (5 per week)."""
    return max(1, round(weeks * 5))


async def _log_change(
    db: AsyncSession,
    entity_type: str,
    entity_id: int,
    field: str,
    old_val: Optional[str],
    new_val: Optional[str],
    reason: str,
):
    log = ChangeLog(
        entity_type=entity_type,
        entity_id=entity_id,
        field_changed=field,
        old_value=old_val,
        new_value=new_val,
        reason=reason,
    )
    db.add(log)


async def recalculate_member(db: AsyncSession, member_id: int) -> Member:
    """Recalculate a member's allocation_percentage and overall_avg_velocity
    based only on ACTIVE milestone allocations."""
    member = await db.get(Member, member_id)
    if not member:
        return member

    # Fetch allocations joined with milestone to filter by ACTIVE state
    result = await db.execute(
        select(Allocation)
        .join(Milestone, Allocation.milestone_id == Milestone.id)
        .where(
            Allocation.member_id == member_id,
            Milestone.state == ItemState.ACTIVE,
        )
    )
    active_allocs = result.scalars().all()

    total_contribution = sum(a.contribution_percentage for a in active_allocs)
    velocities = [a.effective_velocity for a in active_allocs if a.effective_velocity > 0]
    avg_velocity = (sum(velocities) / len(velocities)) if velocities else 0.0

    member.allocation_percentage = round(total_contribution, 4)
    member.overall_avg_velocity = round(avg_velocity, 2)
    return member


async def recalculate_allocation_effective_velocity(
    db: AsyncSession, allocation: Allocation
) -> Allocation:
    """Update effective_velocity = velocity_if_100_pct * contribution_percentage."""
    allocation.effective_velocity = round(
        allocation.velocity_if_100_pct * allocation.contribution_percentage, 2
    )
    return allocation


async def recalculate_milestone(db: AsyncSession, milestone_id: int, reason: str = "recalculation") -> Optional[Milestone]:
    """Recalculate milestone's adaptive_end_date, num_allocated_resources and total_estimated_points
    from its allocations and epics."""
    milestone = await db.get(Milestone, milestone_id)
    if not milestone:
        return None

    # Recalc total_estimated_points from epics
    ep_result = await db.execute(
        select(sqlfunc.coalesce(sqlfunc.sum(Epic.total_estimated_points), 0.0))
        .where(Epic.milestone_id == milestone_id)
    )
    milestone.total_estimated_points = float(ep_result.scalar_one())

    # Count distinct allocated resources
    alloc_result = await db.execute(
        select(sqlfunc.count(sqlfunc.distinct(Allocation.member_id)))
        .where(Allocation.milestone_id == milestone_id)
    )
    milestone.num_allocated_resources = int(alloc_result.scalar_one())

    # Calculate adaptive end date from velocity
    vel_result = await db.execute(
        select(sqlfunc.coalesce(sqlfunc.sum(Allocation.effective_velocity), 0.0))
        .where(Allocation.milestone_id == milestone_id)
    )
    total_velocity = float(vel_result.scalar_one())

    start = milestone.actual_start_date or milestone.original_start_date
    old_end = str(milestone.adaptive_end_date) if milestone.adaptive_end_date else None

    if total_velocity > 0 and start and milestone.total_estimated_points > 0:
        weeks_needed = milestone.total_estimated_points / total_velocity
        bdays = _weeks_to_business_days(weeks_needed)
        milestone.adaptive_end_date = _add_business_days(start, bdays)
    elif start:
        milestone.adaptive_end_date = start

    new_end = str(milestone.adaptive_end_date) if milestone.adaptive_end_date else None
    if old_end != new_end:
        await _log_change(db, "milestone", milestone_id, "adaptive_end_date", old_end, new_end, reason)

    return milestone


async def recalculate_phase(db: AsyncSession, phase_id: int, reason: str = "recalculation") -> Optional[Phase]:
    """Recalculate phase dates and points from child milestones."""
    phase = await db.get(Phase, phase_id)
    if not phase:
        return None

    ms_result = await db.execute(
        select(Milestone).where(Milestone.phase_id == phase_id).order_by(Milestone.order_index)
    )
    milestones = ms_result.scalars().all()

    if not milestones:
        return phase

    phase.total_estimated_points = sum(m.total_estimated_points for m in milestones)
    phase.num_allocated_resources = len(
        set(m_id for m in milestones for m_id in [m.id])  # will be overridden below
    )

    # Count distinct resources across all milestones in this phase
    res_result = await db.execute(
        select(sqlfunc.count(sqlfunc.distinct(Allocation.member_id)))
        .join(Milestone, Allocation.milestone_id == Milestone.id)
        .where(Milestone.phase_id == phase_id)
    )
    phase.num_allocated_resources = int(res_result.scalar_one())

    # Phase start = earliest milestone start, phase end = latest milestone end
    starts = [m.actual_start_date or m.original_start_date for m in milestones if (m.actual_start_date or m.original_start_date)]
    ends = [m.adaptive_end_date for m in milestones if m.adaptive_end_date]

    if starts:
        earliest = min(starts)
        if not phase.actual_start_date:
            phase.actual_start_date = earliest

    old_end = str(phase.adaptive_end_date) if phase.adaptive_end_date else None
    if ends:
        phase.adaptive_end_date = max(ends)
    new_end = str(phase.adaptive_end_date) if phase.adaptive_end_date else None

    if old_end != new_end:
        await _log_change(db, "phase", phase_id, "adaptive_end_date", old_end, new_end, reason)

    return phase


async def recalculate_project(db: AsyncSession, project_id: int, reason: str = "recalculation") -> Optional[Project]:
    """Recalculate project dates and points from child phases."""
    project = await db.get(Project, project_id)
    if not project:
        return None

    ph_result = await db.execute(
        select(Phase).where(Phase.project_id == project_id).order_by(Phase.order_index)
    )
    phases = ph_result.scalars().all()

    if not phases:
        return project

    project.total_estimated_points = sum(p.total_estimated_points for p in phases)

    # Distinct resources across all phases
    res_result = await db.execute(
        select(sqlfunc.count(sqlfunc.distinct(Allocation.member_id)))
        .join(Milestone, Allocation.milestone_id == Milestone.id)
        .join(Phase, Milestone.phase_id == Phase.id)
        .where(Phase.project_id == project_id)
    )
    project.num_allocated_resources = int(res_result.scalar_one())

    starts = [p.actual_start_date or p.original_start_date for p in phases if (p.actual_start_date or p.original_start_date)]
    ends = [p.adaptive_end_date for p in phases if p.adaptive_end_date]

    if starts:
        earliest = min(starts)
        if not project.actual_start_date:
            project.actual_start_date = earliest

    old_end = str(project.adaptive_end_date) if project.adaptive_end_date else None
    if ends:
        project.adaptive_end_date = max(ends)
    new_end = str(project.adaptive_end_date) if project.adaptive_end_date else None

    if old_end != new_end:
        await _log_change(db, "project", project_id, "adaptive_end_date", old_end, new_end, reason)

    return project


async def cascade_recalculate_from_milestone(
    db: AsyncSession, milestone_id: int, reason: str = "recalculation"
):
    """Recalculate milestone → phase → project, all affected members,
    and propagate a moved adaptive_end_date to the next sibling milestone."""
    milestone = await recalculate_milestone(db, milestone_id, reason)
    if not milestone:
        return

    # Recalculate all members allocated to this milestone
    alloc_result = await db.execute(
        select(Allocation.member_id).where(Allocation.milestone_id == milestone_id).distinct()
    )
    member_ids = [row[0] for row in alloc_result.all()]
    for mid in member_ids:
        await recalculate_member(db, mid)

    # ── Propagate adaptive_end_date to the next sibling milestone ──────────────
    # Only push the next milestone's start date when the updated adaptive_end_date
    # would cause an overlap (i.e. next_start <= this adaptive_end_date).
    if milestone.adaptive_end_date:
        siblings_result = await db.execute(
            select(Milestone)
            .where(
                Milestone.phase_id == milestone.phase_id,
                Milestone.name != "Gap Placeholder",   # exclude gap fillers
                Milestone.order_index > milestone.order_index,
            )
            .order_by(Milestone.order_index)
            .limit(1)
        )
        next_ms = siblings_result.scalar_one_or_none()
        if next_ms:
            next_start = next_ms.actual_start_date or next_ms.original_start_date
            new_next_start = milestone.adaptive_end_date + timedelta(days=1)
            # Update iff overlap would occur or dates are directly contiguous
            if next_start is None or next_start <= milestone.adaptive_end_date:
                next_ms.original_start_date = new_next_start
                next_ms.actual_start_date = new_next_start
                await _log_change(
                    db, "milestone", next_ms.id, "actual_start_date",
                    str(next_start), str(new_next_start),
                    f"Start date pushed by preceding milestone (id={milestone_id}) recalculation",
                )
                # Recalculate the next milestone with its new start date
                await recalculate_milestone(db, next_ms.id, reason="Start date propagated from previous milestone")

    # Recalculate parent phase
    await recalculate_phase(db, milestone.phase_id, reason)

    # Recalculate parent project
    phase = await db.get(Phase, milestone.phase_id)
    if phase:
        await recalculate_project(db, phase.project_id, reason)


async def cascade_recalculate_from_phase(
    db: AsyncSession, phase_id: int, reason: str = "recalculation"
):
    """Recalculate all milestones in phase, then phase → project."""
    ms_result = await db.execute(
        select(Milestone.id).where(Milestone.phase_id == phase_id)
    )
    for (ms_id,) in ms_result.all():
        await recalculate_milestone(db, ms_id, reason)

    await recalculate_phase(db, phase_id, reason)

    phase = await db.get(Phase, phase_id)
    if phase:
        await recalculate_project(db, phase.project_id, reason)


async def cascade_recalculate_from_project(
    db: AsyncSession, project_id: int, reason: str = "recalculation"
):
    """Full top-down recalculation of a project."""
    ph_result = await db.execute(
        select(Phase.id).where(Phase.project_id == project_id)
    )
    for (ph_id,) in ph_result.all():
        await cascade_recalculate_from_phase(db, ph_id, reason)
