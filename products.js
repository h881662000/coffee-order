// 咖啡產品資料
const products = [
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
    }
];

// 渲染產品列表
function renderProducts() {
    const productGrid = document.getElementById('product-grid');

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';

        productCard.innerHTML = `
            <div class="product-image">${product.image}</div>
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
