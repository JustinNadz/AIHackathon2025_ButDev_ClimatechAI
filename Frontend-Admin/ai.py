import requests
import json
import os
import sys
from typing import Dict, Any

def read_system_prompt(mode: str = "chat") -> str:
    """
    Read system prompt from the corresponding mode file.
    
    Args:
        mode (str): Either "chat" or "detect"
        
    Returns:
        str: The system prompt content
    """
    # Define file names for each mode
    mode_files = {
        "chat": "ai_system_prompt_chat.txt",
        "detect": "ai_system_prompt_detect.txt"
    }
    
    # Default fallback prompts for each mode
    default_prompts = {
        "chat": "You are a helpful AI assistant specialized in climate and weather analysis.",
        "detect": "You are an AI specialized in detecting and analyzing environmental hazards and risks."
    }
    
    filename = mode_files.get(mode, "ai_system_prompt_chat.txt")
    
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            content = file.read().strip()
            if content:  # Only return file content if it's not empty
                return content
            else:
                print(f"Warning: {filename} is empty, using default prompt")
                return default_prompts.get(mode, default_prompts["chat"])
    except FileNotFoundError:
        print(f"Warning: {filename} not found, using default prompt")
        return default_prompts.get(mode, default_prompts["chat"])
    except Exception as e:
        print(f"Error reading {filename}: {e}, using default prompt")
        return default_prompts.get(mode, default_prompts["chat"])

def call_openrouter(user_input: str, mode: str = "chat") -> Dict[str, Any]:
    """
    OpenRouter AI call with mode-specific system prompt and user input.
    
    Args:
        user_input (str): The user's input/prompt
        mode (str): Either "chat" or "detect" mode
        
    Returns:
        Dict[str, Any]: JSON response from the AI model
    """
    # Validate mode
    if mode not in ["chat", "detect"]:
        return {"error": f"Invalid mode '{mode}'. Use 'chat' or 'detect'"}
    
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
    
    # Read system prompt based on mode
    system_prompt = read_system_prompt(mode)
    
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
                "mode": mode,
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

# Example usage with mode selection
if __name__ == "__main__":
    import sys
    
    # Read input from command line arguments or stdin
    if len(sys.argv) > 1:
        # First argument is the mode
        mode = sys.argv[1].lower()
        if len(sys.argv) > 2:
            # Second argument onwards is the prompt
            user_input = " ".join(sys.argv[2:])
        else:
            user_input = "What are the current weather conditions in Iloilo City?"
    else:
        # Default mode and prompt
        mode = "chat"
        try:
            user_input = sys.stdin.read().strip()
            if user_input.startswith('{'):
                # Parse JSON input (for API calls)
                try:
                    data = json.loads(user_input)
                    user_input = data.get('prompt', '')
                    mode = data.get('mode', 'chat')
                except json.JSONDecodeError:
                    pass
        except:
            user_input = "What are the current weather conditions in Iloilo City?"
    
    # Validate mode
    if mode not in ["chat", "detect"]:
        print(f"Error: Invalid mode '{mode}'. Using 'chat' mode instead.")
        mode = "chat"
    
    print(f"Using {mode} mode...")
    result = call_openrouter(user_input, mode)
    print(json.dumps(result, indent=2))