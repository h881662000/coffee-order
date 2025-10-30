/**
 * ☕ 咖啡訂購系統 - Google Apps Script (相容版)
 *
 * 此版本不使用可選鏈運算子 (?.)，相容舊版 Google Apps Script
 */

// ==================== 商品價格表 ====================
const CORRECT_PRICES = {
  'A': { '120g': 350, '260g': 680 },
  'B': { '120g': 380, '260g': 720 },
  'C': { '120g': 320, '260g': 620 },
  'D': { '120g': 420, '260g': 800 }
};

// ==================== 設定區 ====================
const CONFIG = {
  SHEET_NAME: '訂單資料',
  SUSPICIOUS_SHEET_NAME: '可疑訂單',
  ENABLE_PRICE_VERIFICATION: true,
  LOG_ALL_ORDERS: true,
  ENABLE_EMAIL_NOTIFICATION: true,
  ADMIN_EMAIL: 'h881662000@gmail.com'
};

// ==================== 輔助函數 ====================
function getCustomerField(data, field, defaultValue) {
  if (data.customer && data.customer[field]) {
    return data.customer[field];
  }
  if (data[field]) {
    return data[field];
  }
  return defaultValue || '';
}

// ==================== 主要功能 ====================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    Logger.log('收到訂單：' + data.orderNumber);

    // 驗證訂單資料
    const validation = validateOrder(data);

    if (!validation.valid) {
      if (CONFIG.LOG_ALL_ORDERS) {
        logSuspiciousOrder(data, validation.reason);
      }

      if (CONFIG.ENABLE_EMAIL_NOTIFICATION) {
        sendAlertEmail(data, validation.reason);
      }

      Logger.log('⚠️ 訂單被拒絕：' + validation.reason);

      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: validation.reason
      })).setMimeType(ContentService.MimeType.JSON);
    }

    saveOrderToSheet(data);
    Logger.log('✅ 訂單已儲存：' + data.orderNumber);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: '訂單已成功送出',
      orderNumber: data.orderNumber
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('❌ 錯誤：' + error.toString());

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: '系統錯誤，請稍後再試'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'OK',
    message: '咖啡訂購系統 API 運作正常',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// ==================== 訂單驗證 ====================

function validateOrder(data) {
  if (!data.orderNumber || !data.items || !data.total) {
    return {
      valid: false,
      reason: '⚠️ 訂單資料不完整'
    };
  }

  if (data.items.length === 0) {
    return {
      valid: false,
      reason: '⚠️ 訂單沒有商品'
    };
  }

  if (CONFIG.ENABLE_PRICE_VERIFICATION) {
    const priceValidation = validatePrices(data);
    if (!priceValidation.valid) {
      return priceValidation;
    }
  }

  const totalValidation = validateTotal(data);
  if (!totalValidation.valid) {
    return totalValidation;
  }

  return { valid: true };
}

function validatePrices(data) {
  // 🔍 Debug: 記錄收到的商品資料
  Logger.log('📦 驗證商品價格，共 ' + data.items.length + ' 項商品');

  for (var i = 0; i < data.items.length; i++) {
    var item = data.items[i];

    Logger.log('📝 商品 ' + (i+1) + '：' + JSON.stringify(item));

    // 檢查商品 ID 是否存在
    if (!item.id) {
      Logger.log('❌ 商品缺少 ID：' + JSON.stringify(item));
      return {
        valid: false,
        reason: '⚠️ 商品資料格式錯誤（缺少商品代碼）'
      };
    }

    Logger.log('   商品 ID：' + item.id + ', 規格：' + item.size + ', 價格：' + item.price);

    var correctPriceObj = CORRECT_PRICES[item.id];

    if (!correctPriceObj) {
      Logger.log('❌ 找不到商品價格：id=' + item.id);
      return {
        valid: false,
        reason: '⚠️ 無效的商品：' + item.name + ' (代碼:' + item.id + ')'
      };
    }

    var correctPrice = correctPriceObj[item.size];

    if (!correctPrice) {
      Logger.log('❌ 找不到規格價格：id=' + item.id + ', size=' + item.size);
      return {
        valid: false,
        reason: '⚠️ 無效的商品規格：' + item.name + ' (' + item.size + ')'
      };
    }

    if (item.price !== correctPrice) {
      Logger.log('❌ 價格異常：' + item.name + ' ' + item.size);
      Logger.log('   送出價格：' + item.price + '，正確價格：' + correctPrice);

      return {
        valid: false,
        reason: '⚠️ 商品價格異常，訂單已被系統拒絕'
      };
    }
  }

  return { valid: true };
}

function validateTotal(data) {
  var calculatedTotal = 0;

  for (var i = 0; i < data.items.length; i++) {
    var item = data.items[i];
    calculatedTotal += item.price * item.quantity;
  }

  if (data.discount) {
    calculatedTotal -= data.discount;
  }

  if (data.shipping) {
    calculatedTotal += data.shipping;
  }

  if (Math.abs(calculatedTotal - data.total) > 1) {
    Logger.log('❌ 總金額異常：送出 ' + data.total + '，計算 ' + calculatedTotal);

    return {
      valid: false,
      reason: '⚠️ 訂單金額異常，訂單已被系統拒絕'
    };
  }

  return { valid: true };
}

// ==================== 資料儲存 ====================

