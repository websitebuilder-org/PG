#!/usr/bin/env python3
"""
Backend API Testing for Microstock Prompt Generator
Tests all API endpoints with real Emergent LLM key
"""

import requests
import sys
import json
from datetime import datetime
import time

class MicrostockAPITester:
    def __init__(self, base_url="https://stock-prompt-craft.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.generated_prompts_id = None
        self.saved_favorite_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error detail: {error_detail}")
                except:
                    print(f"   Response text: {response.text[:200]}...")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ FAILED - Request timeout after {timeout}s")
            return False, {}
        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root Endpoint",
            "GET", 
            "",
            200
        )
        if success:
            print(f"   Response: {response}")
        return success

    def test_generate_prompts_with_emergent_key(self):
        """Test prompt generation using Emergent LLM key"""
        test_data = {
            "keyword": "sunset beach vacation",
            "style": "photo",
            "provider": "openai", 
            "model": "gpt-5.1",
            "quantity": 3,
            "output_format": "json",
            "use_emergent_key": True
        }
        
        success, response = self.run_test(
            "Generate Prompts (Emergent Key)",
            "POST",
            "generate", 
            200,
            data=test_data,
            timeout=60  # AI generation may take longer
        )
        
        if success:
            self.generated_prompts_id = response.get('id')
            print(f"   Generated {len(response.get('prompts', []))} prompts")
            print(f"   Generation ID: {self.generated_prompts_id}")
            for i, prompt in enumerate(response.get('prompts', [])[:2]):  # Show first 2
                print(f"   Prompt {i+1}: {prompt[:100]}...")
        
        return success

    def test_generate_prompts_invalid_provider(self):
        """Test prompt generation with invalid provider"""
        test_data = {
            "keyword": "test",
            "style": "photo",
            "provider": "invalid_provider",
            "model": "gpt-5.1", 
            "quantity": 1,
            "output_format": "json",
            "use_emergent_key": True
        }
        
        success, response = self.run_test(
            "Generate Prompts (Invalid Provider)",
            "POST",
            "generate",
            400,  # Should return 400 for invalid provider
            data=test_data
        )
        return success

    def test_generate_prompts_no_api_key(self):
        """Test prompt generation without API key"""
        test_data = {
            "keyword": "test",
            "style": "photo", 
            "provider": "openai",
            "model": "gpt-5.1",
            "quantity": 1,
            "output_format": "json",
            "use_emergent_key": False  # No API key provided
        }
        
        success, response = self.run_test(
            "Generate Prompts (No API Key)",
            "POST",
            "generate",
            400,  # Should return 400 for missing API key
            data=test_data
        )
        return success

    def test_get_history(self):
        """Test getting generation history"""
        success, response = self.run_test(
            "Get History",
            "GET",
            "history",
            200
        )
        
        if success:
            history_count = len(response)
            print(f"   Found {history_count} history items")
            if history_count > 0:
                latest = response[0]
                print(f"   Latest: {latest.get('keyword')} ({latest.get('style')})")
        
        return success

    def test_save_favorite(self):
        """Test saving a prompt to favorites"""
        if not self.generated_prompts_id:
            print("⚠️  SKIPPING - No generated prompts ID available")
            return False
            
        test_data = {
            "prompt_generation_id": self.generated_prompts_id,
            "prompt_text": "Beautiful sunset over tropical beach with golden sand and crystal clear water",
            "keyword": "sunset beach vacation",
            "style": "photo"
        }
        
        success, response = self.run_test(
            "Save Favorite",
            "POST",
            "favorites",
            200,
            data=test_data
        )
        
        if success:
            self.saved_favorite_id = response.get('id')
            print(f"   Favorite ID: {self.saved_favorite_id}")
        
        return success

    def test_get_favorites(self):
        """Test getting saved favorites"""
        success, response = self.run_test(
            "Get Favorites",
            "GET", 
            "favorites",
            200
        )
        
        if success:
            favorites_count = len(response)
            print(f"   Found {favorites_count} favorites")
            if favorites_count > 0:
                latest = response[0]
                print(f"   Latest: {latest.get('keyword')} - {latest.get('prompt_text')[:50]}...")
        
        return success

    def test_delete_favorite(self):
        """Test deleting a favorite"""
        if not self.saved_favorite_id:
            print("⚠️  SKIPPING - No saved favorite ID available") 
            return False
            
        success, response = self.run_test(
            "Delete Favorite",
            "DELETE",
            f"favorites/{self.saved_favorite_id}",
            200
        )
        
        if success:
            print(f"   Message: {response.get('message')}")
        
        return success

    def test_delete_nonexistent_favorite(self):
        """Test deleting a non-existent favorite"""
        fake_id = "non-existent-id-12345"
        
        success, response = self.run_test(
            "Delete Non-existent Favorite",
            "DELETE",
            f"favorites/{fake_id}",
            404  # Should return 404 for not found
        )
        return success

def main():
    print("🚀 Starting Microstock Prompt Generator API Tests")
    print("=" * 60)
    
    tester = MicrostockAPITester()
    
    # Run all tests in sequence
    tests = [
        tester.test_root_endpoint,
        tester.test_generate_prompts_with_emergent_key,
        tester.test_generate_prompts_invalid_provider,
        tester.test_generate_prompts_no_api_key,
        tester.test_get_history,
        tester.test_save_favorite, 
        tester.test_get_favorites,
        tester.test_delete_favorite,
        tester.test_delete_nonexistent_favorite
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ EXCEPTION in {test.__name__}: {str(e)}")
        
        # Small delay between tests
        time.sleep(1)
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 ALL TESTS PASSED!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} TESTS FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(main())