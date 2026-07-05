from fastapi import APIRouter, Depends,Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.database import get_db
from app.models import Member
from app.schemas.member import MemberCreate, MemberUpdate, MemberRead, MemberWithContributions
from app.services.allocation_service import get_member_contribution_matrix
from app.routers.dependencies import get_member_or_404

router = APIRouter()

@router.get("/", response_model=List[MemberRead])
async def list_members(
    team_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Member).order_by(Member.name)
    if team_id is not None:
        q = q.where(Member.team_id == team_id)
    result = await db.execute(q)
    return result.scalars().all()

@router.get("/{member_id}", response_model=MemberRead)
async def get_member(member: Member = Depends(get_member_or_404)):
    return member

@router.get("/{member_id}/contributions", response_model=MemberWithContributions)
async def get_contributions( db: AsyncSession = Depends(get_db), member: Member = Depends(get_member_or_404)):
    matrix = await get_member_contribution_matrix(db, member.id)
    member_data = MemberRead.model_validate(member).model_dump()

    return MemberWithContributions(
        **member_data,
        contribution_matrix=matrix
    )

@router.post("/", response_model=MemberRead, status_code=201)
async def create_member(data: MemberCreate, db: AsyncSession = Depends(get_db)):
    member = Member(**data.model_dump())
    db.add(member)
    await db.flush()
    await db.refresh(member)
    return member

@router.patch("/{member_id}", response_model=MemberRead)
async def update_member(data: MemberUpdate, db: AsyncSession = Depends(get_db), member: Member = Depends(get_member_or_404)):
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(member, key, value)
    await db.flush()
    await db.refresh(member)
    return member

@router.delete("/{member_id}", status_code=204)
async def delete_member(member: Member = Depends(get_member_or_404), db: AsyncSession = Depends(get_db)):
    await db.delete(member)