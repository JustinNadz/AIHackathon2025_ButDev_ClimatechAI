import requests
import json
import os
import sys
import tempfile
from datetime import datetime
from typing import Dict, Any, List

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
    
    # Check for follow-up confirmation keywords that should stay in detect mode
    followup_keywords = ['yes', 'okay', 'sure', 'what should i do next', 'what to do next', 
                        'next steps', 'recommendations', 'protocol', 'emergency', 'cdrrmo',
                        'evacuation', 'flood warning', 'disaster response']
    
    user_input_lower = user_input.lower().strip()
    
    # If it's a simple confirmation (yes/okay/sure) or asking for next steps, use detect mode
    simple_confirmations = ['yes', 'okay', 'sure', 'ok', 'yep', 'yeah']
    if user_input_lower in simple_confirmations or any(phrase in user_input_lower for phrase in ['what should i do next', 'what to do next', 'next steps']):
        print(f"DEBUG: Simple confirmation detected: '{user_input_lower}' -> DETECT mode", file=sys.stderr)
        return user_input, "detect"
    
    # If it's a follow-up confirmation, use detect mode
    if any(keyword in user_input_lower for keyword in followup_keywords):
        print(f"DEBUG: Follow-up keyword detected: '{user_input_lower}' -> DETECT mode", file=sys.stderr)
        return user_input, "detect"
    
    # If it contains multiple environmental keywords or specific data patterns, use detect mode
    env_keyword_count = sum(1 for keyword in env_keywords if keyword in user_input_lower)
    
    if env_keyword_count >= 2 or any(pattern in user_input_lower for pattern in 
                                   ['km/h', 'mm/hr', 'degrees celsius', 'coordinates', 'latitude', 'longitude']):
        return user_input, "detect"
    
    # Otherwise, use chat mode for normal conversation
    print(f"DEBUG: No special detection -> CHAT mode for: '{user_input_lower}'", file=sys.stderr)
    return user_input, "chat"

