import requests
import json
import os
from typing import Dict, Any

def read_system_prompt() -> str:
    """
    Read system prompt from ai_system_prompt.txt file.
    
    Returns:
        str: The system prompt content
    """
    try:
        with open('ai_system_prompt.txt', 'r', encoding='utf-8') as file:
            return file.read().strip()
    except FileNotFoundError:
        return "You are a helpful AI assistant."
    except Exception as e:
        print(f"Error reading system prompt file: {e}")
        return "You are a helpful AI assistant."

def call_openrouter(user_input: str) -> Dict[str, Any]:
    """
    OpenRouter AI call with system prompt and user input.
    
    Args:
        user_input (str): The user's input/prompt
        
    Returns:
        Dict[str, Any]: JSON response from the AI model
    """
    # Get API key from environment variable
    api_key = os.getenv('OPENROUTER_API_KEY')
    if not api_key:
        return {"error": "OPENROUTER_API_KEY not found in environment variables"}
    
    # OpenRouter API endpoint
    url = "https://openrouter.ai/api/v1/chat/completions"
    
    # Headers for the request
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "ClimateTech AI Assistant"
    }
    
    # Build messages array
    messages = []
    
    # Read system prompt from file
    system_prompt = read_system_prompt()
    
    # Add system prompt
    messages.append({
        "role": "system",
        "content": system_prompt
    })
    
    # Add user input
    messages.append({
        "role": "user",
        "content": user_input
    })
    
    # Request payload
    payload = {
        "model": "google/gemma-3-27b-it:free",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1000
    }
    
    try:
        # Make the API call
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        # Parse the response
        result = response.json()
        
        # Extract the content from the response
        if result.get("choices") and len(result["choices"]) > 0:
            content = result["choices"][0]["message"]["content"]
            return {
                "success": True,
                "response": content,
                "model": result.get("model", "unknown"),
                "usage": result.get("usage", {}),
                "timestamp": result.get("created", ""),
                "id": result.get("id", "")
            }
        else:
            return {"error": "No response content found"}
            
    except requests.exceptions.RequestException as e:
        return {"error": f"API request failed: {str(e)}"}
    except json.JSONDecodeError as e:
        return {"error": f"Invalid JSON response: {str(e)}"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}

# Example usage with system prompt
if __name__ == "__main__":
    # Test the function
    user_input = "What are the current weather conditions in Iloilo City?"
    result = call_openrouter(user_input)
    print(json.dumps(result, indent=2))
