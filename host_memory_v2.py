"""
Enhanced Event Host Memory System
Combines host-centric FAQs with lightweight chat observation.

Architecture:
1. Host is source of truth (manually curates FAQs/todos)
2. System observes chat for patterns (address requests, dietary mentions)
3. System suggests to host (human-in-the-loop validation)
4. Event sourcing for full audit trail
"""

import json
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Literal
from dataclasses import dataclass, asdict
from enum import Enum


class EventType(str, Enum):
    """Types of events in the audit log"""
    # FAQ-related
    FAQ_ASKED = "faq_asked"
    FAQ_ANSWERED = "faq_answered"
    FAQ_SET_BY_HOST = "faq_set_by_host"
    FAQ_UPDATED_BY_HOST = "faq_updated_by_host"

    # Detection/suggestions
    PATTERN_DETECTED = "pattern_detected"
    SUGGESTION_MADE = "suggestion_made"
    SUGGESTION_ACCEPTED = "suggestion_accepted"
    SUGGESTION_REJECTED = "suggestion_rejected"

    # Dietary/preferences
    DIETARY_MENTIONED = "dietary_mentioned"
    PREFERENCE_MENTIONED = "preference_mentioned"

    # RSVP
    RSVP_YES = "rsvp_yes"
    RSVP_NO = "rsvp_no"
    RSVP_MAYBE = "rsvp_maybe"

    # Todos
    TODO_ADDED = "todo_added"
    TODO_COMPLETED = "todo_completed"

    # Messages
    MESSAGE_SENT = "message_sent"


@dataclass
class Event:
    """An event in the audit log (event sourcing pattern)"""
    event_type: EventType
    timestamp: str  # ISO format
    user_id: Optional[str] = None
    data: Dict = None  # Flexible payload

    def __post_init__(self):
        if self.data is None:
            self.data = {}


@dataclass
class Suggestion:
    """A suggestion from the system to the host"""
    id: str
    type: Literal["faq", "dietary", "todo", "rsvp"]
    suggestion: str  # Human-readable suggestion
    data: Dict  # Structured data
    confidence: float  # 0-1
    created_at: str
    status: Literal["pending", "accepted", "rejected"] = "pending"


class ChatPatternDetector:
    """
    Lightweight pattern detection for common host FAQ needs.
    Uses rules for obvious patterns, falls back to LLM for ambiguous.
    """

    FAQ_PATTERNS = {
        "address": [
            r"what'?s the address",
            r"where is (this|it|the event)",
            r"where are we meeting",
            r"send (me )?the address",
            r"address\?",
        ],
        "parking": [
            r"where (can|should) i park",
            r"parking",
            r"is there parking",
        ],
        "what_to_bring": [
            r"what should i bring",
            r"should i bring anything",
            r"what to bring",
            r"do i need to bring",
        ],
        "time": [
            r"what time",
            r"when (is it|does it start)",
            r"start time",
        ],
    }

    DIETARY_KEYWORDS = [
        "vegetarian", "vegan", "gluten-free", "lactose intolerant",
        "allergic to", "can't eat", "don't eat", "allergy"
    ]

    RSVP_PATTERNS = {
        "yes": [r"i'?m coming", r"i'?ll be there", r"count me in", r"i'?m in"],
        "no": [r"can'?t make it", r"won'?t be able to", r"i'?m out", r"have to skip"],
        "maybe": [r"might come", r"probably", r"not sure", r"maybe"],
    }

    @classmethod
    def detect_faq_request(cls, message: str) -> Optional[str]:
        """Detect if message is asking about a common FAQ"""
        message_lower = message.lower()

        for faq_key, patterns in cls.FAQ_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    return faq_key

        return None

    @classmethod
    def detect_dietary_mention(cls, message: str) -> Optional[str]:
        """Detect dietary restrictions mentioned"""
        message_lower = message.lower()

        for keyword in cls.DIETARY_KEYWORDS:
            if keyword in message_lower:
                # Extract the full statement
                return message  # Return full message for context

        return None

    @classmethod
    def detect_rsvp(cls, message: str) -> Optional[Literal["yes", "no", "maybe"]]:
        """Detect RSVP intent"""
        message_lower = message.lower()

        for status, patterns in cls.RSVP_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    return status

        return None


