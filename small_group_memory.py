"""
Small Group Shared Memory System
For persistent friend groups with collaborative decision-making.

Designed for: Your synthetic chat data (6 friends, 16 events, 6 months)

Key Differences from Host Memory:
- No single authority (consensus-based)
- Long-term preference tracking (Jake is always vegetarian)
- Relationship context (Amane/Mahiru dating)
- Multi-event context (remember past decisions)

Architecture:
1. Individual preferences (persistent across events)
2. Group decisions (per-event, consensus-tracked)
3. Relationship graph (who's close to whom)
4. Conversation windows (for complex extraction)
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Literal, Set
from dataclasses import dataclass, field
from pathlib import Path
import json
from enum import Enum


class PreferenceType(str, Enum):
    DIETARY = "dietary"  # Always applies
    BUDGET = "budget"  # Per-event constraint
    VENUE_TYPE = "venue_type"  # Preference (flexible)
    LOCATION = "location"  # Preference (flexible)
    ACTIVITY = "activity"  # Preference (flexible)


class DecisionStatus(str, Enum):
    PROPOSED = "proposed"  # Someone suggested
    DISCUSSING = "discussing"  # Active conversation
    CONSENSUS = "consensus"  # Everyone agreed
    MAJORITY = "majority"  # Most agreed
    DECIDED = "decided"  # Final (may override lack of consensus)
    VETOED = "vetoed"  # Someone rejected hard (dietary, conflict, etc.)


@dataclass
class UserPreference:
    """Long-term user preference (persists across events)"""
    user_id: str
    preference_type: PreferenceType
    value: str  # "vegetarian", "$30-50", "indoor venues", etc.
    strength: Literal["required", "strong", "mild"]  # How flexible?
    first_mentioned: str  # ISO timestamp
    last_confirmed: str  # ISO timestamp
    source_messages: List[str] = field(default_factory=list)


@dataclass
class GroupDecision:
    """A decision made by the group for a specific event"""
    decision_id: str
    event_id: str
    decision_type: str  # "venue", "date", "budget", "activity"
    value: str  # "Thai Temple Restaurant", "March 15th", etc.
    status: DecisionStatus

    # Consensus tracking
    proposed_by: str
    proposed_at: str  # ISO timestamp
    supporting_users: List[str] = field(default_factory=list)
    opposing_users: List[str] = field(default_factory=list)
    neutral_users: List[str] = field(default_factory=list)

    # Context
    reasoning: str = ""  # Why this decision?
    supersedes: Optional[str] = None  # Previous decision it replaces
    source_messages: List[str] = field(default_factory=list)


@dataclass
class Relationship:
    """Relationship between two users"""
    user1_id: str
    user2_id: str
    relationship_type: Literal["dating", "close_friends", "roommates", "acquaintances"]
    strength: float  # 0-1
    first_observed: str
    evidence: List[str] = field(default_factory=list)  # Supporting messages


@dataclass
class ConversationWindow:
    """A chunk of messages about a specific topic"""
    window_id: str
    topic: str  # "budget discussion", "venue selection", "date coordination"
    start_time: str
    end_time: str
    messages: List[Dict]  # Full messages in window
    participants: Set[str] = field(default_factory=set)

    # Extracted information
    decisions: List[GroupDecision] = field(default_factory=list)
    preferences_mentioned: List[UserPreference] = field(default_factory=list)


class SmallGroupMemory:
    """
    Memory system for persistent friend groups.

    Handles the complex extraction problems:
    - Multi-speaker consensus tracking
    - Long-term preference memory
    - Relationship context
    - Conversational reference resolution
    """

    def __init__(self, group_id: str, storage_dir: Path = Path("./group_memory")):
        self.group_id = group_id
        self.storage_dir = storage_dir / group_id
        self.storage_dir.mkdir(parents=True, exist_ok=True)

        # Storage files
        self.preferences_file = self.storage_dir / "user_preferences.json"
        self.decisions_file = self.storage_dir / "group_decisions.json"
        self.relationships_file = self.storage_dir / "relationships.json"
        self.windows_file = self.storage_dir / "conversation_windows.jsonl"

        # In-memory state
        self.user_preferences: Dict[str, List[UserPreference]] = self._load_preferences()
        self.group_decisions: List[GroupDecision] = self._load_decisions()
        self.relationships: List[Relationship] = self._load_relationships()

    def _load_preferences(self) -> Dict[str, List[UserPreference]]:
        """Load user preferences from disk"""
        if not self.preferences_file.exists():
            return {}

        with open(self.preferences_file, 'r') as f:
            data = json.load(f)
            return {
                user_id: [UserPreference(**p) for p in prefs]
                for user_id, prefs in data.items()
            }

    def _save_preferences(self):
        """Save user preferences to disk"""
        with open(self.preferences_file, 'w') as f:
            json.dump(
                {
                    user_id: [
                        {
                            "user_id": p.user_id,
                            "preference_type": p.preference_type.value,
                            "value": p.value,
                            "strength": p.strength,
                            "first_mentioned": p.first_mentioned,
                            "last_confirmed": p.last_confirmed,
                            "source_messages": p.source_messages
                        }
                        for p in prefs
                    ]
                    for user_id, prefs in self.user_preferences.items()
                },
                f,
                indent=2
            )

    def _load_decisions(self) -> List[GroupDecision]:
        """Load group decisions from disk"""
        if not self.decisions_file.exists():
            return []

        with open(self.decisions_file, 'r') as f:
            data = json.load(f)
            return [GroupDecision(**d) for d in data]

    def _save_decisions(self):
        """Save group decisions to disk"""
        with open(self.decisions_file, 'w') as f:
            json.dump(
                [
                    {
                        "decision_id": d.decision_id,
                        "event_id": d.event_id,
                        "decision_type": d.decision_type,
                        "value": d.value,
                        "status": d.status.value,
                        "proposed_by": d.proposed_by,
                        "proposed_at": d.proposed_at,
                        "supporting_users": d.supporting_users,
                        "opposing_users": d.opposing_users,
                        "neutral_users": d.neutral_users,
                        "reasoning": d.reasoning,
                        "supersedes": d.supersedes,
                        "source_messages": d.source_messages
                    }
                    for d in self.group_decisions
                ],
                f,
                indent=2
            )

    def _load_relationships(self) -> List[Relationship]:
        """Load relationships from disk"""
        if not self.relationships_file.exists():
            return []

        with open(self.relationships_file, 'r') as f:
            data = json.load(f)
            return [Relationship(**r) for r in data]

    def _save_relationships(self):
        """Save relationships to disk"""
        with open(self.relationships_file, 'w') as f:
            json.dump(
                [
                    {
                        "user1_id": r.user1_id,
                        "user2_id": r.user2_id,
                        "relationship_type": r.relationship_type,
                        "strength": r.strength,
                        "first_observed": r.first_observed,
                        "evidence": r.evidence
                    }
                    for r in self.relationships
                ],
                f,
                indent=2
            )

    # ============= PREFERENCE TRACKING =============

    def add_user_preference(self, pref: UserPreference):
        """Add or update a user preference"""
        if pref.user_id not in self.user_preferences:
            self.user_preferences[pref.user_id] = []

        # Check if preference already exists
        existing = None
        for existing_pref in self.user_preferences[pref.user_id]:
            if existing_pref.preference_type == pref.preference_type:
                existing = existing_pref
                break

        if existing:
            # Update existing preference
            existing.value = pref.value
            existing.last_confirmed = pref.last_confirmed
            existing.source_messages.extend(pref.source_messages)
        else:
            # Add new preference
            self.user_preferences[pref.user_id].append(pref)

        self._save_preferences()

    def get_user_preferences(self, user_id: str,
                            preference_type: Optional[PreferenceType] = None) -> List[UserPreference]:
        """Get preferences for a user"""
        prefs = self.user_preferences.get(user_id, [])

        if preference_type:
            return [p for p in prefs if p.preference_type == preference_type]

        return prefs

    def get_group_constraints(self) -> Dict[str, List[UserPreference]]:
        """
        Get all REQUIRED preferences (dietary, hard constraints).
        Used when planning events to know what MUST be satisfied.
        """
        constraints = {}

        for user_id, prefs in self.user_preferences.items():
            user_constraints = [p for p in prefs if p.strength == "required"]
            if user_constraints:
                constraints[user_id] = user_constraints

        return constraints

    # ============= DECISION TRACKING =============

    def add_decision(self, decision: GroupDecision):
        """Add a group decision"""
        self.group_decisions.append(decision)
        self._save_decisions()

    def update_decision_consensus(self, decision_id: str,
                                  user_id: str,
                                  stance: Literal["support", "oppose", "neutral"]):
        """Update who supports/opposes a decision"""
        for decision in self.group_decisions:
            if decision.decision_id == decision_id:
                # Remove from all lists first
                for user_list in [decision.supporting_users, decision.opposing_users, decision.neutral_users]:
                    if user_id in user_list:
                        user_list.remove(user_id)

                # Add to appropriate list
                if stance == "support":
                    decision.supporting_users.append(user_id)
                elif stance == "oppose":
                    decision.opposing_users.append(user_id)
                else:
                    decision.neutral_users.append(user_id)

                # Update status based on consensus
                self._update_decision_status(decision)
                break

        self._save_decisions()

    def _update_decision_status(self, decision: GroupDecision):
        """Update decision status based on current consensus"""
        total = len(decision.supporting_users) + len(decision.opposing_users) + len(decision.neutral_users)
        support_pct = len(decision.supporting_users) / total if total > 0 else 0

        if decision.opposing_users:
            decision.status = DecisionStatus.VETOED
        elif support_pct == 1.0:
            decision.status = DecisionStatus.CONSENSUS
        elif support_pct >= 0.66:
            decision.status = DecisionStatus.MAJORITY
        else:
            decision.status = DecisionStatus.DISCUSSING

    def get_decisions_for_event(self, event_id: str) -> List[GroupDecision]:
        """Get all decisions for a specific event"""
        return [d for d in self.group_decisions if d.event_id == event_id]

    def get_active_decisions(self, decision_type: Optional[str] = None) -> List[GroupDecision]:
        """Get decisions that are still active (not superseded)"""
        active = [d for d in self.group_decisions if d.supersedes is None]

        if decision_type:
            active = [d for d in active if d.decision_type == decision_type]

        return active

    # ============= RELATIONSHIP TRACKING =============

    def add_relationship(self, relationship: Relationship):
        """Add or update a relationship"""
        # Check if relationship exists
        existing = None
        for rel in self.relationships:
            if (rel.user1_id == relationship.user1_id and rel.user2_id == relationship.user2_id) or \
               (rel.user1_id == relationship.user2_id and rel.user2_id == relationship.user1_id):
                existing = rel
                break

        if existing:
            # Update existing
            existing.relationship_type = relationship.relationship_type
            existing.strength = relationship.strength
            existing.evidence.extend(relationship.evidence)
        else:
            # Add new
            self.relationships.append(relationship)

        self._save_relationships()

    def get_relationship(self, user1_id: str, user2_id: str) -> Optional[Relationship]:
        """Get relationship between two users"""
        for rel in self.relationships:
            if (rel.user1_id == user1_id and rel.user2_id == user2_id) or \
               (rel.user1_id == user2_id and rel.user2_id == user1_id):
                return rel
        return None

    # ============= QUERYING =============

    def query_planning_context(self, event_id: str) -> Dict:
        """
        Get all relevant context for planning an event.

        Returns:
        - All user preferences (especially constraints)
        - Past decisions for this event
        - Relevant relationships
        """
        return {
            "constraints": self.get_group_constraints(),
            "all_preferences": self.user_preferences,
            "event_decisions": self.get_decisions_for_event(event_id),
            "relationships": self.relationships,
        }

    def query_user_info(self, user_id: str) -> Dict:
        """Get all info about a specific user"""
        return {
            "preferences": self.get_user_preferences(user_id),
            "relationships": [r for r in self.relationships
                            if r.user1_id == user_id or r.user2_id == user_id],
        }


# ============= EXAMPLE USAGE =============

if __name__ == "__main__":
    # Initialize for your synthetic chat group
    memory = SmallGroupMemory(group_id="friend_group_6")

    print("🎯 Small Group Memory System Demo\n")
    print("Simulating your synthetic chat data (6 friends, 16 events)")
    print("=" * 60 + "\n")

    # 1. Track persistent preferences
    print("📝 Adding persistent user preferences:")
    memory.add_user_preference(UserPreference(
        user_id="john",
        preference_type=PreferenceType.DIETARY,
        value="vegetarian",
        strength="required",
        first_mentioned="2024-05-01T10:00:00",
        last_confirmed="2024-05-01T10:00:00",
        source_messages=["msg_001"]
    ))
    print("  ✓ John: vegetarian (REQUIRED)")

    memory.add_user_preference(UserPreference(
        user_id="maya",
        preference_type=PreferenceType.BUDGET,
        value="$30-50 per person",
        strength="strong",
        first_mentioned="2024-05-05T14:00:00",
        last_confirmed="2024-05-05T14:00:00",
        source_messages=["msg_050"]
    ))
    print("  ✓ Maya: $30-50 budget (STRONG preference)")

    memory.add_user_preference(UserPreference(
        user_id="tanya",
        preference_type=PreferenceType.VENUE_TYPE,
        value="indoor venues (gets cold easily)",
        strength="mild",
        first_mentioned="2024-06-10T16:00:00",
        last_confirmed="2024-06-10T16:00:00",
        source_messages=["msg_200"]
    ))
    print("  ✓ Tanya: prefers indoor (MILD preference)\n")

    # 2. Track group decision with consensus
    print("📊 Tracking group decision (Event #5: Thai Restaurant):")
    decision = GroupDecision(
        decision_id="decision_001",
        event_id="event_05_thai_restaurant",
        decision_type="venue",
        value="Thai Temple Restaurant",
        status=DecisionStatus.PROPOSED,
        proposed_by="nirali",
        proposed_at="2024-06-15T12:00:00",
        source_messages=["msg_300", "msg_301"]
    )
    memory.add_decision(decision)
    print("  Nirali proposed: Thai Temple Restaurant")

    # Simulate consensus building
    memory.update_decision_consensus("decision_001", "jake", "support")
    print("  Jake: ✓ agreed")
    memory.update_decision_consensus("decision_001", "tanya", "support")
    print("  Tanya: ✓ agreed")
    memory.update_decision_consensus("decision_001", "maya", "neutral")
    print("  Maya: ~ neutral (budget concern)")
    memory.update_decision_consensus("decision_001", "amane", "support")
    print("  Amane: ✓ agreed")
    memory.update_decision_consensus("decision_001", "mahiru", "support")
    print("  Mahiru: ✓ agreed")

    decisions = memory.get_decisions_for_event("event_05_thai_restaurant")
    print(f"\n  Final status: {decisions[0].status.value.upper()}")
    print(f"  Support: {len(decisions[0].supporting_users)}/6 people\n")

    # 3. Track relationships (dating reveal)
    print("💑 Tracking relationship evolution:")
    memory.add_relationship(Relationship(
        user1_id="amane",
        user2_id="mahiru",
        relationship_type="dating",
        strength=0.9,
        first_observed="2024-07-04T15:14:33",
        evidence=["msg_450", "msg_451", "msg_452"]
    ))
    print("  ✓ Amane ❤️ Mahiru relationship detected")
    print("    Evidence: 'Amane and I are watching from his balcony 😊'\n")

    # 4. Query planning context
    print("🔍 Querying planning context for new event:")
    context = memory.query_planning_context("event_06_new_event")

    print("\n  REQUIRED Constraints:")
    for user, constraints in context["constraints"].items():
        for c in constraints:
            print(f"    • {user}: {c.value}")

    print("\n  All User Preferences:")
    for user, prefs in context["all_preferences"].items():
        for p in prefs:
            strength_emoji = {"required": "🔴", "strong": "🟡", "mild": "🟢"}[p.strength]
            print(f"    {strength_emoji} {user}: {p.value}")

    print("\n  Known Relationships:")
    for rel in context["relationships"]:
        print(f"    • {rel.user1_id} & {rel.user2_id}: {rel.relationship_type}")

    print("\n" + "=" * 60)
    print("✅ Small group memory system ready!")
    print("\nThis system handles:")
    print("  • Long-term preference tracking")
    print("  • Consensus-based decision making")
    print("  • Relationship context")
    print("  • Multi-event history")
