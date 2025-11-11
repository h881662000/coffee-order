// 商品篩選系統

const ProductFilter = {
    // 篩選條件
    filters: {
        roast: 'all',       // 烘焙度
        origin: 'all',      // 產地
        flavor: 'all',      // 風味
        priceMin: 0,        // 最低價格
        priceMax: 99999,    // 最高價格
        searchTerm: ''      // 搜尋關鍵字
    },

    // 初始化篩選器
    init() {
        this.renderFilters();
        this.attachEventListeners();
    },

    // 渲染篩選器 UI
    renderFilters() {
        const filterContainer = document.getElementById('product-filters');
        if (!filterContainer) return;

        const currentProducts = this.getProducts();

        // 取得所有唯一的烘焙度、產地、風味
        const roasts = this.getUniqueValues(currentProducts, 'roast');
        const origins = this.getUniqueValues(currentProducts, 'origin');
        const flavors = this.getAllFlavors(currentProducts);

        filterContainer.innerHTML = `
            <div class="filter-section">
                <h3>搜尋商品</h3>
                <input type="text" id="search-products" class="filter-search"
                       placeholder="搜尋商品名稱或描述..." value="${this.filters.searchTerm}">
            </div>

            <div class="filter-section">
                <h3>烘焙度</h3>
                <select id="filter-roast" class="filter-select">
                    <option value="all">全部</option>
                    ${roasts.map(roast => `
                        <option value="${roast}" ${this.filters.roast === roast ? 'selected' : ''}>
                            ${roast}
                        </option>
                    `).join('')}
                </select>
            </div>

            <div class="filter-section">
                <h3>產地</h3>
                <select id="filter-origin" class="filter-select">
                    <option value="all">全部</option>
                    ${origins.map(origin => `
                        <option value="${origin}" ${this.filters.origin === origin ? 'selected' : ''}>
                            ${origin}
                        </option>
                    `).join('')}
                </select>
            </div>

            <div class="filter-section">
                <h3>風味</h3>
                <select id="filter-flavor" class="filter-select">
                    <option value="all">全部</option>
                    ${flavors.map(flavor => `
                        <option value="${flavor}" ${this.filters.flavor === flavor ? 'selected' : ''}>
                            ${flavor}
                        </option>
                    `).join('')}
                </select>
            </div>

            <div class="filter-section">
                <h3>價格範圍 (120g)</h3>
                <div class="price-range-inputs">
                    <input type="number" id="filter-price-min" class="filter-input"
                           placeholder="最低" min="0" value="${this.filters.priceMin || ''}">
                    <span>~</span>
                    <input type="number" id="filter-price-max" class="filter-input"
                           placeholder="最高" min="0" value="${this.filters.priceMax === 99999 ? '' : this.filters.priceMax}">
                </div>
            </div>

            <div class="filter-actions">
                <button onclick="ProductFilter.applyFilters()" class="apply-filter-btn">套用篩選</button>
                <button onclick="ProductFilter.resetFilters()" class="reset-filter-btn">重置</button>
            </div>
        `;
    },

    // 綁定事件監聽
    attachEventListeners() {
        // 搜尋框即時篩選
        const searchInput = document.getElementById('search-products');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.searchTerm = e.target.value;
                this.applyFilters();
            });
        }
    },

    // 獲取唯一值
    getUniqueValues(products, field) {
        const values = products
            .map(p => p[field])
            .filter(v => v && v.trim() !== '');
        return [...new Set(values)].sort();
    },

    // 獲取所有風味
    getAllFlavors(products) {
        const allFlavors = [];
        products.forEach(product => {
            if (product.flavor) {
                const flavors = product.flavor.split(',').map(f => f.trim());
                allFlavors.push(...flavors);
            }
        });
        return [...new Set(allFlavors)].sort();
    },

    // 取得商品列表
    getProducts() {
        const savedProducts = localStorage.getItem('products_config');
        if (savedProducts) {
            try {
                return JSON.parse(savedProducts);
            } catch (e) {
                console.error('載入商品資料失敗', e);
            }
        }
        return typeof products !== 'undefined' ? products : [];
    },

    // 套用篩選
    applyFilters() {
        // 讀取篩選條件
        const roastSelect = document.getElementById('filter-roast');
        const originSelect = document.getElementById('filter-origin');
        const flavorSelect = document.getElementById('filter-flavor');
        const priceMinInput = document.getElementById('filter-price-min');
        const priceMaxInput = document.getElementById('filter-price-max');

        if (roastSelect) this.filters.roast = roastSelect.value;
        if (originSelect) this.filters.origin = originSelect.value;
        if (flavorSelect) this.filters.flavor = flavorSelect.value;
        if (priceMinInput) this.filters.priceMin = parseInt(priceMinInput.value) || 0;
        if (priceMaxInput) this.filters.priceMax = parseInt(priceMaxInput.value) || 99999;

        // 篩選商品
        const allProducts = this.getProducts();
        const filtered = allProducts.filter(product => this.matchesFilters(product));

        // 重新渲染商品列表
        this.renderFilteredProducts(filtered);

        // 更新顯示的商品數量
        this.updateResultCount(filtered.length, allProducts.length);
    },

    // 檢查商品是否符合篩選條件
    matchesFilters(product) {
        // 烘焙度篩選
        if (this.filters.roast !== 'all' && product.roast !== this.filters.roast) {
            return false;
        }

        // 產地篩選
        if (this.filters.origin !== 'all' && product.origin !== this.filters.origin) {
            return false;
        }

        // 風味篩選
        if (this.filters.flavor !== 'all') {
            const productFlavors = product.flavor ? product.flavor.split(',').map(f => f.trim()) : [];
            if (!productFlavors.includes(this.filters.flavor)) {
                return false;
            }
        }

        // 價格篩選（使用 120g 價格）
        const price = product.prices['120g'];
        if (price < this.filters.priceMin || price > this.filters.priceMax) {
            return false;
        }

        // 搜尋關鍵字
        if (this.filters.searchTerm) {
            const term = this.filters.searchTerm.toLowerCase();
            const searchableText = `${product.name} ${product.description || ''} ${product.origin || ''} ${product.flavor || ''}`.toLowerCase();
            if (!searchableText.includes(term)) {
                return false;
            }
        }

        return true;
    },

    // 渲染篩選後的商品
    renderFilteredProducts(filteredProducts) {
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        if (filteredProducts.length === 0) {
            grid.innerHTML = `
                <div class="no-products">
                    <p>😔 找不到符合條件的商品</p>
                    <button onclick="ProductFilter.resetFilters()" class="reset-filter-btn">重置篩選條件</button>
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredProducts.map(product => this.createProductCard(product)).join('');
    },

    // 創建商品卡片
    createProductCard(product) {
        const imageHtml = (typeof ImageSystem !== 'undefined' && ImageSystem.renderProductImage)
            ? ImageSystem.renderProductImage(product)
            : (product.image || '☕');

        // 生成價格選項（支援 1 種以上的彈性規格）
        const priceOptions = Object.entries(product.prices || {}).map(([size, price], index) => `
            <div class="price-option ${index === 0 ? 'selected' : ''}"
                 onclick="selectProductSize('${product.id}', '${size}', ${price})"
                 data-size="${size}">
                <span class="weight">${size}</span>
                <span class="price">NT$ ${price}</span>
            </div>
        `).join('');

        // 獲取第一個規格作為預設值
        const firstSize = Object.keys(product.prices || {})[0] || '';

        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    ${imageHtml}
                </div>
                <h3>${product.name}</h3>
                ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
                ${product.origin ? `<p class="product-origin">產地：${product.origin}</p>` : ''}
                ${product.roast ? `<p class="product-roast">烘焙度：${product.roast}</p>` : ''}
                ${product.flavor ? `<p class="product-flavor">風味：${product.flavor}</p>` : ''}

                <div class="product-prices" id="prices-${product.id}">
                    ${priceOptions}
                </div>

                <button onclick="addToCartFromCard('${product.id}')" class="add-to-cart-btn">
                    加入購物車
                </button>
            </div>
        `;
    },

    // 更新結果數量顯示
    updateResultCount(filtered, total) {
        const countElement = document.getElementById('product-count');
        if (countElement) {
            countElement.textContent = `顯示 ${filtered} / ${total} 項商品`;
        }
    },

    // 重置篩選條件
    resetFilters() {
        this.filters = {
            roast: 'all',
            origin: 'all',
            flavor: 'all',
            priceMin: 0,
            priceMax: 99999,
            searchTerm: ''
        };

        this.renderFilters();
        this.applyFilters();
    }
};

// 選擇商品規格（點擊價格區塊）
window.selectProductSize = function(productId, size, price) {
    // 移除該商品所有規格的選中狀態
    const pricesContainer = document.getElementById(`prices-${productId}`);
    if (pricesContainer) {
        const allOptions = pricesContainer.querySelectorAll('.price-option');
        allOptions.forEach(option => option.classList.remove('selected'));

        // 添加選中狀態到點擊的規格
        const selectedOption = pricesContainer.querySelector(`[data-size="${size}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
    }
};

// 從商品卡片添加到購物車
window.addToCartFromCard = function(productId) {
    // 獲取選中的規格
    const pricesContainer = document.getElementById(`prices-${productId}`);
    if (!pricesContainer) return;

    const selectedOption = pricesContainer.querySelector('.price-option.selected');
    if (!selectedOption) {
        alert('請選擇規格');
        return;
    }

    const size = selectedOption.getAttribute('data-size');

    // 呼叫原本的 addToCart 函數
    if (typeof addToCart === 'function') {
        addToCart(productId, size);
    } else {
        console.error('addToCart function not found');
    }
};

// 頁面載入時初始化（僅在商品頁面）
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('product-filters')) {
        ProductFilter.init();
        ProductFilter.applyFilters();
    }
});
