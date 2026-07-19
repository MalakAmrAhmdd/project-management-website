# async def milestone_contribution_matrix(self):
#         result = await self.db.execute(
#         select(Allocation, Member)
#         .join(Member, Allocation.member_id == Member.id)
#         .where(Allocation.milestone_id == self.model.milestone_id)
#     )

# async def member_contribution_matrix(self):
#     result = await db.execute(
#         select(Allocation, Milestone, Phase, Project)
#         .join(Milestone, Allocation.milestone_id == Milestone.id)
#         .join(Phase, Milestone.phase_id == Phase.id)
#         .join(Project, Phase.project_id == Project.id)
#         .where(Allocation.member_id == member_id)
#     )
    