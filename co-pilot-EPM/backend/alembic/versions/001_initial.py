"""initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-03-31

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Teams
    op.create_table(
        "teams",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False, unique=True),
        sa.Column("description", sa.String(1000), server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Members
    op.create_table(
        "members",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("role", sa.String(255), server_default="Engineer"),
        sa.Column("team_id", sa.Integer(), sa.ForeignKey("teams.id", ondelete="CASCADE"), nullable=False),
        sa.Column("allocation_percentage", sa.Float(), server_default="0"),
        sa.Column("overall_avg_velocity", sa.Float(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # State enum (used by multiple tables)
    item_state = sa.Enum("NOT_STARTED", "ACTIVE", "ON_HOLD", "PENDING", "COMPLETED", name="itemstate")

    # Projects
    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(2000), server_default=""),
        sa.Column("state", item_state, nullable=False, server_default="NOT_STARTED"),
        sa.Column("total_estimated_points", sa.Float(), server_default="0"),
        sa.Column("num_allocated_resources", sa.Integer(), server_default="0"),
        sa.Column("original_start_date", sa.Date(), nullable=True),
        sa.Column("original_end_date", sa.Date(), nullable=True),
        sa.Column("actual_start_date", sa.Date(), nullable=True),
        sa.Column("adaptive_end_date", sa.Date(), nullable=True),
        sa.Column("team_id", sa.Integer(), sa.ForeignKey("teams.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Phases
    op.create_table(
        "phases",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(2000), server_default=""),
        sa.Column("state", item_state, nullable=False, server_default="NOT_STARTED"),
        sa.Column("order_index", sa.Integer(), server_default="0"),
        sa.Column("is_placeholder", sa.Boolean(), server_default="false"),
        sa.Column("total_estimated_points", sa.Float(), server_default="0"),
        sa.Column("num_allocated_resources", sa.Integer(), server_default="0"),
        sa.Column("original_start_date", sa.Date(), nullable=True),
        sa.Column("original_end_date", sa.Date(), nullable=True),
        sa.Column("actual_start_date", sa.Date(), nullable=True),
        sa.Column("adaptive_end_date", sa.Date(), nullable=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Milestones
    op.create_table(
        "milestones",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(2000), server_default=""),
        sa.Column("state", item_state, nullable=False, server_default="NOT_STARTED"),
        sa.Column("order_index", sa.Integer(), server_default="0"),
        sa.Column("is_placeholder", sa.Boolean(), server_default="false"),
        sa.Column("total_estimated_points", sa.Float(), server_default="0"),
        sa.Column("num_allocated_resources", sa.Integer(), server_default="0"),
        sa.Column("original_start_date", sa.Date(), nullable=True),
        sa.Column("original_end_date", sa.Date(), nullable=True),
        sa.Column("actual_start_date", sa.Date(), nullable=True),
        sa.Column("adaptive_end_date", sa.Date(), nullable=True),
        sa.Column("phase_id", sa.Integer(), sa.ForeignKey("phases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Epics
    op.create_table(
        "epics",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(2000), server_default=""),
        sa.Column("state", item_state, nullable=False, server_default="NOT_STARTED"),
        sa.Column("order_index", sa.Integer(), server_default="0"),
        sa.Column("is_placeholder", sa.Boolean(), server_default="false"),
        sa.Column("total_estimated_points", sa.Float(), server_default="0"),
        sa.Column("num_allocated_resources", sa.Integer(), server_default="0"),
        sa.Column("original_start_date", sa.Date(), nullable=True),
        sa.Column("original_end_date", sa.Date(), nullable=True),
        sa.Column("actual_start_date", sa.Date(), nullable=True),
        sa.Column("adaptive_end_date", sa.Date(), nullable=True),
        sa.Column("milestone_id", sa.Integer(), sa.ForeignKey("milestones.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Stories
    op.create_table(
        "stories",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(2000), server_default=""),
        sa.Column("state", item_state, nullable=False, server_default="NOT_STARTED"),
        sa.Column("order_index", sa.Integer(), server_default="0"),
        sa.Column("is_placeholder", sa.Boolean(), server_default="false"),
        sa.Column("estimated_points", sa.Float(), server_default="0"),
        sa.Column("epic_id", sa.Integer(), sa.ForeignKey("epics.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Allocations
    op.create_table(
        "allocations",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("member_id", sa.Integer(), sa.ForeignKey("members.id", ondelete="CASCADE"), nullable=False),
        sa.Column("milestone_id", sa.Integer(), sa.ForeignKey("milestones.id", ondelete="CASCADE"), nullable=False),
        sa.Column("velocity_if_100_pct", sa.Float(), server_default="0"),
        sa.Column("contribution_percentage", sa.Float(), server_default="1"),
        sa.Column("effective_velocity", sa.Float(), server_default="0"),
        sa.Column("average_fto", sa.Float(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("member_id", "milestone_id", name="uq_member_milestone"),
    )

    # Change Logs
    op.create_table(
        "change_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=False),
        sa.Column("field_changed", sa.String(255), nullable=False),
        sa.Column("old_value", sa.String(1000), nullable=True),
        sa.Column("new_value", sa.String(1000), nullable=True),
        sa.Column("reason", sa.String(2000), server_default=""),
        sa.Column("changed_by", sa.String(255), server_default="system"),
        sa.Column("changed_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Indexes
    op.create_index("ix_phases_project_id", "phases", ["project_id"])
    op.create_index("ix_milestones_phase_id", "milestones", ["phase_id"])
    op.create_index("ix_epics_milestone_id", "epics", ["milestone_id"])
    op.create_index("ix_stories_epic_id", "stories", ["epic_id"])
    op.create_index("ix_allocations_member_id", "allocations", ["member_id"])
    op.create_index("ix_allocations_milestone_id", "allocations", ["milestone_id"])
    op.create_index("ix_change_logs_entity", "change_logs", ["entity_type", "entity_id"])


def downgrade() -> None:
    op.drop_table("change_logs")
    op.drop_table("allocations")
    op.drop_table("stories")
    op.drop_table("epics")
    op.drop_table("milestones")
    op.drop_table("phases")
    op.drop_table("projects")
    op.drop_table("members")
    op.drop_table("teams")
    sa.Enum(name="itemstate").drop(op.get_bind(), checkfirst=True)
