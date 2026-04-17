"""
Placeholder Service — manages automatic creation of placeholder hierarchy items
and consumption/expansion logic when real items are added.

Rules:
  - Creating a Project auto-creates: 1 placeholder Phase → 1 placeholder Milestone → 1 placeholder Epic → 1 placeholder Story
  - Adding a child under a parent consumes a placeholder if any remain; otherwise expands the parent
  - Timeline gaps between consecutive milestones/phases auto-fill with placeholder entries
"""

from typing import Optional
from datetime import date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Phase, Milestone, Epic, Story, ItemState


async def create_project_placeholders(
    db: AsyncSession,
    project_id: int,
    start_date: Optional[date] = None,
) -> Phase:
    """Create the full placeholder hierarchy for a new project."""
    phase = Phase(
        name="Phase 1 (Placeholder)",
        project_id=project_id,
        order_index=0,
        is_placeholder=True,
        state=ItemState.NOT_STARTED,
        original_start_date=start_date,
        actual_start_date=start_date,
    )
    db.add(phase)
    await db.flush()

    milestone = Milestone(
        name="Milestone 1 (Placeholder)",
        phase_id=phase.id,
        order_index=0,
        is_placeholder=True,
        state=ItemState.NOT_STARTED,
        original_start_date=start_date,
        actual_start_date=start_date,
    )
    db.add(milestone)
    await db.flush()

    epic = Epic(
        name="Epic 1 (Placeholder)",
        milestone_id=milestone.id,
        order_index=0,
        is_placeholder=True,
        state=ItemState.NOT_STARTED,
        original_start_date=start_date,
        actual_start_date=start_date,
    )
    db.add(epic)
    await db.flush()

    story = Story(
        name="Story 1 (Placeholder)",
        epic_id=epic.id,
        order_index=0,
        is_placeholder=True,
        state=ItemState.NOT_STARTED,
    )
    db.add(story)
    await db.flush()

    return phase


async def consume_or_expand_phase(
    db: AsyncSession,
    project_id: int,
    new_phase_data: dict,
) -> tuple[Phase, bool]:
    """Try to consume a placeholder phase; if none, create new and expand project.
    Returns (phase, was_placeholder_consumed)."""
    # Find first placeholder phase in project
    result = await db.execute(
        select(Phase)
        .where(Phase.project_id == project_id, Phase.is_placeholder == True)
        .order_by(Phase.order_index)
        .limit(1)
    )
    placeholder = result.scalar_one_or_none()

    if placeholder:
        # Consume the placeholder — update it with real data
        for key, value in new_phase_data.items():
            if value is not None:
                setattr(placeholder, key, value)
        placeholder.is_placeholder = False
        return placeholder, True
    else:
        # No placeholder to consume — add new phase, expanding parent
        # Determine next order_index
        result = await db.execute(
            select(Phase.order_index)
            .where(Phase.project_id == project_id)
            .order_by(Phase.order_index.desc())
            .limit(1)
        )
        max_idx = result.scalar_one_or_none() or 0
        # Remove is_placeholder from data to avoid duplicate keyword argument
        new_phase_data.pop("is_placeholder", None)
        new_phase = Phase(
            project_id=project_id,
            order_index=max_idx + 1,
            is_placeholder=False,
            **new_phase_data,
        )
        db.add(new_phase)
        await db.flush()

        # Create milestone placeholder under it
        ms = Milestone(
            name=f"Milestone 1 (Placeholder)",
            phase_id=new_phase.id,
            order_index=0,
            is_placeholder=True,
            state=ItemState.NOT_STARTED,
            original_start_date=new_phase.original_start_date,
            actual_start_date=new_phase.actual_start_date,
        )
        db.add(ms)
        await db.flush()
        epic = Epic(
            name="Epic 1 (Placeholder)",
            milestone_id=ms.id,
            order_index=0,
            is_placeholder=True,
            state=ItemState.NOT_STARTED,
        )
        db.add(epic)
        await db.flush()
        story = Story(
            name="Story 1 (Placeholder)",
            epic_id=epic.id,
            order_index=0,
            is_placeholder=True,
            state=ItemState.NOT_STARTED,
        )
        db.add(story)
        await db.flush()
        return new_phase, False


async def consume_or_expand_milestone(
    db: AsyncSession,
    phase_id: int,
    new_ms_data: dict,
) -> tuple[Milestone, bool]:
    """Try to consume a placeholder milestone; if none, create new."""
    result = await db.execute(
        select(Milestone)
        .where(Milestone.phase_id == phase_id, Milestone.is_placeholder == True)
        .order_by(Milestone.order_index)
        .limit(1)
    )
    placeholder = result.scalar_one_or_none()

    if placeholder:
        for key, value in new_ms_data.items():
            if value is not None:
                setattr(placeholder, key, value)
        placeholder.is_placeholder = False
        return placeholder, True
    else:
        result = await db.execute(
            select(Milestone.order_index)
            .where(Milestone.phase_id == phase_id)
            .order_by(Milestone.order_index.desc())
            .limit(1)
        )
        max_idx = result.scalar_one_or_none() or 0
        new_ms_data.pop("is_placeholder", None)
        new_ms = Milestone(
            phase_id=phase_id,
            order_index=max_idx + 1,
            is_placeholder=False,
            **new_ms_data,
        )
        db.add(new_ms)
        await db.flush()
        # Create epic + story placeholder
        epic = Epic(name="Epic 1 (Placeholder)", milestone_id=new_ms.id,
                     order_index=0, is_placeholder=True, state=ItemState.NOT_STARTED)
        db.add(epic)
        await db.flush()
        story = Story(name="Story 1 (Placeholder)", epic_id=epic.id,
                       order_index=0, is_placeholder=True, state=ItemState.NOT_STARTED)
        db.add(story)
        await db.flush()
        return new_ms, False


