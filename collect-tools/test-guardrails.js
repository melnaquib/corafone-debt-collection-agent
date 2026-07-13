#!/usr/bin/env node

/**
 * Guardrail Test Suite
 * Tests that negotiate_calc respects the 24% maximum discount guardrail
 * and never exceeds 3 payment installments
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
const TEST_BALANCE = 4000;

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🔍 Testing Guardrail Enforcement for negotiate_calc\n');
  console.log('=' .repeat(70));

  let passed = 0;
  let failed = 0;

  // Test 1: Full payment WITH verification should NOT exceed 24%
  console.log('\n📋 Test 1: Full payment with verification (should cap at 24%)');
  try {
    const result = await makeRequest('/api/collect/negotiate_calc', {
      account_balance: TEST_BALANCE,
      consumer_offer: TEST_BALANCE, // Full payment
      attempt_no: 1,
      consumer_id: 'test_customer',
      consent_to_verify_funds: true
    });

    console.log(`   Balance: $${TEST_BALANCE}`);
    console.log(`   Offer: $${TEST_BALANCE} (100%)`);
    console.log(`   Discount: ${result.discount_percent}%`);
    console.log(`   Counter-offer: $${result.counter_offer}`);
    console.log(`   Verification bonus applied: ${result.verification_bonus_applied}`);

    if (result.discount_percent <= 24) {
      console.log('   ✅ PASS: Discount respects 24% maximum');
      passed++;
    } else {
      console.log(`   ❌ FAIL: Discount ${result.discount_percent}% exceeds 24% maximum`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    failed++;
  }

  // Test 2: 2-payment plan WITH verification should get 24%
  console.log('\n📋 Test 2: 2-payment plan with verification (should be 24%)');
  try {
    const result = await makeRequest('/api/collect/negotiate_calc', {
      account_balance: TEST_BALANCE,
      consumer_offer: TEST_BALANCE * 0.6, // 60% - qualifies for 2-payment
      attempt_no: 1,
      consumer_id: 'test_customer',
      consent_to_verify_funds: true
    });

    console.log(`   Balance: $${TEST_BALANCE}`);
    console.log(`   Offer: $${TEST_BALANCE * 0.6} (60%)`);
    console.log(`   Discount: ${result.discount_percent}%`);
    console.log(`   Counter-offer: $${result.counter_offer} per payment`);
    console.log(`   Installments: ${result.installments}`);
    console.log(`   Verification bonus applied: ${result.verification_bonus_applied}`);

    if (result.discount_percent === 24 && result.verification_bonus_applied) {
      console.log('   ✅ PASS: Got 24% discount with verification bonus');
      passed++;
    } else {
      console.log(`   ❌ FAIL: Expected 24% with bonus, got ${result.discount_percent}%`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    failed++;
  }

  // Test 3: 2-payment plan WITHOUT verification should get 22%
  console.log('\n📋 Test 3: 2-payment plan without verification (should be 22%)');
  try {
    const result = await makeRequest('/api/collect/negotiate_calc', {
      account_balance: TEST_BALANCE,
      consumer_offer: TEST_BALANCE * 0.6, // 60% - qualifies for 2-payment
      attempt_no: 1,
      consent_to_verify_funds: false
    });

    console.log(`   Balance: $${TEST_BALANCE}`);
    console.log(`   Offer: $${TEST_BALANCE * 0.6} (60%)`);
    console.log(`   Discount: ${result.discount_percent}%`);
    console.log(`   Counter-offer: $${result.counter_offer} per payment`);
    console.log(`   Verification bonus applied: ${result.verification_bonus_applied}`);

    if (result.discount_percent === 22 && !result.verification_bonus_applied) {
      console.log('   ✅ PASS: Got 22% discount without bonus');
      passed++;
    } else {
      console.log(`   ❌ FAIL: Expected 22% without bonus, got ${result.discount_percent}%`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    failed++;
  }

  // Test 4: 3-payment plan requires 75% offer (3 × 25% floor per installment)
  console.log('\n📋 Test 4: 3-payment plan floor enforcement (needs >= 75% offer)');
  try {
    const result = await makeRequest('/api/collect/negotiate_calc', {
      account_balance: TEST_BALANCE,
      consumer_offer: TEST_BALANCE * 0.75, // 75% - minimum for 3-payment if verified
      attempt_no: 1,
      consumer_id: 'test_customer',
      consent_to_verify_funds: true
    });

    console.log(`   Balance: $${TEST_BALANCE}`);
    console.log(`   Offer: $${TEST_BALANCE * 0.75} (75%)`);
    console.log(`   Plan type: ${result.plan_type}`);
    console.log(`   Installments: ${result.installments}`);
    console.log(`   Discount: ${result.discount_percent}%`);

    if (result.plan_type === 'payment_plan_3' && result.installments === 3) {
      console.log('   ✅ PASS: 75% offer gets 3-payment plan');
      passed++;
    } else {
      console.log(`   ❌ FAIL: Expected 3-payment plan, got ${result.plan_type}`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    failed++;
  }

  // Test 5: Offers below 50% but above 25% should be rejected
  console.log('\n📋 Test 5: Floor enforcement (25%-50% offers rejected)');
  try {
    const result = await makeRequest('/api/collect/negotiate_calc', {
      account_balance: TEST_BALANCE,
      consumer_offer: TEST_BALANCE * 0.4, // 40% - below 50% minimum for 2-payment
      attempt_no: 1,
      consumer_id: 'test_customer',
      consent_to_verify_funds: true
    });

    console.log(`   Balance: $${TEST_BALANCE}`);
    console.log(`   Offer: $${TEST_BALANCE * 0.4} (40%)`);
    console.log(`   Plan type: ${result.plan_type}`);
    console.log(`   Counter-offer: $${result.counter_offer}`);

    if (result.plan_type === 'below_minimum_for_plan' && result.counter_offer === TEST_BALANCE * 0.5) {
      console.log('   ✅ PASS: Offer rejected, counter at 50% (2-payment minimum)');
      passed++;
    } else {
      console.log(`   ❌ FAIL: Expected rejection, got ${result.plan_type}`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    failed++;
  }

  // Test 6: All discounts should never exceed 24%
  console.log('\n📋 Test 6: Comprehensive discount cap test (all scenarios)');
  const scenarios = [
    { offer: TEST_BALANCE, name: 'Full payment', verified: true },
    { offer: TEST_BALANCE, name: 'Full payment', verified: false },
    { offer: TEST_BALANCE * 0.6, name: '2-payment', verified: true },
    { offer: TEST_BALANCE * 0.6, name: '2-payment', verified: false },
    { offer: TEST_BALANCE * 0.75, name: '3-payment', verified: true },
  ];

  let allWithinLimit = true;
  for (const scenario of scenarios) {
    try {
      const result = await makeRequest('/api/collect/negotiate_calc', {
        account_balance: TEST_BALANCE,
        consumer_offer: scenario.offer,
        attempt_no: 1,
        consumer_id: 'test_customer',
        consent_to_verify_funds: scenario.verified
      });

      console.log(`   ${scenario.name} (verified=${scenario.verified}): ${result.discount_percent}%`);

      if (result.discount_percent > 24) {
        console.log(`      ❌ VIOLATION: Exceeds 24% maximum!`);
        allWithinLimit = false;
      }
    } catch (error) {
      console.log(`   ❌ ERROR in ${scenario.name}: ${error.message}`);
      allWithinLimit = false;
    }
  }

  if (allWithinLimit) {
    console.log('   ✅ PASS: All scenarios respect 24% maximum');
    passed++;
  } else {
    console.log('   ❌ FAIL: Some scenarios exceeded 24% maximum');
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('✅ All guardrails enforced correctly!\n');
    process.exit(0);
  } else {
    console.log('❌ Some guardrails were violated!\n');
    process.exit(1);
  }
}

// Check if server is running
console.log('Checking if server is running on port 3001...');
const checkServer = http.get('http://localhost:3001/api/collect/health', (res) => {
  if (res.statusCode === 200 || res.statusCode === 404) {
    console.log('✅ Server is running\n');
    runTests();
  }
});

checkServer.on('error', (err) => {
  console.error('❌ Server is not running on port 3001');
  console.error('Please start the server with: npm start');
  console.error(`Error: ${err.message}\n`);
  process.exit(1);
});
