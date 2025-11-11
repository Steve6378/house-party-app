"""
RAG Query System
Semantic search over user and group facts stored in vector database.
"""

import os
import psycopg2
from openai import OpenAI
from typing import List, Dict, Optional
from tabulate import tabulate
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def get_db_connection():
    """Create database connection."""
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "house_party_db"),
        user=os.getenv("DB_USER", "house_party_user"),
        password=os.getenv("DB_PASSWORD")
    )


def generate_query_embedding(client: OpenAI, query: str) -> List[float]:
    """Generate embedding for search query."""
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=query
    )
    return response.data[0].embedding


def query_user_facts(user_name: str, query: str, top_k: int = 5) -> List[Dict]:
    """
    Semantic search for user facts.

    Args:
        user_name: Name of user to query
        query: Natural language query
        top_k: Number of results to return

    Returns:
        List of dicts with fact_text, confidence, distance, source_message
    """
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    conn = get_db_connection()

    # Generate query embedding
    query_embedding = generate_query_embedding(client, query)

    # Vector similarity search
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                uf.fact_text,
                uf.confidence,
                (uf.fact_embedding <=> %s::vector) as distance,
                m.content as source_message,
                m.created_at as message_time
            FROM user_facts uf
            JOIN users u ON uf.user_id = u.user_id
            LEFT JOIN messages m ON uf.source_message_id = m.message_id
            WHERE u.name = %s
            ORDER BY distance ASC
            LIMIT %s
            """,
            (query_embedding, user_name, top_k)
        )

        results = []
        for row in cur.fetchall():
            results.append({
                'fact_text': row[0],
                'confidence': row[1],
                'distance': row[2],
                'source_message': row[3],
                'message_time': row[4]
            })

    conn.close()
    return results


def query_group_facts(group_name: str, query: str, top_k: int = 5) -> List[Dict]:
    """
    Semantic search for group facts.

    Args:
        group_name: Name of group to query
        query: Natural language query
        top_k: Number of results to return

    Returns:
        List of dicts with fact_text, confidence, distance, source_message
    """
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    conn = get_db_connection()

    # Generate query embedding
    query_embedding = generate_query_embedding(client, query)

    # Vector similarity search
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                gf.fact_text,
                gf.confidence,
                (gf.fact_embedding <=> %s::vector) as distance,
                m.content as source_message,
                m.created_at as message_time
            FROM group_facts gf
            JOIN groups g ON gf.group_id = g.group_id
            LEFT JOIN messages m ON gf.source_message_id = m.message_id
            WHERE g.group_name = %s
            ORDER BY distance ASC
            LIMIT %s
            """,
            (query_embedding, group_name, top_k)
        )

        results = []
        for row in cur.fetchall():
            results.append({
                'fact_text': row[0],
                'confidence': row[1],
                'distance': row[2],
                'source_message': row[3],
                'message_time': row[4]
            })

    conn.close()
    return results


