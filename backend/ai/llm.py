from langchain_openai import ChatOpenAI
from config import OPENROUTER_API_KEY

llm = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
    model="meta-llama/llama-3.1-8b-instruct:free",
    temperature=0
)
