from .base import SessionLocal
from .models import ChatHistory


def save_chat(question, answer):
    session = SessionLocal()
    entry = ChatHistory(question=question, answer=answer)
    session.add(entry)
    session.commit()
    session.close()


def query_structured_data(query_text):
    # TODO: Write logic to match query to SQL queries
    # Example: return rainfall last week
    return "Structured data result placeholder"
