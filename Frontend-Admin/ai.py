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

def detect_input_type_and_format(user_input: str, specified_mode: str = None) -> tuple:
    """
    Detect if input is environmental data or normal conversation and format accordingly.
    
    Args:
        user_input (str): The raw user input
        specified_mode (str): Explicitly specified mode, if any
        
    Returns:
        tuple: (formatted_input, determined_mode)
    """
    # If mode is explicitly specified, use it
    if specified_mode and specified_mode in ["chat", "detect"]:
        return user_input, specified_mode
    
    # Try to parse as JSON (structured environmental data)
    try:
        if user_input.strip().startswith('{'):
            data = json.loads(user_input)
            # If it has environmental data fields, use detect mode
            env_fields = ['latitude', 'longitude', 'category', 'sustainedWind_kmh', 'gustWind_kmh', 
                         'humidity_pct', 'temperature_c', 'rainfallRate_mm_hr', 'windSpeed', 'rainfall']
            
            if any(field in data for field in env_fields):
                # Format the environmental data nicely for the AI
                formatted_input = "Environmental Data Analysis Request:\n"
                for key, value in data.items():
                    formatted_input += f"- {key}: {value}\n"
                formatted_input += "\nPlease analyze this environmental data and provide detection and risk assessment."
                return formatted_input, "detect"
    except json.JSONDecodeError:
        pass
    
    # Check for environmental keywords in text
    env_keywords = ['weather', 'storm', 'flood', 'earthquake', 'landslide', 'typhoon', 'rainfall', 
                   'wind', 'temperature', 'humidity', 'disaster', 'emergency', 'evacuation',
                   'climate', 'hazard', 'risk assessment', 'environmental']
    
    user_input_lower = user_input.lower()
    
    # If it contains multiple environmental keywords or specific data patterns, use detect mode
    env_keyword_count = sum(1 for keyword in env_keywords if keyword in user_input_lower)
    
    if env_keyword_count >= 2 or any(pattern in user_input_lower for pattern in 
                                   ['km/h', 'mm/hr', 'degrees celsius', 'coordinates', 'latitude', 'longitude']):
        return user_input, "detect"
    
    # Otherwise, use chat mode for normal conversation
    return user_input, "chat"

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
        # First argument is the mode (but we'll use smart detection if not specified)
        specified_mode = sys.argv[1].lower() if sys.argv[1].lower() in ["chat", "detect"] else None
        if len(sys.argv) > 2:
            # Second argument onwards is the prompt
            raw_input = " ".join(sys.argv[2:])
        else:
            raw_input = "What are the current weather conditions in Iloilo City?"
        
        # If first argument is not a valid mode, treat it as part of the input
        if not specified_mode:
            raw_input = " ".join(sys.argv[1:])
            specified_mode = None
            
    else:
        # Default mode and prompt
        specified_mode = None
        try:
            raw_input = sys.stdin.read().strip()
            if raw_input.startswith('{'):
                # Parse JSON input (for API calls)
                try:
                    data = json.loads(raw_input)
                    if isinstance(data, dict):
                        # Check if it's structured API input
                        if 'prompt' in data:
                            raw_input = data.get('prompt', '')
                            specified_mode = data.get('mode', None)
                        else:
                            # It's environmental data
                            raw_input = json.dumps(data)
                except json.JSONDecodeError:
                    pass
        except:
            raw_input = "What are the current weather conditions in Iloilo City?"
    
    # Use smart detection to determine input type and mode
    formatted_input, determined_mode = detect_input_type_and_format(raw_input, specified_mode)
    
    print(f"Using {determined_mode} mode...")
    result = call_openrouter(formatted_input, determined_mode)
    print(json.dumps(result, indent=2))