#!/usr/bin/env python3
"""
Simple Azure OpenAI test using LangChain
Tests the endpoint with a basic chat completion
"""

import os
import sys
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
import asyncio

def test_azure_openai_sync():
    """Test Azure OpenAI using synchronous approach"""
    print("🧪 Testing Azure OpenAI with LangChain (Sync)")
    print("=" * 60)
    
    # Configuration from README
    config = {
        "azure_deployment": "gpt-4o",
            "azure_endpoint": "https://YOUR_RESOURCE.openai.azure.com/",
    "api_key": "YOUR_API_KEY_HERE",
        "api_version": "2025-01-01-preview"
    }
    
    print(f"🔧 Configuration:")
    print(f"   Endpoint: {config['azure_endpoint']}")
    print(f"   Deployment: {config['azure_deployment']}")
    print(f"   API Version: {config['api_version']}")
    print(f"   API Key Length: {len(config['api_key'])}")
    print()
    
    try:
        # Create Azure OpenAI client
        print("📡 Creating Azure OpenAI client...")
        llm = AzureChatOpenAI(
            openai_api_key=config["api_key"],
            openai_api_version=config["api_version"],
            azure_deployment=config["azure_deployment"],
            azure_endpoint=config["azure_endpoint"],
            temperature=0.1,
            max_tokens=100
        )
        
        print("✅ Client created successfully!")
        print()
        
        # Test with a simple message
        print("💬 Testing with message: 'Hi! How are you?'")
        messages = [HumanMessage(content="Hi! How are you?")]
        
        print("🔄 Sending request...")
        response = llm.invoke(messages)
        
        print("✅ Response received successfully!")
        print(f"🤖 AI Response: {response.content}")
        print()
        
        return True
        
    except Exception as e:
        print(f"❌ Error occurred: {type(e).__name__}: {str(e)}")
        print()
        
        # Check for specific error types
        if "401" in str(e):
            print("🔑 401 Error: Authentication failed. Check your API key.")
        elif "404" in str(e):
            print("🔍 404 Error: Deployment not found. Check deployment name.")
        elif "endpoint" in str(e).lower():
            print("🌐 Endpoint Error: Check your Azure endpoint URL.")
        elif "api_version" in str(e).lower():
            print("📅 API Version Error: Check your API version.")
        
        return False

async def test_azure_openai_async():
    """Test Azure OpenAI using asynchronous approach"""
    print("🧪 Testing Azure OpenAI with LangChain (Async)")
    print("=" * 60)
    
    # Configuration from README
    config = {
        "azure_deployment": "gpt-4o",
        "azure_endpoint": "https://YOUR_RESOURCE.openai.azure.com/",
        "api_key": "YOUR_API_KEY_HERE",
        "api_version": "2025-01-01-preview"
    }
    
    print(f"🔧 Configuration:")
    print(f"   Endpoint: {config['azure_endpoint']}")
    print(f"   Deployment: {config['azure_deployment']}")
    print(f"   API Version: {config['api_version']}")
    print(f"   API Key Length: {len(config['api_key'])}")
    print()
    
    try:
        # Create Azure OpenAI client
        print("📡 Creating Azure OpenAI client...")
        llm = AzureChatOpenAI(
            openai_api_key=config["api_key"],
            openai_api_version=config["api_version"],
            azure_deployment=config["azure_deployment"],
            azure_endpoint=config["azure_endpoint"],
            temperature=0.1,
            max_tokens=100
        )
        
        print("✅ Client created successfully!")
        print()
        
        # Test with a simple message
        print("💬 Testing with message: 'Hello! This is a test.'")
        messages = [HumanMessage(content="Hello! This is a test.")]
        
        print("🔄 Sending async request...")
        response = await llm.ainvoke(messages)
        
        print("✅ Async response received successfully!")
        print(f"🤖 AI Response: {response.content}")
        print()
        
        return True
        
    except Exception as e:
        print(f"❌ Async error occurred: {type(e).__name__}: {str(e)}")
        print()
        
        # Check for specific error types
        if "401" in str(e):
            print("🔑 401 Error: Authentication failed. Check your API key.")
        elif "404" in str(e):
            print("🔍 404 Error: Deployment not found. Check deployment name.")
        elif "endpoint" in str(e).lower():
            print("🌐 Endpoint Error: Check your Azure endpoint URL.")
        elif "api_version" in str(e).lower():
            print("📅 API Version Error: Check your API version.")
        
        return False

def test_different_api_versions():
    """Test different API versions to find one that works"""
    print("🔄 Testing different API versions...")
    print("=" * 60)
    
    api_versions = [
        "2025-01-01-preview",
        "2024-12-01-preview",
        "2024-11-01-preview",
        "2024-10-01-preview",
        "2024-09-01-preview",
        "2024-08-01-preview",
        "2024-07-01-preview",
        "2024-06-01-preview",
        "2024-05-01-preview",
        "2024-04-01-preview",
        "2024-03-01-preview",
        "2024-02-01-preview",
        "2024-01-01-preview"
    ]
    
    config = {
        "azure_deployment": "gpt-4o",
        "azure_endpoint": "https://YOUR_RESOURCE.openai.azure.com/",
        "api_key": "YOUR_API_KEY_HERE"
    }
    
    for api_version in api_versions:
        print(f"\n📡 Testing API version: {api_version}")
        
        try:
            llm = AzureChatOpenAI(
                openai_api_key=config["api_key"],
                openai_api_version=api_version,
                azure_deployment=config["azure_deployment"],
                azure_endpoint=config["azure_endpoint"],
                temperature=0.1,
                max_tokens=50
            )
            
            messages = [HumanMessage(content="Hi")]
            response = llm.invoke(messages)
            
            print(f"✅ API version {api_version} works!")
            print(f"🤖 Response: {response.content}")
            return api_version
            
        except Exception as e:
            error_msg = str(e)
            if "401" in error_msg:
                print(f"❌ {api_version}: Authentication failed (401)")
            elif "404" in error_msg:
                print(f"❌ {api_version}: Deployment not found (404)")
            else:
                print(f"❌ {api_version}: {type(e).__name__}: {error_msg}")
    
    print("\n❌ No working API version found")
    return None

def main():
    """Main test function"""
    print("🚀 Azure OpenAI LangChain Test Suite")
    print("=" * 60)
    print()
    
    # Test 1: Synchronous
    print("1️⃣ Testing Synchronous Approach")
    print("-" * 40)
    sync_success = test_azure_openai_sync()
    print()
    
    # Test 2: Asynchronous
    print("2️⃣ Testing Asynchronous Approach")
    print("-" * 40)
    async_success = asyncio.run(test_azure_openai_async())
    print()
    
    # Test 3: Different API versions (if both failed)
    if not sync_success and not async_success:
        print("3️⃣ Testing Different API Versions")
        print("-" * 40)
        working_version = test_different_api_versions()
        if working_version:
            print(f"\n🎉 Found working API version: {working_version}")
            print("💡 Update your configuration to use this version!")
    
    print("=" * 60)
    if sync_success or async_success:
        print("🎉 Tests completed successfully!")
    else:
        print("❌ All tests failed. Check your configuration.")

if __name__ == "__main__":
    main() 