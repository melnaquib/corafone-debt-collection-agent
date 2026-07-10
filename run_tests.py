#!/usr/bin/env python3
import requests
import json
import sys
import time
import os

# Get API key from environment or config
api_key = os.getenv('ELEVENLABS_API_KEY')
if not api_key:
    # Try to get from elevenlabs config
    config_path = os.path.expanduser('~/.config/elevenlabs/config.json')
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            config = json.load(f)
            api_key = config.get('apiKey')
if not api_key:
    print("Error: ELEVENLABS_API_KEY not found")
    sys.exit(1)

agent_id = "agent_0901kx61mf5xf8fayvqyn7pgh2tc"
headers = {
    "xi-api-key": api_key,
    "Content-Type": "application/json"
}

# Get agent tests
print(f"Getting tests for agent '{agent_id}'...")
response = requests.get(
    f"https://api.elevenlabs.io/v1/convai/agents/{agent_id}",
    headers=headers
)
agent_data = response.json()
test_ids = [t['test_id'] for t in agent_data.get('platform_settings', {}).get('testing', {}).get('attached_tests', [])]

print(f"Found {len(test_ids)} attached tests")

# Run tests
print(f"\nRunning {len(test_ids)} test(s) for agent 'inbound-collect'...\n")

response = requests.post(
    f"https://api.elevenlabs.io/v1/convai/agents/{agent_id}/run-tests",
    headers=headers,
    json={"tests": [{"test_id": tid} for tid in test_ids]}
)

if response.status_code != 200:
    print(f"Error: {response.status_code}")
    print(response.text)
    sys.exit(1)

result = response.json()
invocation_id = result.get('test_invocation_id')
print(f"Test invocation started (ID: {invocation_id})")
print("Waiting for tests to complete...")

# Poll for results
max_wait = 180  # 3 minutes
waited = 0
while waited < max_wait:
    time.sleep(5)
    waited += 5

    response = requests.get(
        f"https://api.elevenlabs.io/v1/convai/test-invocations/{invocation_id}",
        headers=headers
    )

    if response.status_code != 200:
        continue

    status_data = response.json()
    status = status_data.get('status')

    if status == 'completed':
        print("\nTest Results:")
        print("=" * 50)

        results = status_data.get('results', [])
        passed = 0
        failed = 0

        for test_result in results:
            test_name = test_result.get('test_name', 'unknown')
            success = test_result.get('success', False)

            if success:
                print(f"✓ {test_name}: passed")
                passed += 1
            else:
                print(f"✗ {test_name}: failed")
                failed += 1

        print("=" * 50)
        print(f"Total: {len(results)} | Passed: {passed} | Failed: {failed}")

        # Save results
        with open('/tmp/test-results.txt', 'w') as f:
            f.write(f"Running {len(test_ids)} test(s) for agent 'inbound-collect'...\n\n")
            f.write(f"Test invocation started (ID: {invocation_id})\n")
            f.write("Waiting for tests to complete...\n\n")
            f.write("Test Results:\n")
            f.write("=" * 50 + "\n")
            for test_result in results:
                test_name = test_result.get('test_name', 'unknown')
                success = test_result.get('success', False)
                if success:
                    f.write(f"✓ {test_name}: passed\n")
                else:
                    f.write(f"✗ {test_name}: failed\n")
            f.write("=" * 50 + "\n")
            f.write(f"Total: {len(results)} | Passed: {passed} | Failed: {failed}\n")

        sys.exit(0 if failed == 0 else 1)

    elif status == 'failed':
        print("\nTest invocation failed")
        sys.exit(1)

print("\nTimeout waiting for test results")
sys.exit(1)
