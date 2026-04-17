import enum


class ItemState(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    ACTIVE = "ACTIVE"
    ON_HOLD = "ON_HOLD"
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
