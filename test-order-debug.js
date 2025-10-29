/**
 * 🧪 訂單除錯測試腳本
 *
 * 使用方式：
 * 1. 開啟網站 https://h881662000.github.io/coffee-order/
 * 2. 按 F12 開啟 Console
 * 3. 複製此檔案的全部內容
 * 4. 貼到 Console 並按 Enter
 * 5. 執行測試函數
 */

console.log('🧪 訂單除錯工具已載入');

// 測試購物車資料結構
function testCartStructure() {
    console.log('📋 測試 1: 檢查購物車資料結構');
    console.log('==================================');

    if (typeof cart === 'undefined') {
        console.error('❌ 找不到 cart 變數，請先加入商品到購物車');
        return;
    }

    console.log('🛒 購物車內容：', cart);
    console.log('📊 商品數量：', cart.length);

    if (cart.length === 0) {
        console.warn('⚠️ 購物車是空的，請先加入商品');
        return;
    }

    cart.forEach((item, index) => {
        console.log(`\n商品 ${index + 1}:`);
        console.log('  - productId:', item.productId);
        console.log('  - id:', item.id, item.id ? '✅' : '❌ 缺少 id');
        console.log('  - name:', item.name);
        console.log('  - size:', item.size);
        console.log('  - price:', item.price);
        console.log('  - quantity:', item.quantity);
    });

    const allHaveId = cart.every(item => item.id);
    console.log('\n結果：', allHaveId ? '✅ 所有商品都有 id 欄位' : '❌ 有商品缺少 id 欄位');
}

// 測試 getCartSummary 函數
function testGetCartSummary() {
    console.log('\n📋 測試 2: 檢查 getCartSummary() 輸出');
    console.log('==================================');

    if (typeof getCartSummary !== 'function') {
        console.error('❌ 找不到 getCartSummary 函數');
        return;
    }

    const summary = getCartSummary();
    console.log('📦 getCartSummary() 結果：', summary);

    if (summary.length === 0) {
        console.warn('⚠️ 購物車摘要是空的');
        return;
    }

    summary.forEach((item, index) => {
        console.log(`\n商品 ${index + 1}:`);
        console.log('  - id:', item.id, item.id ? '✅' : '❌ 缺少 id');
        console.log('  - name:', item.name);
        console.log('  - size:', item.size);
        console.log('  - price:', item.price);
        console.log('  - quantity:', item.quantity);
        console.log('  - subtotal:', item.subtotal);
    });

    const allHaveId = summary.every(item => item.id);
    console.log('\n結果：', allHaveId ? '✅ 所有商品都有 id 欄位' : '❌ 有商品缺少 id 欄位');
}

// 測試完整訂單資料
function testOrderData() {
    console.log('\n📋 測試 3: 模擬完整訂單資料');
    console.log('==================================');

    if (typeof getCartSummary !== 'function' || typeof getCartTotal !== 'function') {
        console.error('❌ 找不到必要的函數');
        return;
    }

    const testOrderData = {
        orderNumber: 'TEST-' + Date.now(),
        timestamp: new Date().toISOString(),
        customer: {
            name: '測試客戶',
            phone: '0912345678',
            email: 'test@example.com'
        },
        items: getCartSummary(),
        total: getCartTotal(),
        paymentMethod: 'COD'
    };

    console.log('📦 完整訂單資料：');
    console.log(JSON.stringify(testOrderData, null, 2));

    console.log('\n🔍 驗證商品 ID：');
    testOrderData.items.forEach((item, index) => {
        const hasId = !!item.id;
        console.log(`  商品 ${index + 1}: ${item.name} - id: "${item.id}" ${hasId ? '✅' : '❌'}`);
    });
}

