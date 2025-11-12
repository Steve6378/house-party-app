"""
Event Host Memory System - RAG Backend for One-Time Event Hosting

Inspired by Claude Code's todo + conversation persistence architecture.
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict


@dataclass
class MemoryEntry:
    """A single piece of information the host needs to repeatedly share."""
    key: str  # e.g., "address", "parking", "what_to_bring"
    value: str  # The actual information
    asked_count: int = 0  # How many times this has been asked
    last_asked: Optional[str] = None  # ISO timestamp
    category: str = "logistics"  # logistics, dietary, rsvp, etc.
    auto_respond: bool = False  # Should RAG auto-reply to this question?


@dataclass
class TodoItem:
    """Host's task/reminder (like Claude Code todos)."""
    task: str
    status: str = "pending"  # pending, in_progress, completed
    due: Optional[str] = None  # ISO timestamp
    created_at: str = None


class EventHostMemory:
    """
    Persistent memory storage for event hosts.

    Similar to Claude Code's architecture:
    - JSONL for conversation history (searchable by RAG)
    - JSON for structured memory (FAQ, dietary restrictions, todos)
    """

    def __init__(self, event_id: str, host_user_id: str, storage_dir: Path = Path("./event_memory")):
        self.event_id = event_id
        self.host_user_id = host_user_id
        self.storage_dir = storage_dir / event_id
        self.storage_dir.mkdir(parents=True, exist_ok=True)

        # Files
        self.memory_file = self.storage_dir / "memory.json"
        self.conversation_file = self.storage_dir / "conversation.jsonl"
        self.todos_file = self.storage_dir / "todos.json"

        # Load existing data
        self.memory: Dict[str, MemoryEntry] = self._load_memory()
        self.todos: List[TodoItem] = self._load_todos()

    def _load_memory(self) -> Dict[str, MemoryEntry]:
        """Load memory from disk (like Claude Code loads todos)."""
        if not self.memory_file.exists():
            return {}

        with open(self.memory_file, 'r') as f:
            data = json.load(f)
            return {
                k: MemoryEntry(**v)
                for k, v in data.items()
            }

    def _save_memory(self):
        """Persist memory to disk."""
        with open(self.memory_file, 'w') as f:
            json.dump(
                {k: asdict(v) for k, v in self.memory.items()},
                f,
                indent=2
            )

    def _load_todos(self) -> List[TodoItem]:
        """Load todos from disk."""
        if not self.todos_file.exists():
            return []

        with open(self.todos_file, 'r') as f:
            data = json.load(f)
            return [TodoItem(**item) for item in data]

    def _save_todos(self):
        """Persist todos to disk."""
        with open(self.todos_file, 'w') as f:
            json.dump([asdict(t) for t in self.todos], f, indent=2)

    def add_message_to_history(self, user_id: str, content: str, metadata: dict = None):
        """
        Append message to conversation JSONL (like Claude Code's session files).
        This is what the RAG will search through.
        """
        entry = {
            "event_id": self.event_id,
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "content": content,
            "metadata": metadata or {}
        }

        with open(self.conversation_file, 'a') as f:
            f.write(json.dumps(entry) + '\n')

    def store_faq(self, key: str, value: str, category: str = "logistics", auto_respond: bool = False):
        """
        Store frequently asked information.

        Example:
            memory.store_faq("address", "123 Main St, Apt 4B", auto_respond=True)

        When RAG detects "what's the address?", it auto-responds with stored value.
        """
        self.memory[key] = MemoryEntry(
            key=key,
            value=value,
            category=category,
            auto_respond=auto_respond
        )
        self._save_memory()

    def increment_faq_ask(self, key: str):
        """Track how many times a question has been asked (helps identify pain points)."""
        if key in self.memory:
            self.memory[key].asked_count += 1
            self.memory[key].last_asked = datetime.now().isoformat()
            self._save_memory()

    def get_faq(self, key: str) -> Optional[MemoryEntry]:
        """Retrieve stored FAQ answer."""
        return self.memory.get(key)

    def add_todo(self, task: str, due: Optional[str] = None):
        """Add task to host's todo list."""
        todo = TodoItem(
            task=task,
            due=due,
            created_at=datetime.now().isoformat()
        )
        self.todos.append(todo)
        self._save_todos()

    def update_todo_status(self, task: str, status: str):
        """Mark todo as pending/in_progress/completed."""
        for todo in self.todos:
            if todo.task == task:
                todo.status = status
                break
        self._save_todos()

    def get_pending_todos(self) -> List[TodoItem]:
        """Get all incomplete tasks (for RAG query: 'what do I still need to do?')."""
        return [t for t in self.todos if t.status != "completed"]

    def search_conversation(self, query: str) -> List[dict]:
        """
        Simple full-text search through conversation history.
        In production, you'd use vector embeddings + semantic search.
        """
        if not self.conversation_file.exists():
            return []

        results = []
        query_lower = query.lower()

        with open(self.conversation_file, 'r') as f:
            for line in f:
                msg = json.loads(line)
                if query_lower in msg['content'].lower():
                    results.append(msg)

        return results


# Example Usage for Host
if __name__ == "__main__":
    # Initialize memory for Amane's BBQ event
    memory = EventHostMemory(
        event_id="bbq_nov_16_2024",
        host_user_id="amane_id"
    )

    # Store frequently asked info (host sets this once)
    memory.store_faq(
        "address",
        "123 Main St, Apt 4B. Buzz unit 4B at the gate.",
        auto_respond=True  # Auto-reply when asked
    )
    memory.store_faq(
        "parking",
        "Street parking on Oak St (free) or paid lot on 2nd Ave ($5/hr)"
    )
    memory.store_faq(
        "what_to_bring",
        "Just yourselves! I'm providing all food and drinks."
    )

    # Add host's todos
    memory.add_todo("Buy burger buns and hot dog buns", due="2024-11-16T10:00:00")
    memory.add_todo("Prep veggie burgers for Jake (vegetarian)")
    memory.add_todo("Set up folding tables on balcony")

    # Simulate conversation messages (gets added to JSONL for RAG)
    memory.add_message_to_history("jake_id", "hey what's the address again?")

    # RAG detects this is an FAQ question
    faq = memory.get_faq("address")
    if faq and faq.auto_respond:
        print(f"Auto-response: {faq.value}")
        memory.increment_faq_ask("address")  # Track frequency

    # Later: Jake asks again (different wording)
    memory.add_message_to_history("maya_id", "where is this at?")
    faq = memory.get_faq("address")
    memory.increment_faq_ask("address")

    # Host checks what's frequently asked
    print(f"\nAddress has been asked {memory.get_faq('address').asked_count} times")
    print("Maybe pin this message in the chat!")

    # Host checks pending tasks
    print("\n📋 Pending Tasks:")
    for todo in memory.get_pending_todos():
        print(f"  - {todo.task}")

    # Mark task complete
    memory.update_todo_status("Buy burger buns and hot dog buns", "completed")

    # RAG-powered query: "what do I still need to do?"
    print("\n🔍 RAG Query: 'What do I still need to do?'")
    pending = memory.get_pending_todos()
    for task in pending:
        due_str = f" (due {task.due})" if task.due else ""
        print(f"  - {task.task}{due_str}")