class HostMemorySystem:
    """
    Enhanced host memory system with chat observation and suggestions.
    """

    def __init__(self, event_id: str, host_user_id: str, storage_dir: Path = Path("./event_memory_v2")):
        self.event_id = event_id
        self.host_user_id = host_user_id
        self.storage_dir = storage_dir / event_id
        self.storage_dir.mkdir(parents=True, exist_ok=True)

        # Files
        self.events_file = self.storage_dir / "events.jsonl"  # Audit log
        self.memory_file = self.storage_dir / "memory.json"   # Current state (reconstructed from events)
        self.suggestions_file = self.storage_dir / "suggestions.json"  # Pending suggestions

        # Load
        self.memory = self._load_memory()
        self.suggestions = self._load_suggestions()

    def _load_memory(self) -> Dict:
        """Load current memory state"""
        if not self.memory_file.exists():
            return {
                "faqs": {},
                "dietary_restrictions": {},
                "rsvp": {"yes": [], "no": [], "maybe": []},
                "todos": [],
                "preferences": {},
            }

        with open(self.memory_file, 'r') as f:
            return json.load(f)

    def _save_memory(self):
        """Save current memory state"""
        with open(self.memory_file, 'w') as f:
            json.dump(self.memory, f, indent=2)

    def _load_suggestions(self) -> List[Suggestion]:
        """Load pending suggestions"""
        if not self.suggestions_file.exists():
            return []

        with open(self.suggestions_file, 'r') as f:
            data = json.load(f)
            return [Suggestion(**s) for s in data]

    def _save_suggestions(self):
        """Save suggestions"""
        with open(self.suggestions_file, 'w') as f:
            json.dump([asdict(s) for s in self.suggestions], f, indent=2)

    def _append_event(self, event: Event):
        """Append event to audit log (event sourcing)"""
        with open(self.events_file, 'a') as f:
            f.write(json.dumps(asdict(event)) + '\n')

    def _reconstruct_state_from_events(self) -> Dict:
        """
        Reconstruct memory state from event log.
        Useful for debugging or time-travel queries.
        """
        state = {
            "faqs": {},
            "dietary_restrictions": {},
            "rsvp": {"yes": [], "no": [], "maybe": []},
            "todos": [],
        }

        if not self.events_file.exists():
            return state

        with open(self.events_file, 'r') as f:
            for line in f:
                event = Event(**json.loads(line))

                if event.event_type == EventType.FAQ_SET_BY_HOST:
                    faq_key = event.data["faq_key"]
                    state["faqs"][faq_key] = event.data["value"]

                elif event.event_type == EventType.DIETARY_MENTIONED:
                    user = event.user_id
                    restriction = event.data["restriction"]
                    state["dietary_restrictions"][user] = restriction

                elif event.event_type in [EventType.RSVP_YES, EventType.RSVP_NO, EventType.RSVP_MAYBE]:
                    status = event.event_type.value.split("_")[1].lower()
                    if event.user_id not in state["rsvp"][status]:
                        state["rsvp"][status].append(event.user_id)

                elif event.event_type == EventType.TODO_ADDED:
                    state["todos"].append(event.data)

        return state

    # ============= HOST ACTIONS (Source of Truth) =============

    def host_set_faq(self, faq_key: str, value: str):
        """Host manually sets a FAQ answer"""
        self.memory["faqs"][faq_key] = {
            "value": value,
            "set_at": datetime.now().isoformat(),
            "asked_count": 0,
            "auto_respond": True,
        }

        self._append_event(Event(
            event_type=EventType.FAQ_SET_BY_HOST,
            timestamp=datetime.now().isoformat(),
            user_id=self.host_user_id,
            data={"faq_key": faq_key, "value": value}
        ))

        self._save_memory()

    def host_add_todo(self, task: str, due: Optional[str] = None):
        """Host adds a task to their todo list"""
        todo = {
            "task": task,
            "status": "pending",
            "due": due,
            "created_at": datetime.now().isoformat(),
        }

        self.memory["todos"].append(todo)

        self._append_event(Event(
            event_type=EventType.TODO_ADDED,
            timestamp=datetime.now().isoformat(),
            user_id=self.host_user_id,
            data=todo
        ))

        self._save_memory()

    def host_complete_todo(self, task: str):
        """Host marks a todo as complete"""
        for todo in self.memory["todos"]:
            if todo["task"] == task:
                todo["status"] = "completed"
                break

        self._append_event(Event(
            event_type=EventType.TODO_COMPLETED,
            timestamp=datetime.now().isoformat(),
            user_id=self.host_user_id,
            data={"task": task}
        ))

        self._save_memory()

    # ============= CHAT OBSERVATION =============

    def observe_message(self, user_id: str, message: str) -> List[Suggestion]:
        """
        Observe a message from the group chat.
        Detect patterns and generate suggestions for the host.
        """
        suggestions = []

        # Log the message
        self._append_event(Event(
            event_type=EventType.MESSAGE_SENT,
            timestamp=datetime.now().isoformat(),
            user_id=user_id,
            data={"message": message}
        ))

        # 1. Check if it's a FAQ request
        faq_key = ChatPatternDetector.detect_faq_request(message)
        if faq_key:
            self._append_event(Event(
                event_type=EventType.FAQ_ASKED,
                timestamp=datetime.now().isoformat(),
                user_id=user_id,
                data={"faq_key": faq_key, "message": message}
            ))

            # Increment ask count if FAQ exists
            if faq_key in self.memory["faqs"]:
                self.memory["faqs"][faq_key]["asked_count"] += 1
                self._save_memory()

                # If asked 3+ times, suggest pinning
                if self.memory["faqs"][faq_key]["asked_count"] == 3:
                    suggestion = Suggestion(
                        id=f"suggestion_{datetime.now().timestamp()}",
                        type="faq",
                        suggestion=f"'{faq_key}' has been asked 3 times. Consider pinning this message.",
                        data={"faq_key": faq_key},
                        confidence=1.0,
                        created_at=datetime.now().isoformat()
                    )
                    suggestions.append(suggestion)
            else:
                # FAQ doesn't exist - suggest creating it
                suggestion = Suggestion(
                    id=f"suggestion_{datetime.now().timestamp()}",
                    type="faq",
                    suggestion=f"Someone asked about '{faq_key}'. Want to set a FAQ answer?",
                    data={"faq_key": faq_key},
                    confidence=0.8,
                    created_at=datetime.now().isoformat()
                )
                suggestions.append(suggestion)

        # 2. Check for dietary mentions
        dietary = ChatPatternDetector.detect_dietary_mention(message)
        if dietary:
            self._append_event(Event(
                event_type=EventType.DIETARY_MENTIONED,
                timestamp=datetime.now().isoformat(),
                user_id=user_id,
                data={"restriction": dietary}
            ))

            suggestion = Suggestion(
                id=f"suggestion_{datetime.now().timestamp()}",
                type="dietary",
                suggestion=f"{user_id} mentioned a dietary restriction. Track it?",
                data={"user_id": user_id, "restriction": dietary},
                confidence=0.9,
                created_at=datetime.now().isoformat()
            )
            suggestions.append(suggestion)

        # 3. Check for RSVP
        rsvp_status = ChatPatternDetector.detect_rsvp(message)
        if rsvp_status:
            event_type = {
                "yes": EventType.RSVP_YES,
                "no": EventType.RSVP_NO,
                "maybe": EventType.RSVP_MAYBE,
            }[rsvp_status]

            self._append_event(Event(
                event_type=event_type,
                timestamp=datetime.now().isoformat(),
                user_id=user_id,
                data={"status": rsvp_status}
            ))

            # Update RSVP tracking
            if user_id not in self.memory["rsvp"][rsvp_status]:
                self.memory["rsvp"][rsvp_status].append(user_id)
                self._save_memory()

        # Save new suggestions
        self.suggestions.extend(suggestions)
        self._save_suggestions()

        return suggestions

    # ============= SUGGESTION HANDLING =============

    def get_pending_suggestions(self) -> List[Suggestion]:
        """Get all pending suggestions for host review"""
        return [s for s in self.suggestions if s.status == "pending"]

    def accept_suggestion(self, suggestion_id: str, edited_value: Optional[Dict] = None):
        """Host accepts a suggestion (optionally with edits)"""
        for suggestion in self.suggestions:
            if suggestion.id == suggestion_id and suggestion.status == "pending":
                suggestion.status = "accepted"

                # Apply the suggestion
                if suggestion.type == "faq":
                    faq_key = suggestion.data["faq_key"]
                    value = edited_value.get("value") if edited_value else ""
                    if value:
                        self.host_set_faq(faq_key, value)

                elif suggestion.type == "dietary":
                    user_id = suggestion.data["user_id"]
                    restriction = edited_value.get("restriction") if edited_value else suggestion.data["restriction"]
                    self.memory["dietary_restrictions"][user_id] = restriction
                    self._save_memory()

                self._append_event(Event(
                    event_type=EventType.SUGGESTION_ACCEPTED,
                    timestamp=datetime.now().isoformat(),
                    user_id=self.host_user_id,
                    data={"suggestion_id": suggestion_id, "edited": edited_value}
                ))

                break

        self._save_suggestions()

    def reject_suggestion(self, suggestion_id: str):
        """Host rejects a suggestion"""
        for suggestion in self.suggestions:
            if suggestion.id == suggestion_id and suggestion.status == "pending":
                suggestion.status = "rejected"

                self._append_event(Event(
                    event_type=EventType.SUGGESTION_REJECTED,
                    timestamp=datetime.now().isoformat(),
                    user_id=self.host_user_id,
                    data={"suggestion_id": suggestion_id}
                ))

                break

        self._save_suggestions()

    # ============= QUERIES =============

    def get_faq(self, faq_key: str) -> Optional[Dict]:
        """Get FAQ answer"""
        return self.memory["faqs"].get(faq_key)

    def get_all_dietary_restrictions(self) -> Dict[str, str]:
        """Get all dietary restrictions"""
        return self.memory["dietary_restrictions"]

    def get_rsvp_summary(self) -> Dict:
        """Get RSVP counts"""
        return {
            "yes": len(self.memory["rsvp"]["yes"]),
            "no": len(self.memory["rsvp"]["no"]),
            "maybe": len(self.memory["rsvp"]["maybe"]),
            "details": self.memory["rsvp"]
        }

    def get_pending_todos(self) -> List[Dict]:
        """Get pending todos"""
        return [t for t in self.memory["todos"] if t["status"] == "pending"]