// 測試價格驗證邏輯
function testPriceValidationLogic() {
    console.log('\n📋 測試 4: 本地價格驗證');
    console.log('==================================');

    const CORRECT_PRICES = {
        'A': { '120g': 350, '260g': 680 },
        'B': { '120g': 380, '260g': 720 },
        'C': { '120g': 320, '260g': 620 },
        'D': { '120g': 420, '260g': 800 }
    };

    if (typeof getCartSummary !== 'function') {
        console.error('❌ 找不到 getCartSummary 函數');
        return;
    }

    const items = getCartSummary();

    items.forEach((item, index) => {
        console.log(`\n商品 ${index + 1}: ${item.name} (${item.size})`);
        console.log(`  - 送出 ID: "${item.id}"`);
        console.log(`  - 送出價格: ${item.price}`);

        if (!item.id) {
            console.error('  ❌ 缺少 ID，會被拒絕');
            return;
        }

        const correctPriceObj = CORRECT_PRICES[item.id];

        if (!correctPriceObj) {
            console.error(`  ❌ 找不到商品 ID "${item.id}" 的價格表`);
            console.log('  📋 可用的 ID:', Object.keys(CORRECT_PRICES));
            return;
        }

        const correctPrice = correctPriceObj[item.size];

        if (!correctPrice) {
            console.error(`  ❌ 找不到規格 "${item.size}" 的價格`);
            console.log('  📋 可用的規格:', Object.keys(correctPriceObj));
            return;
        }

        console.log(`  - 正確價格: ${correctPrice}`);

        if (item.price === correctPrice) {
            console.log('  ✅ 價格正確');
        } else {
            console.error(`  ❌ 價格錯誤！應該是 ${correctPrice}，但送出 ${item.price}`);
        }
    });
}

// 測試直接送出訂單（不會真的送出）
async function testSubmitOrder() {
    console.log('\n📋 測試 5: 模擬送出訂單到 Google Sheets');
    console.log('==================================');

    if (typeof getCartSummary !== 'function' || typeof getCartTotal !== 'function') {
        console.error('❌ 找不到必要的函數');
        return;
    }

    const testOrderData = {
        orderNumber: 'DEBUG-TEST-' + Date.now(),
        timestamp: new Date().toISOString(),
        customer: {
            name: '除錯測試',
            phone: '0912345678',
            email: 'debug@test.com'
        },
        items: getCartSummary(),
        total: getCartTotal(),
        paymentMethod: 'COD'
    };

    console.log('📦 準備送出的訂單資料：');
    console.log(JSON.stringify(testOrderData, null, 2));

    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxVZQbkAKm6KFlV2EuJh_SulQapYpSvTLP5IhOY-gYp86lh8UDcp_DbFEYiaHCS4MwY/exec';

    const confirmed = confirm('⚠️ 確定要送出測試訂單到 Google Sheets 嗎？\n\n這會產生一筆真實的訂單記錄（訂單編號會標記為 DEBUG-TEST）');

    if (!confirmed) {
        console.log('❌ 已取消測試');
        return;
    }

    try {
        console.log('🚀 送出測試訂單...');

        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(testOrderData)
        });

        const result = await response.text();
        console.log('📨 Google Sheets 回應：', result);

        try {
            const responseData = JSON.parse(result);
            if (responseData.success) {
                console.log('✅ 測試成功！訂單已儲存');
            } else {
                console.error('❌ 測試失敗：', responseData.message);
            }
        } catch (e) {
            console.error('❌ 無法解析回應：', result);
        }

    } catch (error) {
        console.error('❌ 送出失敗：', error);
    }
}

// 執行所有測試
function runAllTests() {
    console.clear();
    console.log('🧪 開始執行所有測試');
    console.log('='.repeat(50));

    testCartStructure();
    testGetCartSummary();
    testOrderData();
    testPriceValidationLogic();

    console.log('\n' + '='.repeat(50));
    console.log('✅ 所有測試完成');
    console.log('\n💡 如果要測試送出訂單，請執行：testSubmitOrder()');
}

// 顯示使用說明
console.log(`
╔═══════════════════════════════════════════════════╗
║       🧪 訂單除錯工具 - 使用說明                  ║
╚═══════════════════════════════════════════════════╝

可用的測試函數：

1. runAllTests()
   執行所有測試（推薦）

2. testCartStructure()
   檢查購物車原始資料

3. testGetCartSummary()
   檢查 getCartSummary() 輸出

4. testOrderData()
   檢查完整訂單資料結構

5. testPriceValidationLogic()
   測試價格驗證邏輯

6. testSubmitOrder()
   送出測試訂單到 Google Sheets

---
💡 快速開始：
   1. 加入商品到購物車
   2. 在 Console 輸入：runAllTests()
`);
