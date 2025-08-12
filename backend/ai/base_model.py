import os
from openai import OpenAI
from typing import Optional, List, Dict, Any
import random
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class BaseModel:
    """
    Base model configuration for OpenRouter API using google/gemma-3-27b-it:free
    Handles API key rotation and client initialization
    """
    
    def __init__(self, api_key: Optional[str] = None, site_url: Optional[str] = None, site_name: Optional[str] = None):
        """
        Initialize the OpenAI client with OpenRouter configuration
        
        Args:
            api_key: Optional specific API key to use
            site_url: Optional site URL for rankings on openrouter.ai
            site_name: Optional site name for rankings on openrouter.ai
        """
        self.base_url = "https://openrouter.ai/api/v1"
        self.model = "google/gemma-3-27b-it:free"
        self.site_url = site_url or os.getenv('SITE_URL', 'https://localhost:5000')
        self.site_name = site_name or os.getenv('SITE_NAME', 'ClimatechAI')
        
        # Get API key (with fallback rotation)
        self.api_key = api_key or self._get_api_key()
        
        if not self.api_key:
            raise ValueError("No OpenRouter API key found. Please set OPENROUTER_API_KEY in your .env file")
        
        # Initialize OpenAI client
        self.client = self._create_client()
    
    def _get_api_key(self) -> Optional[str]:
        """
        Get API key from environment variables with rotation support
        Tries OPENROUTER_API_KEY first, then falls back to numbered keys
        """
        # Try primary key first
        primary_key = os.getenv('OPENROUTER_API_KEY')
        if primary_key:
            return primary_key
        
        # Try numbered keys (API_KEY2, API_KEY3, API_KEY4)
        api_keys = []
        for i in range(2, 5):  # Keys 2, 3, 4
            key = os.getenv(f'OPENROUTER_API_KEY{i}')
            if key:
                api_keys.append(key)
        
        if api_keys:
            # Return a random key from available ones for load balancing
            return random.choice(api_keys)
        
        return None
    
    def _create_client(self) -> OpenAI:
        """Create and configure the OpenAI client"""
        return OpenAI(
            base_url=self.base_url,
            api_key=self.api_key,
        )
    
    def get_completion(self, messages: List[Dict[str, Any]], **kwargs) -> str:
        """
        Get completion from the model
        
        Args:
            messages: List of message dictionaries
            **kwargs: Additional parameters for the completion
            
        Returns:
            String response from the model
        """
        try:
            # Set default parameters
            default_params = {
                "model": self.model,
                "messages": messages,
                "extra_headers": {
                    "HTTP-Referer": self.site_url,
                    "X-Title": self.site_name,
                },
                "extra_body": {},
            }
            
            # Merge with any additional parameters
            params = {**default_params, **kwargs}
            
            completion = self.client.chat.completions.create(**params)
            return completion.choices[0].message.content
            
        except Exception as e:
            print(f"Error getting completion: {e}")
            raise
    
    def chat_completion(self, user_message: str, system_message: Optional[str] = None, **kwargs) -> str:
        """
        Simple chat completion with user and optional system message
        
        Args:
            user_message: User's message
            system_message: Optional system message
            **kwargs: Additional parameters for the completion
            
        Returns:
            String response from the model
        """
        messages = []
        
        if system_message:
            messages.append({"role": "system", "content": system_message})
        
        messages.append({"role": "user", "content": user_message})
        
        return self.get_completion(messages, **kwargs)
    
    def get_client(self) -> OpenAI:
        """Get the underlying OpenAI client for advanced usage"""
        return self.client
    
    def get_model_info(self) -> Dict[str, str]:
        """Get information about the configured model"""
        return {
            "model": self.model,
            "base_url": self.base_url,
            "site_url": self.site_url,
            "site_name": self.site_name,
            "api_key_prefix": f"{self.api_key[:8]}..." if self.api_key else "None"
        }


# Global instance - lazy initialization
_base_model = None


def get_base_model() -> BaseModel:
    """Get the global base model instance (lazy initialization)"""
    global _base_model
    if _base_model is None:
        _base_model = BaseModel()
    return _base_model


def create_custom_model(api_key: Optional[str] = None, site_url: Optional[str] = None, site_name: Optional[str] = None) -> BaseModel:
    """Create a custom model instance with specific parameters"""
    return BaseModel(api_key=api_key, site_url=site_url, site_name=site_name)


def test_model():
    """Test the model configuration"""
    try:
        model = get_base_model()
        print("🤖 Testing Base Model Configuration")
        print("=" * 50)
        
        # Print model info
        info = model.get_model_info()
        print("📋 Model Information:")
        for key, value in info.items():
            print(f"  - {key}: {value}")
        
        # Test completion
        print("\n🧪 Testing completion...")
        response = model.chat_completion(
            user_message="Hello! Please respond with exactly 'Model is working correctly.'",
            system_message="You are a helpful AI assistant. Respond exactly as requested."
        )
        
        print(f"✅ Response: {response}")
        print("\n✅ Base model is configured and working correctly!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing base model: {e}")
        return False


if __name__ == "__main__":
    test_model() 