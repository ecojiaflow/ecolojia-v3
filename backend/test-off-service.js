// Test OpenFoodFacts Service
const offService = require('./src/services/openfoodfacts.service');

async function testService() {
  console.log('🧪 Testing OpenFoodFacts Service\n');
  
  // Test 1: Nutella (should be found on OFF)
  console.log('Test 1: Fetching Nutella (3017620422003)...');
  const nutella = await offService.fetchProduct('3017620422003');
  console.log('Result:', nutella.found ? '✅ Found' : '❌ Not found');
  if (nutella.found) {
    console.log('Source:', nutella.source);
    console.log('Product name:', nutella.data.product_name);
  }
  
  // Test 2: Beauty product
  console.log('\nTest 2: Testing beauty product detection...');
  console.log('Is 3017620422003 beauty?', offService.isBeautyProduct('3017620422003'));
  
  // Test 3: Extract data
  if (nutella.found) {
    console.log('\nTest 3: Extracting product data...');
    const extracted = offService.extractProductData(nutella.data);
    console.log('Name:', extracted.name);
    console.log('Brand:', extracted.brand);
    console.log('Nutriscore:', extracted.nutriscore_grade);
    console.log('Nova group:', extracted.nova_group);
  }
  
  // Test 4: Invalid barcode
  console.log('\nTest 4: Testing invalid barcode...');
  const invalid = await offService.fetchProduct('1234567890123');
  console.log('Result:', invalid.found ? '✅ Found' : '❌ Not found (expected)');
}

testService().then(() => {
  console.log('\n✅ Tests completed');
  process.exit(0);
}).catch(err => {
  console.error('❌ Test error:', err);
  process.exit(1);
});
