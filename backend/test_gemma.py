#!/usr/bin/env python3
"""
Test script for Gemma AI integration with OpenRouter
"""

import os
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

def test_gemma_installation():
    """Test if Gemma can be accessed via OpenAI client"""
    
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("❌ OPENROUTER_API_KEY not found in environment")
        return False
    
    print("✅ API key found")
    
    try:
        # Initialize OpenAI client with OpenRouter
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
        )
        print("✅ OpenAI client initialized")
        
        # Test text completion
        print("\n🧠 Testing Gemma text completion...")
        completion = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": "http://localhost:5000",
                "X-Title": "ClimaTech AI Backend Test",
            },
            model="google/gemma-2-27b-it:free",
            messages=[
                {
                    "role": "user",
                    "content": "Hello! Can you explain what climate monitoring involves?"
                }
            ],
            max_tokens=200
        )
        
        response = completion.choices[0].message.content
        print(f"✅ Text response received: {response[:100]}...")
        
        # Test image analysis
        print("\n🖼️ Testing Gemma image analysis...")
        image_completion = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": "http://localhost:5000",
                "X-Title": "ClimaTech AI Backend Test",
            },
            model="google/gemma-2-27b-it:free",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "What is in this image?"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"
                            }
                        }
                    ]
                }
            ],
            max_tokens=200
        )
        
        image_response = image_completion.choices[0].message.content
        print(f"✅ Image analysis response: {image_response[:100]}...")
        
        print("\n🎉 All tests passed! Gemma integration is working correctly.")
        return True
        
    except Exception as e:
        print(f"❌ Error testing Gemma: {str(e)}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Gemma AI Integration")
    print("=" * 40)
    
    success = test_gemma_installation()
    
    if success:
        print("\n✅ Ready to use Gemma in ClimaTech AI!")
        print("\nNext steps:")
        print("1. Start the backend: python backend/app.py")
        print("2. Start the frontend: cd Frontend-Admin && npm run dev")
        print("3. Visit: http://localhost:3000/dashboard/gemma-test")
    else:
        print("\n❌ Setup incomplete. Please check your configuration.")
