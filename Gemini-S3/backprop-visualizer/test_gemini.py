#!/usr/bin/env python3
"""
Test script for Gemini API integration
"""
import requests
import json

def test_gemini_api():
    """Test the Gemini API directly"""
    
    GEMINI_API_KEY = "AIzaSyA0arm212nZUmlURuXbbopV4XHWyhGwb5w"
    GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    
    headers = {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY
    }
    
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": "Explain what backpropagation is in neural networks in 2 sentences."
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 1024,
        }
    }
    
    try:
        print("Testing Gemini API...")
        response = requests.post(GEMINI_API_URL, headers=headers, json=payload, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if 'candidates' in data and len(data['candidates']) > 0:
                candidate = data['candidates'][0]
                if 'content' in candidate and 'parts' in candidate['content']:
                    ai_message = candidate['content']['parts'][0]['text']
                    print("✅ Gemini API Test Successful!")
                    print(f"Response: {ai_message}")
                    return True
                else:
                    print("❌ Invalid response format")
                    print(f"Response: {json.dumps(data, indent=2)}")
            else:
                print("❌ No candidates in response")
                print(f"Response: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        
    return False

def test_chat_endpoint():
    """Test the Flask chat endpoint"""
    
    try:
        print("\nTesting Flask chat endpoint...")
        
        response = requests.post(
            'http://localhost:5001/api/chat',
            headers={'Content-Type': 'application/json'},
            json={'message': 'What is backpropagation?'},
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Flask Chat Endpoint Test Successful!")
                print(f"AI Response: {data['message'][:100]}...")
                return True
            else:
                print(f"❌ Chat endpoint error: {data.get('error')}")
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Flask server. Make sure the app is running on localhost:5001")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        
    return False

if __name__ == "__main__":
    print("🧠 NEURALCHAT - Gemini Integration Test")
    print("=" * 50)
    
    # Test Gemini API directly
    gemini_works = test_gemini_api()
    
    # Test Flask endpoint
    flask_works = test_chat_endpoint()
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"Gemini API: {'✅ Working' if gemini_works else '❌ Failed'}")
    print(f"Flask Chat: {'✅ Working' if flask_works else '❌ Failed'}")
    
    if gemini_works and flask_works:
        print("\n🎉 All tests passed! The chat feature is ready to use.")
    elif gemini_works:
        print("\n⚠️ Gemini API works, but Flask server is not responding.")
        print("   Make sure to run: python app.py")
    else:
        print("\n❌ Tests failed. Check your API key and network connection.")
