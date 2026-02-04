import requests
import sys
import json
from datetime import datetime

class SecureBridgeAPITester:
    def __init__(self, base_url="https://securenotify-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_message_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else self.api_url
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "",
            200
        )
        return success

    def test_send_message(self):
        """Test sending a secure message"""
        test_data = {
            "recipient_email": "test@example.com",
            "subject": "Test Secure Message",
            "body": "This is a test message to verify the secure messaging system."
        }
        
        success, response = self.run_test(
            "Send Message",
            "POST",
            "send",
            200,
            data=test_data
        )
        
        if success and 'message_id' in response:
            self.created_message_id = response['message_id']
            print(f"   Created message ID: {self.created_message_id}")
            print(f"   Inbox URL: {response.get('inbox_url', 'N/A')}")
            
            # Verify response structure
            required_fields = ['message_id', 'inbox_url', 'message']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                print(f"⚠️  Warning: Missing fields in response: {missing_fields}")
                return False
                
        return success

    def test_get_messages(self):
        """Test getting all messages"""
        success, response = self.run_test(
            "Get All Messages",
            "GET",
            "messages",
            200
        )
        
        if success:
            if isinstance(response, list):
                print(f"   Found {len(response)} messages")
                if len(response) > 0:
                    # Check message structure
                    first_message = response[0]
                    required_fields = ['id', 'recipient_email', 'subject', 'body', 'is_read', 'created_at']
                    missing_fields = [field for field in required_fields if field not in first_message]
                    if missing_fields:
                        print(f"⚠️  Warning: Missing fields in message: {missing_fields}")
                        return False
                    print(f"   Sample message: {first_message['subject']} (read: {first_message['is_read']})")
            else:
                print(f"❌ Expected list, got {type(response)}")
                return False
                
        return success

    def test_get_specific_message(self, message_id=None):
        """Test getting a specific message by ID"""
        if message_id is None:
            message_id = self.created_message_id
            
        if not message_id:
            print("❌ No message ID available for testing")
            return False
            
        success, response = self.run_test(
            f"Get Message by ID ({message_id})",
            "GET",
            f"message/{message_id}",
            200
        )
        
        if success:
            # Verify message structure
            required_fields = ['id', 'recipient_email', 'subject', 'body', 'is_read', 'created_at']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                print(f"⚠️  Warning: Missing fields in message: {missing_fields}")
                return False
                
            print(f"   Message subject: {response.get('subject', 'N/A')}")
            print(f"   Is read: {response.get('is_read', 'N/A')}")
            print(f"   Recipient: {response.get('recipient_email', 'N/A')}")
            
        return success

    def test_message_not_found(self):
        """Test getting a non-existent message"""
        fake_id = "non-existent-message-id"
        success, response = self.run_test(
            "Get Non-existent Message",
            "GET",
            f"message/{fake_id}",
            404
        )
        return success

    def test_read_status_change(self):
        """Test that message is marked as read when accessed"""
        if not self.created_message_id:
            print("❌ No message ID available for read status test")
            return False
            
        # First, get all messages to check initial read status
        print("\n🔍 Checking initial read status...")
        success, messages = self.run_test(
            "Get Messages (before read)",
            "GET",
            "messages",
            200
        )
        
        if not success:
            return False
            
        # Find our message
        our_message = None
        for msg in messages:
            if msg['id'] == self.created_message_id:
                our_message = msg
                break
                
        if not our_message:
            print(f"❌ Could not find message with ID {self.created_message_id}")
            return False
            
        initial_read_status = our_message['is_read']
        print(f"   Initial read status: {initial_read_status}")
        
        # Now access the message (should mark as read)
        success, message_detail = self.run_test(
            "Access Message (should mark as read)",
            "GET",
            f"message/{self.created_message_id}",
            200
        )
        
        if not success:
            return False
            
        final_read_status = message_detail['is_read']
        print(f"   Final read status: {final_read_status}")
        
        # Verify the read status changed to True
        if final_read_status != True:
            print(f"❌ Expected is_read to be True, got {final_read_status}")
            return False
            
        print("✅ Message correctly marked as read")
        return True

def main():
    print("🚀 Starting SecureBridge API Tests")
    print("=" * 50)
    
    tester = SecureBridgeAPITester()
    
    # Run all tests
    tests = [
        ("API Health Check", tester.test_health_check),
        ("Send Message", tester.test_send_message),
        ("Get All Messages", tester.test_get_messages),
        ("Get Specific Message", tester.test_get_specific_message),
        ("Message Not Found", tester.test_message_not_found),
        ("Read Status Change", tester.test_read_status_change),
    ]
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if not result:
                print(f"❌ {test_name} failed")
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())