def get_chat_history_file() -> str:
    """
    Get the path to the temporary chat history file.
    
    Returns:
        str: Path to the chat history file
    """
    # Use current directory instead of temp directory for reliability
    current_dir = os.path.dirname(os.path.abspath(__file__))
    history_file = os.path.join(current_dir, "climatech_ai_chat_history.txt")
    
    # Ensure the file exists
    if not os.path.exists(history_file):
        try:
            with open(history_file, 'w', encoding='utf-8') as f:
                f.write(f"# ClimatechAI Chat History - Created {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            print(f"DEBUG: Created chat history file at: {history_file}", file=sys.stderr)
        except Exception as e:
            print(f"ERROR: Could not create chat history file: {e}", file=sys.stderr)
    
    return history_file

def save_chat_message(role: str, content: str, mode: str = "chat") -> None:
    """
    Save a chat message to the temporary history file.
    
    Args:
        role (str): Either "user" or "assistant"
        content (str): The message content
        mode (str): The AI mode used ("chat" or "detect")
    """
    try:
        history_file = get_chat_history_file()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Create entry
        entry = f"[{timestamp}] {role.upper()} ({mode}): {content[:200]}{'...' if len(content) > 200 else ''}\n"
        
        print(f"DEBUG: Saving to history: {role.upper()} message ({len(content)} chars)", file=sys.stderr)
        
        # Append to file
        with open(history_file, 'a', encoding='utf-8') as f:
            f.write(entry)
            f.flush()  # Ensure it's written immediately
            
        print(f"DEBUG: Successfully saved message to {history_file}", file=sys.stderr)
            
        # Keep only last 10 messages to prevent file from growing too large
        trim_chat_history()
        
    except Exception as e:
        print(f"ERROR: Could not save chat history: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)

def trim_chat_history(max_messages: int = 10) -> None:
    """
    Keep only the last N messages in the chat history file.
    
    Args:
        max_messages (int): Maximum number of messages to keep
    """
    try:
        history_file = get_chat_history_file()
        
        if not os.path.exists(history_file):
            return
            
        # Read all lines
        with open(history_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Keep only the last max_messages lines
        if len(lines) > max_messages:
            lines = lines[-max_messages:]
            
            # Write back to file
            with open(history_file, 'w', encoding='utf-8') as f:
                f.writelines(lines)
                
    except Exception as e:
        print(f"Warning: Could not trim chat history: {e}", file=sys.stderr)

def get_recent_chat_history(max_messages: int = 6) -> str:
    """
    Get recent chat history formatted for AI context.
    
    Args:
        max_messages (int): Maximum number of recent messages to include
        
    Returns:
        str: Formatted chat history or empty string if none available
    """
    try:
        history_file = get_chat_history_file()
        
        if not os.path.exists(history_file):
            print(f"DEBUG: Chat history file does not exist: {history_file}", file=sys.stderr)
            return ""
            
        # Read recent lines
        with open(history_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        print(f"DEBUG: Read {len(lines)} lines from chat history", file=sys.stderr)
        
        if not lines:
            print("DEBUG: No lines in chat history file", file=sys.stderr)
            return ""
        
        # Filter out comment lines and empty lines
        message_lines = [line for line in lines if line.strip() and not line.startswith('#')]
        
        if not message_lines:
            print("DEBUG: No message lines found in chat history", file=sys.stderr)
            return ""
            
        # Get last max_messages lines
        recent_lines = message_lines[-max_messages:] if len(message_lines) > max_messages else message_lines
        
        print(f"DEBUG: Using {len(recent_lines)} recent messages for context", file=sys.stderr)
        
        if not recent_lines:
            return ""
            
        # Format for AI context
        history_context = "\n--- Recent Chat History ---\n"
        for line in recent_lines:
            history_context += line
        history_context += "--- End History ---\n\n"
        
        print(f"DEBUG: Generated history context ({len(history_context)} chars)", file=sys.stderr)
        
        return history_context
        
    except Exception as e:
        print(f"ERROR: Could not read chat history: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return ""

def clear_chat_history() -> None:
    """
    Clear the chat history file.
    """
    try:
        history_file = get_chat_history_file()
        if os.path.exists(history_file):
            os.remove(history_file)
            print("Chat history cleared.", file=sys.stderr)
    except Exception as e:
        print(f"Warning: Could not clear chat history: {e}", file=sys.stderr)

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
    
    # Save user message to history
    save_chat_message("user", user_input, mode)
    
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
    
    # Get recent chat history for context
    chat_history = get_recent_chat_history()
    
    # Add chat history to system prompt if available
    if chat_history:
        print(f"DEBUG: Including chat history ({len(chat_history.split('\\n')) - 4} messages)", file=sys.stderr)
        print(f"DEBUG: Chat history content: {chat_history[:300]}{'...' if len(chat_history) > 300 else ''}", file=sys.stderr)
        system_prompt_with_history = system_prompt + "\n\n" + chat_history + "Use this chat history to maintain context and provide appropriate follow-up responses."
    else:
        print("DEBUG: No chat history available", file=sys.stderr)
        system_prompt_with_history = system_prompt
    
    # Add system prompt
    messages.append({
        "role": "system",
        "content": system_prompt_with_history
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
            
            # Save AI response to history
            save_chat_message("assistant", content, mode)
            
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
            error_msg = "No response content found"
            save_chat_message("assistant", f"ERROR: {error_msg}", mode)
            return {"error": error_msg}
            
    except requests.exceptions.RequestException as e:
        error_msg = f"API request failed: {str(e)}"
        save_chat_message("assistant", f"ERROR: {error_msg}", mode)
        return {"error": error_msg}
    except json.JSONDecodeError as e:
        error_msg = f"Invalid JSON response: {str(e)}"
        save_chat_message("assistant", f"ERROR: {error_msg}", mode)
        return {"error": error_msg}
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        save_chat_message("assistant", f"ERROR: {error_msg}", mode)
        return {"error": error_msg}

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
    
    print(f"DEBUG: Input: '{raw_input}' -> Mode: {determined_mode}", file=sys.stderr)
    result = call_openrouter(formatted_input, determined_mode)
    print(json.dumps(result, indent=2))