function saveOrderToSheet(data) {
  var sheet = getOrCreateSheet(CONFIG.SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      '訂單編號',
      '訂單時間',
      '姓名',
      '電話',
      'Email',
      '地址',
      '商品明細',
      '商品小計',
      '折扣',
      '運費',
      '訂單總額',
      '付款方式',
      '備註',
      '會員ID',
      '獲得點數'
    ]);

    var headerRange = sheet.getRange(1, 1, 1, 15);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4CAF50');
    headerRange.setFontColor('#FFFFFF');
  }

  var itemsText = data.items.map(function(item) {
    return item.name + ' ' + item.size + ' x' + item.quantity + ' = NT$' + (item.price * item.quantity);
  }).join('\n');

  var subtotal = data.items.reduce(function(sum, item) {
    return sum + (item.price * item.quantity);
  }, 0);

  sheet.appendRow([
    data.orderNumber,
    new Date(),
    getCustomerField(data, 'name', ''),
    getCustomerField(data, 'phone', ''),
    getCustomerField(data, 'email', ''),
    getCustomerField(data, 'address', ''),
    itemsText,
    subtotal,
    data.discount || 0,
    data.shipping || 0,
    data.total,
    data.paymentMethod || data.payment || 'COD',
    getCustomerField(data, 'note', ''),
    data.memberId || '',
    data.earnedPoints || 0
  ]);

  Logger.log('✅ 訂單已儲存到 Sheet：' + data.orderNumber);
}

function logSuspiciousOrder(data, reason) {
  var sheet = getOrCreateSheet(CONFIG.SUSPICIOUS_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      '記錄時間',
      '訂單編號',
      '姓名',
      '電話',
      'Email',
      '商品明細',
      '送出總額',
      '拒絕原因'
    ]);

    var headerRange = sheet.getRange(1, 1, 1, 8);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#F44336');
    headerRange.setFontColor('#FFFFFF');
  }

  var itemsText = data.items ? data.items.map(function(item) {
    return item.name + ' ' + item.size + ' x' + item.quantity + ' = NT$' + (item.price * item.quantity);
  }).join('\n') : '無';

  sheet.appendRow([
    new Date(),
    data.orderNumber || '無',
    getCustomerField(data, 'name', '無'),
    getCustomerField(data, 'phone', '無'),
    getCustomerField(data, 'email', '無'),
    itemsText,
    data.total || 0,
    reason
  ]);

  Logger.log('⚠️ 可疑訂單已記錄：' + reason);
}

// ==================== 輔助功能 ====================

function getOrCreateSheet(sheetName) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    Logger.log('✅ 已建立新 Sheet：' + sheetName);
  }

  return sheet;
}

function sendAlertEmail(data, reason) {
  if (!CONFIG.ADMIN_EMAIL) {
    Logger.log('⚠️ 未設定管理者 Email');
    return;
  }

  var subject = '⚠️ 可疑訂單警示：' + data.orderNumber;
  var body = '偵測到可疑訂單，已自動拒絕：\n\n' +
    '訂單編號：' + data.orderNumber + '\n' +
    '拒絕原因：' + reason + '\n\n' +
    '客戶資訊：\n' +
    '姓名：' + getCustomerField(data, 'name', '無') + '\n' +
    '電話：' + getCustomerField(data, 'phone', '無') + '\n' +
    'Email：' + getCustomerField(data, 'email', '無') + '\n\n' +
    '訂單內容：\n' +
    (data.items ? data.items.map(function(item) {
      return '- ' + item.name + ' ' + item.size + ' x' + item.quantity + ' = NT$' + (item.price * item.quantity);
    }).join('\n') : '無') + '\n\n' +
    '送出總額：NT$ ' + data.total + '\n\n' +
    '時間：' + new Date().toLocaleString('zh-TW') + '\n\n' +
    '此郵件由系統自動發送，請勿回覆。';

  try {
    MailApp.sendEmail(CONFIG.ADMIN_EMAIL, subject, body);
    Logger.log('✅ 警示 Email 已發送');
  } catch (error) {
    Logger.log('❌ Email 發送失敗：' + error.toString());
  }
}

// ==================== 管理功能 ====================

function updatePrices() {
  Logger.log('目前的商品價格：');
  Logger.log(JSON.stringify(CORRECT_PRICES, null, 2));
  Logger.log('\n⚠️ 如需更改價格，請直接修改 CORRECT_PRICES 物件');
  Logger.log('⚠️ 記得同步更新前端的 products.js');
}

function testPriceValidation() {
  var validOrder = {
    orderNumber: 'TEST-001',
    items: [
      { id: 'A', name: '咖啡豆 A', size: '120g', price: 350, quantity: 1 }
    ],
    total: 350
  };

  Logger.log('測試正常訂單：');
  Logger.log(JSON.stringify(validateOrder(validOrder)));

  var invalidOrder = {
    orderNumber: 'TEST-002',
    items: [
      { id: 'A', name: '咖啡豆 A', size: '120g', price: 1, quantity: 1 }
    ],
    total: 1
  };

  Logger.log('\n測試異常訂單：');
  Logger.log(JSON.stringify(validateOrder(invalidOrder)));
}

function viewRecentOrders() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    Logger.log('⚠️ 找不到訂單 Sheet');
    return;
  }

  var lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    Logger.log('📭 目前沒有訂單');
    return;
  }

  Logger.log('📊 總共有 ' + (lastRow - 1) + ' 筆訂單\n');
  Logger.log('最近 5 筆訂單：');

  var startRow = Math.max(2, lastRow - 4);
  var data = sheet.getRange(startRow, 1, lastRow - startRow + 1, 11).getValues();

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    Logger.log('\n訂單編號：' + row[0]);
    Logger.log('時間：' + row[1]);
    Logger.log('客戶：' + row[2] + ' (' + row[3] + ')');
    Logger.log('總額：NT$ ' + row[10]);
  }
}
