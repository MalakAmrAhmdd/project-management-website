from fastapi import APIRouter, Depends,Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.core.database import get_db
from app.models import Member
from app.schemas.member import MemberCreate, MemberUpdate, MemberRead, MemberWithContributions
from app.services.allocation_service import get_member_contribution_matrix
from app.dependencies.entities import get_or_404
from app.repositories.member import MemberRepository

router = APIRouter()
member_repo = MemberRepository(Member)

@router.get("/", response_model=List[MemberRead])
async def list_members( team_id: Optional[int] = Query(None), db: AsyncSession = Depends(get_db)):
    return await member_repo.list(team_id, db)

@router.get("/{id}", response_model=MemberRead)
async def get_member(member: Member = Depends(get_or_404(Member))):
    return member

@router.get("/{member_id}/contributions", response_model=MemberWithContributions)
async def get_contributions( db: AsyncSession = Depends(get_db), member: Member = Depends(get_or_404(Member))):
    matrix = await get_member_contribution_matrix(db, member.id)
    member_data = MemberRead.model_validate(member).model_dump()
    return MemberWithContributions(
        **member_data,
        contributions=matrix
    )

@router.post("/", response_model=MemberRead, status_code=201)
async def create_member(data: MemberCreate, db: AsyncSession = Depends(get_db)):
    return await member_repo.create(data, db)

@router.patch("/{id}", response_model=MemberRead)
async def update_member(data: MemberUpdate, db: AsyncSession = Depends(get_db), member: Member = Depends(get_or_404(Member))):
    return await member_repo.update(member, data, db)

@router.delete("/{id}", status_code=204)
async def delete_member(member: Member = Depends(get_or_404(Member)), db: AsyncSession = Depends(get_db)):
    await member_repo.delete(member, db)