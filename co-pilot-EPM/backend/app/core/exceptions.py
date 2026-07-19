from fastapi import FastAPI
from sqlalchemy.exc import IntegrityError
from fastapi.responses import JSONResponse


async def integrity_error_handler(request, exc: IntegrityError):
    return JSONResponse(
        status_code=400,
        content={"detail": "Invalid team_id — team does not exist"},
    )