// 購物車資料
let cart = [];

// 切換購物車顯示
function toggleCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    cartSidebar.classList.toggle('active');
}

// 加入購物車
function addToCart(productId, size) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // 檢查是否已存在相同產品和規格
    const existingItem = cart.find(item => item.productId === productId && item.size === size);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            productId: productId,
            id: productId,           // ← 加入 id（與 productId 相同）
            name: product.name,
            size: size,
            price: product.prices[size],
            quantity: 1
        });
    }

    updateCart();
    showAddedNotification();
}

// 更新購物車數量
function updateCartItemQuantity(productId, size, change) {
    const item = cart.find(item => item.productId === productId && item.size === size);
    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        removeFromCart(productId, size);
    } else {
        updateCart();
    }
}

// 從購物車移除
function removeFromCart(productId, size) {
    cart = cart.filter(item => !(item.productId === productId && item.size === size));
    updateCart();
}

// 更新購物車顯示
function updateCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');

    // 更新購物車數量標記
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    // 計算總金額
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `NT$ ${total.toLocaleString()}`;

    // 清空購物車容器
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart">購物車是空的</div>';
        return;
    }

    // 渲染購物車項目
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';

        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-size">${item.size}</div>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="updateCartItemQuantity('${item.productId}', '${item.size}', -1)">-</button>
                <span class="cart-item-qty">${item.quantity}</span>
                <button class="qty-btn" onclick="updateCartItemQuantity('${item.productId}', '${item.size}', 1)">+</button>
            </div>
            <div class="cart-item-price">NT$ ${(item.price * item.quantity).toLocaleString()}</div>
            <button class="remove-btn" onclick="removeFromCart('${item.productId}', '${item.size}')" title="移除">🗑</button>
        `;

        cartItemsContainer.appendChild(cartItem);
    });
}

// 顯示加入購物車提示
function showAddedNotification() {
    // 簡單的視覺回饋
    const cartIcon = document.querySelector('.cart-icon');
    cartIcon.style.transform = 'scale(1.1)';
    setTimeout(() => {
        cartIcon.style.transform = 'scale(1)';
    }, 200);
}

// 清空購物車
function clearCart() {
    cart = [];
    updateCart();
}

// 取得購物車總金額
function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// 取得購物車項目摘要
function getCartSummary() {
    return cart.map(item => ({
        id: item.id,           // ← 加入商品 ID（用於後端價格驗證）
        name: item.name,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
    }));
}
