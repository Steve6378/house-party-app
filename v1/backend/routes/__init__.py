# Festivio - API Routes
# Version: 0.0.1

from .events import router as events_router
from .ground_truth import router as ground_truth_router
from .auth import router as auth_router

__all__ = ["events_router", "ground_truth_router", "auth_router"]
