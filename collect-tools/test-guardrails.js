#!/usr/bin/env node

/**
 * Guardrail Test Suite
 * Tests that negotiate_calc respects:
 * - 24% maximum discount guardrail
 * - 3 payment maximum installments
 * - 25% minimum down payment floor
 * - Down payment logic (consumer_offer is first payment)
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
const TEST_BALANCE = 5000;

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
  console.log('🔍 Testing DOWN PAYMENT Logic and Guardrail Enforcement\n');
  console.log('=' .repeat(70));

  let passed = 0;
  let failed = 0;

  // Test 1: Full payment (down >= 76%) should get 24% discount, NO BONUS
  console.log('\n📋 Test 1: Full payment (down >= 76%) caps at 24% discount');
  try {
    const downPayment = 3800; // 76% of $5000
    const result = await makeRequest('/api/collect/negotiate_calc', {
      account_balance: TEST_BALANCE,
      consumer_offer: downPayment,
      attempt_no: 1,
      consumer_id: 'test_customer',
      consent_to_verify_funds: true
    });

    console.log(`   Balance: $${TEST_BALANCE}`);
    console.log(`   Down payment: $${downPayment} (${(downPayment/TEST_BALANCE*100).toFixed(0)}%)`);
    console.log(`   Plan type: ${result.plan_type}`);
    console.log(`   Discount: ${result.discount_percent}%`);
    console.log(`   Counter-offer (total): $${result.counter_offer}`);
    console.log(`   Verification bonus applied: ${result.verification_bonus_applied}`);

    if (result.plan_type === 'full_payment' &&
        result.discount_percent === 24 &&
        !result.verification_bonus_applied) {
      console.log('   ✅ PASS: Full payment gets 24% discount, no bonus');
      passed++;
    } else {
      console.log(`   ❌ FAIL: Expected full_payment/24%/no bonus`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    failed++;
  }

  // Test 2: 2-payment plan (down >= 50%) with verification should get 24% discount
  console.log('\n📋 Test 2: 2-payment plan (down >= 50%) with verification → 24%');
  try {
    const downPayment = 3000; // 60% of $5000
    const result = await makeRequest('/api/collect/negotiate_calc', {
      account_balance: TEST_BALANCE,
      consumer_offer: downPayment,
      attempt_no: 1,
      consumer_id: 'test_customer',
      consent_to_verify_funds: true
    });

    const totalSettlement = TEST_BALANCE * 0.76; // 24% discount
    const secondPayment = totalSettlement - downPayment;

    console.log(`   Balance: $${TEST_BALANCE}`);
    console.log(`   Down payment: $${downPayment} (${(downPayment/TEST_BALANCE*100).toFixed(0)}%)`);
    console.log(`   Plan type: ${result.plan_type}`);
    console.log(`   Discount: ${result.discount_percent}%`);
    console.log(`   Counter-offer (2nd payment): $${result.counter_offer}`);
    console.log(`   Expected 2nd payment: $${secondPayment}`);
    console.log(`   Total: $${downPayment + result.counter_offer}`);
    console.log(`   Verification bonus applied: ${result.verification_bonus_applied}`);

    if (result.plan_type === 'payment_plan_2' &&
        result.discount_percent === 24 &&
        result.verification_bonus_applied &&
        result.installments === 2) {
      console.log('   ✅ PASS: 2-payment plan gets 24% with verification bonus');
      passed++;
    } else {
      console.log(`   ❌ FAIL: Expected payment_plan_2/24%/bonus=true`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    failed++;
  }

  // Test 3: 2-payment plan WITHOUT verification should get 22% discount
  console.log('\n📋 Test 3: 2-payment plan (down >= 50%) without verification → 22%');
  try {
    const downPayment = 3000; // 60% of $5000
    const result = await makeRequest('/api/collect/negotiate_calc', {
      account_balance: TEST_BALANCE,
      consumer_offer: downPayment,
      attempt_no: 1,
      consent_to_verify_funds: false
    });

    console.log(`   Balance: $${TEST_BALANCE}`);
    console.log(`   Down payment: $${downPayment}`);
    console.log(`   Discount: ${result.discount_percent}%`);
    console.log(`   Counter-offer (2nd payment): $${result.counter_offer}`);
    console.log(`   Verification bonus applied: ${result.verification_bonus_applied}`);

    if (result.discount_percent === 22 && !result.verification_bonus_applied) {
      console.log('   ✅ PASS: 2-payment plan gets 22% without verification');
      passed++;
    } else {
      console.log(`   ❌ FAIL: Expected 22% discount without bonus`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    failed++;
  }

  // Test 4: 3-payment plan (down >= 25%) with verification should get 22% discount
  console.log('\n📋 Test 4: 3-payment plan (down >= 25%) with verification → 22%');
  try {
    const downPayment = 2000; // 40% of $5000
    const result = await makeRequest('/api/collect/negotiate_calc', {
      account_balance: TEST_BALANCE,
      consumer_offer: downPayment,
      attempt_no: 1,
      consumer_id: 'test_customer',
      consent_to_verify_funds: true
    });

    const totalSettlement = TEST_BALANCE * 0.78; // 22% discount
    const remainingBalance = totalSettlement - downPayment;
    const perRemainingPayment = Math.round(remainingBalance / 2);

    console.log(`   Balance: $${TEST_BALANCE}`);
    console.log(`   Down payment: $${downPayment} (${(downPayment/TEST_BALANCE*100).toFixed(0)}%)`);
    console.log(`   Plan type: ${result.plan_type}`);
    console.log(`   Discount: ${result.discount_percent}%`);
    console.log(`   Counter-offer (per remaining payment): $${result.counter_offer}`);
    console.log(`   Expected per remaining payment: $${perRemainingPayment}`);
    console.log(`   Total: $${downPayment} + $${result.counter_offer} × 2 = $${downPayment + result.counter_offer * 2}`);

    if (result.plan_type === 'payment_plan_3' &&
        result.discount_percent === 22 &&
        result.installments === 3) {
      console.log('   ✅ PASS: 3-payment plan gets 22% with verification');
      passed++;
    } else {
      console.log(`   ❌ FAIL: Expected payment_plan_3/22%`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    failed++;
  }

  // Test 5: Below 25% floor should be rejected
  console.log('\n📋 Test 5: Down payment < 25% floor should be rejected');
  try {
    const downPayment = 1000; // 20% of $5000 - below 25% floor
    const result = await makeRequest('/api/collect/negotiate_calc', {
      account_balance: TEST_BALANCE,
      consumer_offer: downPayment,
      attempt_no: 1,
      consumer_id: 'test_customer',
      consent_to_verify_funds: true
    });

    const expectedMinimum = Math.round(TEST_BALANCE * 0.25);

    console.log(`   Balance: $${TEST_BALANCE}`);
    console.log(`   Down payment: $${downPayment} (${(downPayment/TEST_BALANCE*100).toFixed(0)}%)`);
    console.log(`   Plan type: ${result.plan_type}`);
    console.log(`   Counter-offer (minimum): $${result.counter_offer}`);
    console.log(`   Expected minimum: $${expectedMinimum}`);

    if (result.plan_type === 'below_floor' && result.counter_offer === expectedMinimum) {
      console.log('   ✅ PASS: Offer rejected, counter at 25% minimum');
      passed++;
    } else {
      console.log(`   ❌ FAIL: Expected below_floor rejection`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    failed++;
  }

  // Test 6: All discounts should never exceed 24%
  console.log('\n📋 Test 6: Comprehensive discount cap test (all scenarios)');
  const scenarios = [
    { offer: 3800, name: 'Full payment (76%)', verified: true },
    { offer: 3800, name: 'Full payment (76%)', verified: false },
    { offer: 3000, name: '2-payment (60%)', verified: true },
    { offer: 3000, name: '2-payment (60%)', verified: false },
    { offer: 2000, name: '3-payment (40%)', verified: true },
    { offer: 2000, name: '3-payment (40%)', verified: false },
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