def get_all_user_facts(user_name: str) -> List[Dict]:
    """Get all facts for a user (no semantic search)."""
    conn = get_db_connection()

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                uf.fact_text,
                uf.confidence,
                m.content as source_message,
                m.created_at as message_time
            FROM user_facts uf
            JOIN users u ON uf.user_id = u.user_id
            LEFT JOIN messages m ON uf.source_message_id = m.message_id
            WHERE u.name = %s
            ORDER BY uf.confidence DESC, uf.created_at DESC
            """,
            (user_name,)
        )

        results = []
        for row in cur.fetchall():
            results.append({
                'fact_text': row[0],
                'confidence': row[1],
                'source_message': row[2],
                'message_time': row[3]
            })

    conn.close()
    return results


def query_combined_context(user_name: str, group_name: str, query: str, top_k: int = 5) -> Dict:
    """
    Query both user and group facts for comprehensive context.

    Args:
        user_name: User to query
        group_name: Group to query
        query: Natural language query
        top_k: Results per category

    Returns:
        Dict with 'user_facts' and 'group_facts' lists
    """
    user_facts = query_user_facts(user_name, query, top_k)
    group_facts = query_group_facts(group_name, query, top_k)

    return {
        'user_facts': user_facts,
        'group_facts': group_facts
    }


def format_results(results: List[Dict], title: str):
    """Pretty print results."""
    print("\n" + "="*80)
    print(title)
    print("="*80)

    if not results:
        print("No results found.")
        return

    table_data = []
    for i, r in enumerate(results, 1):
        distance = r.get('distance', 0)
        similarity = 1 - distance if distance else 1.0

        table_data.append([
            i,
            r['fact_text'],
            f"{r['confidence']:.2f}",
            f"{similarity:.3f}",
            r['source_message'][:50] + "..." if len(r['source_message']) > 50 else r['source_message']
        ])

    headers = ["#", "Fact", "Conf", "Sim", "Source Message"]
    print(tabulate(table_data, headers=headers, tablefmt="grid"))


def interactive_demo():
    """Interactive CLI for querying RAG system."""
    print("\n" + "="*80)
    print("HOUSE PARTY RAG QUERY SYSTEM - Interactive Demo")
    print("="*80)
    print("\nCommands:")
    print("  user <name> <query>  - Query user facts")
    print("  group <name> <query> - Query group facts")
    print("  list <name>          - List all facts for user")
    print("  quit                 - Exit")
    print("="*80 + "\n")

    while True:
        try:
            command = input("rag> ").strip()

            if not command:
                continue

            if command == "quit":
                break

            # Parse command - handle multi-word names
            if command.startswith("list "):
                user_name = command[5:].strip()  # Everything after "list "
                if user_name:
                    results = get_all_user_facts(user_name)
                    format_results(results, f"All Facts for: {user_name}")
                else:
                    print("Usage: list <username>")
                    print("Example: list Tanya Charan")

            elif command.startswith("user "):
                # For user command, use quotes if name has spaces
                # Example: user "Tanya Charan" food  OR  user Khang food
                import shlex
                try:
                    parts = shlex.split(command)
                    if len(parts) >= 3:
                        user_name = parts[1]
                        query = " ".join(parts[2:])
                        results = query_user_facts(user_name, query)
                        format_results(results, f"User Facts: {user_name} - Query: '{query}'")
                    else:
                        print("Usage: user <username> <query>")
                        print('Example: user "Tanya Charan" food preferences')
                except ValueError:
                    print("Parse error. Use quotes for multi-word names:")
                    print('Example: user "Tanya Charan" food')

            elif command.startswith("group "):
                import shlex
                try:
                    parts = shlex.split(command)
                    if len(parts) >= 3:
                        group_name = parts[1]
                        query = " ".join(parts[2:])
                        results = query_group_facts(group_name, query)
                        format_results(results, f"Group Facts: {group_name} - Query: '{query}'")
                    else:
                        print("Usage: group <groupname> <query>")
                except ValueError:
                    print("Parse error. Use quotes for multi-word names.")

            else:
                print("Invalid command. Try: user Sarah dietary restrictions")

        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) == 1:
        # Interactive mode
        interactive_demo()
    else:
        # Command line mode
        if len(sys.argv) < 4:
            print("Usage:")
            print("  Interactive: python query_rag.py")
            print("  Query user:  python query_rag.py user <name> <query>")
            print("  Query group: python query_rag.py group <name> <query>")
            sys.exit(1)

        query_type = sys.argv[1].lower()
        name = sys.argv[2]
        query = " ".join(sys.argv[3:])

        if query_type == "user":
            results = query_user_facts(name, query)
            format_results(results, f"User Facts: {name} - Query: '{query}'")
        elif query_type == "group":
            results = query_group_facts(name, query)
            format_results(results, f"Group Facts: {name} - Query: '{query}'")
        else:
            print("Invalid query type. Use 'user' or 'group'")
            sys.exit(1)
