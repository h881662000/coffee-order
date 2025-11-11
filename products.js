// 咖啡產品資料 - 預設商品（僅在初始化時使用）
const DEFAULT_PRODUCTS = [
    {
        id: 'A',
        name: '咖啡豆 A',
        description: '來自衣索比亞的經典單品，帶有花香與柑橘調性，口感明亮清爽。',
        prices: {
            '120g': 350,
            '260g': 680
        },
        image: '☕'
    },
    {
        id: 'B',
        name: '咖啡豆 B',
        description: '哥倫比亞高山咖啡，風味均衡，帶有堅果與焦糖甜感。',
        prices: {
            '120g': 380,
            '260g': 720
        },
        image: '☕'
    },
    {
        id: 'C',
        name: '咖啡豆 C',
        description: '巴西日曬處理，濃郁的巧克力與堅果風味，適合義式濃縮。',
        prices: {
            '120g': 320,
            '260g': 620
        },
        image: '☕'
    },
    {
        id: 'D',
        name: '咖啡豆 D',
        description: '肯亞水洗處理，明顯的莓果酸質與紅酒般的餘韻。',
        prices: {
            '120g': 420,
            '260g': 800
        },
        image: '☕'
    },
    {
        id: 'E',
        name: '濾掛咖啡包',
        description: '精選咖啡豆研磨，方便攜帶的濾掛包裝，隨時享受新鮮咖啡。',
        prices: {
            '10入': 280
        },
        image: '☕'
    },
    {
        id: 'F',
        name: '精品咖啡豆',
        description: '限量精品咖啡豆，提供多種包裝規格選擇。',
        prices: {
            '120g': 450,
            '260g': 850,
            '500g': 1600
        },
        image: '☕'
    }
];

// 初始化商品資料（從 localStorage 載入，若無則使用預設）
function initializeProducts() {
    const savedProducts = localStorage.getItem('products_config');
    if (savedProducts) {
        try {
            return JSON.parse(savedProducts);
        } catch (e) {
            console.error('載入商品資料失敗，使用預設商品', e);
            localStorage.setItem('products_config', JSON.stringify(DEFAULT_PRODUCTS));
            return DEFAULT_PRODUCTS;
        }
    } else {
        // 首次使用，儲存預設商品
        localStorage.setItem('products_config', JSON.stringify(DEFAULT_PRODUCTS));
        return DEFAULT_PRODUCTS;
    }
}

// 動態載入的商品資料
let products = initializeProducts();

// 渲染產品列表
function renderProducts() {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return; // 如果不在商品頁面，直接返回

    productGrid.innerHTML = ''; // 清空現有內容

    // 重新從 localStorage 載入商品資料
    const savedProducts = localStorage.getItem('products_config');
    if (savedProducts) {
        try {
            products = JSON.parse(savedProducts);
        } catch (e) {
            console.error('載入商品資料失敗', e);
        }
    }

    // 如果沒有商品，顯示空狀態
    if (!products || products.length === 0) {
        productGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 64px; margin-bottom: 20px;">☕</div>
                <h3 style="color: #95a5a6; margin-bottom: 10px;">目前沒有商品</h3>
                <p style="color: #bdc3c7;">請聯絡管理員新增商品</p>
            </div>
        `;
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';

        // 處理圖片顯示
        let imageHTML;
        if (typeof ImageSystem !== 'undefined' && product.image) {
            const imageURL = ImageSystem.getImageURL(product.image);
            if (imageURL) {
                // 使用實際圖片
                imageHTML = `<img src="${imageURL}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">`;
            } else {
                // 使用 emoji 或文字
                imageHTML = product.image || '☕';
            }
        } else {
            // 預設使用 emoji
            imageHTML = product.image || '☕';
        }

        productCard.innerHTML = `
            <div class="product-image">${imageHTML}</div>
            <div class="product-name">${product.name}</div>
            <div class="product-description">${product.description}</div>
            <div class="product-options">
                <label>規格：</label>
                <div class="size-options">
                    <button type="button" class="size-btn active" data-size="120g" onclick="selectSize('${product.id}', '120g')">
                        120g
                    </button>
                    <button type="button" class="size-btn" data-size="260g" onclick="selectSize('${product.id}', '260g')">
                        260g
                    </button>
                </div>
            </div>
            <div class="product-price" id="price-${product.id}">
                NT$ ${product.prices['120g']}
            </div>
            <button class="add-to-cart-btn" onclick="addToCart('${product.id}', '120g')">
                加入購物車
            </button>
        `;

        productGrid.appendChild(productCard);
    });
}

// 選擇規格
function selectSize(productId, size) {
    const card = event.target.closest('.product-card');
    const buttons = card.querySelectorAll('.size-btn');
    const priceElement = card.querySelector('.product-price');
    const addButton = card.querySelector('.add-to-cart-btn');

    // 更新按鈕狀態
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.size === size) {
            btn.classList.add('active');
        }
    });

    // 更新價格顯示
    const product = products.find(p => p.id === productId);
    priceElement.textContent = `NT$ ${product.prices[size]}`;

    // 更新加入購物車按鈕的規格參數
    addButton.setAttribute('onclick', `addToCart('${productId}', '${size}')`);
}

// 頁面載入時渲染產品
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
});