async def consume_or_expand_epic(
    db: AsyncSession,
    milestone_id: int,
    new_epic_data: dict,
) -> tuple[Epic, bool]:
    """Try to consume a placeholder epic; if none, create new."""
    result = await db.execute(
        select(Epic)
        .where(Epic.milestone_id == milestone_id, Epic.is_placeholder == True)
        .order_by(Epic.order_index)
        .limit(1)
    )
    placeholder = result.scalar_one_or_none()

    if placeholder:
        for key, value in new_epic_data.items():
            if value is not None:
                setattr(placeholder, key, value)
        placeholder.is_placeholder = False
        return placeholder, True
    else:
        result = await db.execute(
            select(Epic.order_index)
            .where(Epic.milestone_id == milestone_id)
            .order_by(Epic.order_index.desc())
            .limit(1)
        )
        max_idx = result.scalar_one_or_none() or 0
        new_epic_data.pop("is_placeholder", None)
        new_epic = Epic(
            milestone_id=milestone_id,
            order_index=max_idx + 1,
            is_placeholder=False,
            **new_epic_data,
        )
        db.add(new_epic)
        await db.flush()
        story = Story(name="Story 1 (Placeholder)", epic_id=new_epic.id,
                       order_index=0, is_placeholder=True, state=ItemState.NOT_STARTED)
        db.add(story)
        await db.flush()
        return new_epic, False


async def consume_or_expand_story(
    db: AsyncSession,
    epic_id: int,
    new_story_data: dict,
) -> tuple[Story, bool]:
    """Try to consume a placeholder story; if none, create new."""
    result = await db.execute(
        select(Story)
        .where(Story.epic_id == epic_id, Story.is_placeholder == True)
        .order_by(Story.order_index)
        .limit(1)
    )
    placeholder = result.scalar_one_or_none()

    if placeholder:
        for key, value in new_story_data.items():
            if value is not None:
                setattr(placeholder, key, value)
        placeholder.is_placeholder = False
        return placeholder, True
    else:
        result = await db.execute(
            select(Story.order_index)
            .where(Story.epic_id == epic_id)
            .order_by(Story.order_index.desc())
            .limit(1)
        )
        max_idx = result.scalar_one_or_none() or 0
        new_story_data.pop("is_placeholder", None)
        new_story = Story(
            epic_id=epic_id,
            order_index=max_idx + 1,
            is_placeholder=False,
            **new_story_data,
        )
        db.add(new_story)
        await db.flush()
        return new_story, False


async def fill_milestone_gaps(db: AsyncSession, phase_id: int):
    """Check for timeline gaps between consecutive *real* milestones in a phase.
    Replaces all existing gap placeholders with exactly the ones needed right now,
    preventing duplicates on repeated updates."""
    from datetime import timedelta

    # Step 1 — Remove all stale gap placeholders so we start clean.
    # cascade="all, delete-orphan" on Milestone.epics means child epics/stories
    # are deleted automatically.
    gap_result = await db.execute(
        select(Milestone).where(
            Milestone.phase_id == phase_id,
            Milestone.is_placeholder == True,
            Milestone.name == "Gap Placeholder",
        )
    )
    for gap_ms in gap_result.scalars().all():
        await db.delete(gap_ms)
    await db.flush()

    # Step 2 — Query milestones that remain (real + regular placeholders, no gaps).
    result = await db.execute(
        select(Milestone)
        .where(Milestone.phase_id == phase_id)
        .order_by(Milestone.order_index)
    )
    milestones = list(result.scalars().all())

    if len(milestones) < 2:
        return

    # Step 3 — Find genuine date gaps between consecutive milestones.
    inserts = []
    for i in range(len(milestones) - 1):
        current = milestones[i]
        next_ms = milestones[i + 1]

        current_end = current.adaptive_end_date or current.original_end_date
        next_start = next_ms.actual_start_date or next_ms.original_start_date

        if current_end and next_start and next_start > current_end:
            gap_start = current_end + timedelta(days=1)
            gap_end = next_start - timedelta(days=1)
            # Only insert if there is at least one full day of gap.
            if gap_end >= gap_start:
                inserts.append((current.order_index + 1, gap_start, gap_end))

    # Step 4 — Insert exactly one gap placeholder per gap (reverse order keeps
    # order_index shifts correct).
    for order_idx, gap_start, gap_end in reversed(inserts):
        # Shift all milestones at or after the insertion point.
        shift_result = await db.execute(
            select(Milestone)
            .where(Milestone.phase_id == phase_id, Milestone.order_index >= order_idx)
            .order_by(Milestone.order_index)
        )
        for ms in shift_result.scalars().all():
            ms.order_index += 1

        gap_ms = Milestone(
            name="Gap Placeholder",
            phase_id=phase_id,
            order_index=order_idx,
            is_placeholder=True,
            state=ItemState.NOT_STARTED,
            original_start_date=gap_start,
            actual_start_date=gap_start,
            adaptive_end_date=gap_end,
        )
        db.add(gap_ms)
        await db.flush()

        epic = Epic(
            name="Epic (Gap Placeholder)",
            milestone_id=gap_ms.id,
            order_index=0,
            is_placeholder=True,
            state=ItemState.NOT_STARTED,
        )
        db.add(epic)
        await db.flush()
        story = Story(
            name="Story (Gap Placeholder)",
            epic_id=epic.id,
            order_index=0,
            is_placeholder=True,
            state=ItemState.NOT_STARTED,
        )
        db.add(story)
        await db.flush()
