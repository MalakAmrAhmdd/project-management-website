"""
Seed script — populates the database with sample data for development.
Run: python -m app.seed
"""

import asyncio
from datetime import date
from sqlalchemy import select, text
from app.core.database import AsyncSessionLocal
from app.models import Team, Member, Project, Phase, Milestone, Epic, Story, Allocation, ItemState


async def seed():
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        result = await db.execute(select(Team).limit(1))
        if result.scalar_one_or_none():
            print("Database already seeded, skipping.")
            return

        print("Seeding database...")

        # ── Teams ──
        team_fe = Team(name="Frontend Team", description="Responsible for UI/UX development")
        team_be = Team(name="Backend Team", description="Responsible for API and services")
        team_qa = Team(name="QA Team", description="Quality Assurance and testing")
        db.add_all([team_fe, team_be, team_qa])
        await db.flush()

        # ── Members ──
        members_data = [
            ("Alice Johnson", "alice@ebs.com", "Senior Engineer", team_fe.id),
            ("Bob Smith", "bob@ebs.com", "Engineer", team_fe.id),
            ("Carol Williams", "carol@ebs.com", "Tech Lead", team_be.id),
            ("David Brown", "david@ebs.com", "Senior Engineer", team_be.id),
            ("Eva Martinez", "eva@ebs.com", "Engineer", team_be.id),
            ("Frank Lee", "frank@ebs.com", "QA Engineer", team_qa.id),
            ("Grace Kim", "grace@ebs.com", "QA Lead", team_qa.id),
            ("Henry Chen", "henry@ebs.com", "DevOps Engineer", team_be.id),
        ]
        members = []
        for name, email, role, team_id in members_data:
            m = Member(name=name, email=email, role=role, team_id=team_id)
            db.add(m)
            members.append(m)
        await db.flush()

        # ── Project 1: EBS Platform Modernization ──
        proj1 = Project(
            name="EBS Platform Modernization",
            description="Comprehensive modernization of the EBS engineering platform",
            state=ItemState.ACTIVE,
            original_start_date=date(2026, 1, 6),
            actual_start_date=date(2026, 1, 6),
            original_end_date=date(2026, 9, 30),
            team_id=team_be.id,
        )
        db.add(proj1)
        await db.flush()

        # Phase 1: Foundation
        p1_phase1 = Phase(
            name="Foundation",
            description="Infrastructure and core services setup",
            state=ItemState.ACTIVE,
            order_index=0,
            project_id=proj1.id,
            original_start_date=date(2026, 1, 6),
            actual_start_date=date(2026, 1, 6),
            total_estimated_points=120,
        )
        db.add(p1_phase1)
        await db.flush()

        # Milestone 1.1: Infrastructure Setup
        ms1_1 = Milestone(
            name="Infrastructure Setup",
            description="Docker, CI/CD, monitoring setup",
            state=ItemState.ACTIVE,
            order_index=0,
            phase_id=p1_phase1.id,
            total_estimated_points=50,
            original_start_date=date(2026, 1, 6),
            actual_start_date=date(2026, 1, 6),
            original_end_date=date(2026, 2, 14),
        )
        db.add(ms1_1)
        await db.flush()

        # Epic under ms1_1
        epic1_1_1 = Epic(
            name="Docker Infrastructure",
            state=ItemState.ACTIVE,
            order_index=0,
            milestone_id=ms1_1.id,
            total_estimated_points=30,
            original_start_date=date(2026, 1, 6),
            actual_start_date=date(2026, 1, 6),
        )
        epic1_1_2 = Epic(
            name="CI/CD Pipeline",
            state=ItemState.ACTIVE,
            order_index=1,
            milestone_id=ms1_1.id,
            total_estimated_points=20,
            original_start_date=date(2026, 1, 20),
        )
        db.add_all([epic1_1_1, epic1_1_2])
        await db.flush()

        # Stories
        for i, (name, pts) in enumerate([
            ("Setup Docker Compose", 8), ("Configure PostgreSQL", 5),
            ("Setup backend Dockerfile", 5), ("Setup frontend Dockerfile", 5),
            ("Configure volumes and networks", 7),
        ]):
            db.add(Story(name=name, estimated_points=pts, epic_id=epic1_1_1.id, order_index=i, state=ItemState.ACTIVE))

        for i, (name, pts) in enumerate([
            ("Setup GitHub Actions", 8), ("Configure linting", 5),
            ("Setup automated tests", 7),
        ]):
            db.add(Story(name=name, estimated_points=pts, epic_id=epic1_1_2.id, order_index=i, state=ItemState.ACTIVE))
        await db.flush()

        # Milestone 1.2: Core API Development
        ms1_2 = Milestone(
            name="Core API Development",
            description="Core REST API endpoints",
            state=ItemState.ACTIVE,
            order_index=1,
            phase_id=p1_phase1.id,
            total_estimated_points=70,
            original_start_date=date(2026, 2, 17),
            original_end_date=date(2026, 4, 10),
        )
        db.add(ms1_2)
        await db.flush()

        epic1_2_1 = Epic(
            name="User Management API",
            state=ItemState.ACTIVE,
            order_index=0,
            milestone_id=ms1_2.id,
            total_estimated_points=35,
            original_start_date=date(2026, 2, 17),
        )
        epic1_2_2 = Epic(
            name="Project Management API",
            state=ItemState.NOT_STARTED,
            order_index=1,
            milestone_id=ms1_2.id,
            total_estimated_points=35,
        )
        db.add_all([epic1_2_1, epic1_2_2])
        await db.flush()

        for i, (name, pts) in enumerate([
            ("Auth endpoints", 10), ("User CRUD", 8), ("Role management", 8), ("Team management", 9),
        ]):
            db.add(Story(name=name, estimated_points=pts, epic_id=epic1_2_1.id, order_index=i, state=ItemState.ACTIVE))

        for i, (name, pts) in enumerate([
            ("Project CRUD", 10), ("Phase/Milestone CRUD", 12),
            ("Epic/Story CRUD", 13),
        ]):
            db.add(Story(name=name, estimated_points=pts, epic_id=epic1_2_2.id, order_index=i))
        await db.flush()

        # Phase 2: Frontend Development
        p1_phase2 = Phase(
            name="Frontend Development",
            description="React/Next.js frontend",
            state=ItemState.NOT_STARTED,
            order_index=1,
            project_id=proj1.id,
            original_start_date=date(2026, 4, 13),
            total_estimated_points=150,
        )
        db.add(p1_phase2)
        await db.flush()

        ms2_1 = Milestone(
            name="UI Component Library",
            description="Shared components and design system",
            state=ItemState.NOT_STARTED,
            order_index=0,
            phase_id=p1_phase2.id,
            total_estimated_points=60,
            original_start_date=date(2026, 4, 13),
            original_end_date=date(2026, 5, 22),
        )
        ms2_2 = Milestone(
            name="Dashboard & Views",
            description="Main application views",
            state=ItemState.NOT_STARTED,
            order_index=1,
            phase_id=p1_phase2.id,
            total_estimated_points=90,
            original_start_date=date(2026, 5, 25),
            original_end_date=date(2026, 7, 31),
        )
        db.add_all([ms2_1, ms2_2])
        await db.flush()

        # Placeholder epics/stories for phase 2 milestones
        for ms in [ms2_1, ms2_2]:
            e = Epic(name=f"Epic (Placeholder)", milestone_id=ms.id, order_index=0, is_placeholder=True, state=ItemState.NOT_STARTED)
            db.add(e)
            await db.flush()
            db.add(Story(name="Story (Placeholder)", epic_id=e.id, order_index=0, is_placeholder=True, state=ItemState.NOT_STARTED))
        await db.flush()

        # ── Project 2: Data Analytics Platform ──
        proj2 = Project(
            name="Data Analytics Platform",
            description="Real-time data analytics and reporting platform",
            state=ItemState.NOT_STARTED,
            original_start_date=date(2026, 3, 2),
            original_end_date=date(2026, 12, 18),
            team_id=team_fe.id,
        )
        db.add(proj2)
        await db.flush()

        p2_phase1 = Phase(
            name="Data Pipeline",
            state=ItemState.NOT_STARTED,
            order_index=0,
            project_id=proj2.id,
            total_estimated_points=100,
            original_start_date=date(2026, 3, 2),
        )
        db.add(p2_phase1)
        await db.flush()

        ms3_1 = Milestone(
            name="ETL Framework",
            state=ItemState.NOT_STARTED,
            order_index=0,
            phase_id=p2_phase1.id,
            total_estimated_points=100,
            original_start_date=date(2026, 3, 2),
            original_end_date=date(2026, 5, 29),
        )
        db.add(ms3_1)
        await db.flush()

        e_placeholder = Epic(name="ETL Epic (Placeholder)", milestone_id=ms3_1.id, order_index=0, is_placeholder=True, state=ItemState.NOT_STARTED)
        db.add(e_placeholder)
        await db.flush()
        db.add(Story(name="ETL Story (Placeholder)", epic_id=e_placeholder.id, order_index=0, is_placeholder=True))
        await db.flush()

        # ── Allocations ──
        # Alice → ms1_1 (Infrastructure Setup) — 60% contribution, 10 pts/wk
        alloc1 = Allocation(
            member_id=members[0].id, milestone_id=ms1_1.id,
            velocity_if_100_pct=10.0, contribution_percentage=0.6,
            effective_velocity=6.0, average_fto=0.5,
        )
        # Bob → ms1_1 — 40%, 8 pts/wk
        alloc2 = Allocation(
            member_id=members[1].id, milestone_id=ms1_1.id,
            velocity_if_100_pct=8.0, contribution_percentage=0.4,
            effective_velocity=3.2, average_fto=0.3,
        )
        # Carol → ms1_2 (Core API) — 80%, 12 pts/wk
        alloc3 = Allocation(
            member_id=members[2].id, milestone_id=ms1_2.id,
            velocity_if_100_pct=12.0, contribution_percentage=0.8,
            effective_velocity=9.6, average_fto=0.2,
        )
        # David → ms1_2 — 50%, 10 pts/wk
        alloc4 = Allocation(
            member_id=members[3].id, milestone_id=ms1_2.id,
            velocity_if_100_pct=10.0, contribution_percentage=0.5,
            effective_velocity=5.0, average_fto=0.4,
        )
        # Eva → ms1_1 — 30%, 9 pts/wk AND ms1_2 — 70%, 9 pts/wk (totals 1.0)
        alloc5 = Allocation(
            member_id=members[4].id, milestone_id=ms1_1.id,
            velocity_if_100_pct=9.0, contribution_percentage=0.3,
            effective_velocity=2.7, average_fto=0.1,
        )
        alloc6 = Allocation(
            member_id=members[4].id, milestone_id=ms1_2.id,
            velocity_if_100_pct=9.0, contribution_percentage=0.7,
            effective_velocity=6.3, average_fto=0.1,
        )
        # Alice also on ms1_2 — 50% (total allocation 1.1 — OVER-ALLOCATED!)
        alloc7 = Allocation(
            member_id=members[0].id, milestone_id=ms1_2.id,
            velocity_if_100_pct=10.0, contribution_percentage=0.5,
            effective_velocity=5.0, average_fto=0.5,
        )
        db.add_all([alloc1, alloc2, alloc3, alloc4, alloc5, alloc6, alloc7])
        await db.flush()

        # Update member allocation percentages
        # Alice: 0.6 + 0.5 = 1.1 (over-allocated)
        members[0].allocation_percentage = 1.1
        members[0].overall_avg_velocity = (6.0 + 5.0) / 2
        # Bob: 0.4 (under-utilized)
        members[1].allocation_percentage = 0.4
        members[1].overall_avg_velocity = 3.2
        # Carol: 0.8 (under-utilized)
        members[2].allocation_percentage = 0.8
        members[2].overall_avg_velocity = 9.6
        # David: 0.5 (under-utilized)
        members[3].allocation_percentage = 0.5
        members[3].overall_avg_velocity = 5.0
        # Eva: 0.3 + 0.7 = 1.0 (optimal)
        members[4].allocation_percentage = 1.0
        members[4].overall_avg_velocity = (2.7 + 6.3) / 2

        # Update milestone resource counts
        ms1_1.num_allocated_resources = 3  # Alice, Bob, Eva
        ms1_2.num_allocated_resources = 4  # Carol, David, Eva, Alice

        # Compute adaptive end dates for active milestones
        # ms1_1: 50 points / (6.0 + 3.2 + 2.7) = 50/11.9 ≈ 4.2 weeks ≈ 21 business days
        from app.services.calculation_engine import _add_business_days, _weeks_to_business_days
        ms1_1.adaptive_end_date = _add_business_days(date(2026, 1, 6), _weeks_to_business_days(50/11.9))
        # ms1_2: 70 points / (9.6 + 5.0 + 6.3 + 5.0) = 70/25.9 ≈ 2.7 weeks ≈ 14 business days
        ms1_2.adaptive_end_date = _add_business_days(date(2026, 2, 17), _weeks_to_business_days(70/25.9))

        # Update phase and project
        p1_phase1.num_allocated_resources = 5
        p1_phase1.adaptive_end_date = max(ms1_1.adaptive_end_date, ms1_2.adaptive_end_date)
        proj1.num_allocated_resources = 5
        proj1.adaptive_end_date = p1_phase1.adaptive_end_date

        await db.commit()
        print("Database seeded successfully!")
        print(f"  Teams: 3")
        print(f"  Members: {len(members)}")
        print(f"  Projects: 2")
        print(f"  Allocations: 7")
        print(f"  Alice allocation: {members[0].allocation_percentage} (OVER-ALLOCATED)")
        print(f"  Eva allocation: {members[4].allocation_percentage} (OPTIMAL)")


if __name__ == "__main__":
    asyncio.run(seed())
