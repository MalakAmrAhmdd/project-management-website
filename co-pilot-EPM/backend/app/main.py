from sqlalchemy.exc import IntegrityError
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import teams, members, projects, phases, milestones, epics, stories, allocations, changelog, dashboard
from app.exception_handlers import integrity_error_handler

app = FastAPI(
    title="EBS Project Management",
    description="Engineering Project Management API — mimics Microsoft Project with Excel-like flexibility",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Register the global exception handler for IntegrityError
app.add_exception_handler(IntegrityError, integrity_error_handler)

app.include_router(teams.router, prefix="/api/teams", tags=["Teams"])
app.include_router(members.router, prefix="/api/members", tags=["Members"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(phases.router, prefix="/api/phases", tags=["Phases"])
app.include_router(milestones.router, prefix="/api/milestones", tags=["Milestones"])
app.include_router(epics.router, prefix="/api/epics", tags=["Epics"])
app.include_router(stories.router, prefix="/api/stories", tags=["Stories"])
app.include_router(allocations.router, prefix="/api/allocations", tags=["Allocations"])
app.include_router(changelog.router, prefix="/api/changelog", tags=["ChangeLog"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