# ============= EXAMPLE USAGE =============

if __name__ == "__main__":
    # Initialize
    memory = HostMemorySystem(
        event_id="bbq_nov_16_2024",
        host_user_id="amane"
    )

    # Host sets up initial FAQs
    print("🏠 Host sets up event info:")
    memory.host_set_faq("address", "123 Main St, Apt 4B. Buzz unit 4B at gate.")
    memory.host_set_faq("time", "Saturday 6:30 PM")
    memory.host_add_todo("Buy burger buns", due="2024-11-16T14:00:00")
    print("  ✓ Address FAQ set")
    print("  ✓ Time FAQ set")
    print("  ✓ Todo added\n")

    # Simulate conversation messages
    print("💬 Group chat messages:\n")

    # Jake asks about address
    print("Jake: hey what's the address again?")
    suggestions = memory.observe_message("jake", "hey what's the address again?")
    print(f"  → System: FAQ asked, count incremented\n")

    # Maya asks about address too
    print("Maya: can you send me the address?")
    suggestions = memory.observe_message("maya", "can you send me the address?")
    print(f"  → System: FAQ asked again (count: 2)\n")

    # Nirali also asks
    print("Nirali: address??")
    suggestions = memory.observe_message("nirali", "address??")
    if suggestions:
        print(f"  → System: 📌 Suggestion: {suggestions[0].suggestion}\n")

    # John mentions dietary restriction
    print("John: btw i'm vegetarian")
    suggestions = memory.observe_message("john", "btw i'm vegetarian")
    if suggestions:
        print(f"  → System: 💡 Suggestion: {suggestions[0].suggestion}")
        print(f"      Data: {suggestions[0].data}\n")

    # Host reviews suggestions
    print("🤔 Host reviews suggestions:")
    pending = memory.get_pending_suggestions()
    for i, suggestion in enumerate(pending):
        print(f"  {i+1}. {suggestion.suggestion}")
    print()

    # Host accepts dietary suggestion
    print("✅ Host accepts dietary restriction tracking:")
    if pending:
        memory.accept_suggestion(
            pending[1].id,
            edited_value={"restriction": "vegetarian (strict)"}
        )
        print("  ✓ John's dietary restriction saved\n")

    # Check current state
    print("📊 Current event state:")
    print(f"  Address asked: {memory.get_faq('address')['asked_count']} times")
    print(f"  Dietary restrictions: {memory.get_all_dietary_restrictions()}")
    print(f"  Pending todos: {len(memory.get_pending_todos())}")
    print(f"  RSVP summary: {memory.get_rsvp_summary()}\n")

    # Demonstrate event sourcing - reconstruct state
    print("🔄 Reconstructing state from event log:")
    reconstructed = memory._reconstruct_state_from_events()
    print(f"  FAQs: {list(reconstructed['faqs'].keys())}")
    print(f"  Dietary: {reconstructed['dietary_restrictions']}")
