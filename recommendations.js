// 產品推薦系統

const RecommendationSystem = {
    // 取得最新的商品資料
    getCurrentProducts() {
        // 從 localStorage 重新載入商品資料
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

    // 基於購買歷史的推薦
    getRecommendationsForMember(memberId, limit = 4) {
        const currentProducts = this.getCurrentProducts();
        const orders = OrderTracking.getMemberOrders();
        if (orders.length === 0) {
            return this.getPopularProducts(limit);
        }

        // 統計購買過的產品類型
        const purchasedProducts = new Set();
        orders.forEach(order => {
            order.items.forEach(item => {
                purchasedProducts.add(item.productId);
            });
        });

        // 推薦未購買過的產品
        const recommendations = currentProducts.filter(p =>
            !purchasedProducts.has(p.id)
        );

        // 如果未購買的產品太少，補充熱門產品
        if (recommendations.length < limit) {
            return this.getPopularProducts(limit);
        }

        return recommendations.slice(0, limit);
    },

    // 取得熱門產品
    getPopularProducts(limit = 4) {
        const currentProducts = this.getCurrentProducts();

        // 基於評分和評價數量計算熱門度
        const productsWithScore = currentProducts.map(product => {
            const avgRating = parseFloat(ReviewSystem.getAverageRating(product.id)) || 0;
            const reviewCount = ReviewSystem.getProductReviews(product.id).length;

            // 計算熱門度分數：評分 × log(評價數+1)
            const popularityScore = avgRating * Math.log(reviewCount + 1);

            return {
                ...product,
                popularityScore: popularityScore
            };
        });

        // 按熱門度排序
        return productsWithScore
            .sort((a, b) => b.popularityScore - a.popularityScore)
            .slice(0, limit);
    },

    // 取得同類型產品推薦（查看產品時）
    getSimilarProducts(productId, limit = 3) {
        const currentProducts = this.getCurrentProducts();

        // 排除當前產品
        return currentProducts
            .filter(p => p.id !== productId)
            .slice(0, limit);
    },

    // 取得新品推薦
    getNewProducts(limit = 4) {
        const currentProducts = this.getCurrentProducts();

        // 這裡可以根據產品的 createdAt 字段排序
        // 目前簡單返回前幾個產品
        return currentProducts.slice(0, limit);
    },

    // 基於購物車的推薦（經常一起購買）
    getFrequentlyBoughtTogether(cartItems) {
        const currentProducts = this.getCurrentProducts();

        if (cartItems.length === 0) {
            return [];
        }

        // 分析所有訂單，找出經常一起購買的產品
        const orders = OrderTracking.getAllOrders();
        const productPairs = {};

        // 統計產品組合
        orders.forEach(order => {
            const itemIds = order.items.map(item => item.productId);

            itemIds.forEach(id1 => {
                if (!productPairs[id1]) productPairs[id1] = {};

                itemIds.forEach(id2 => {
                    if (id1 !== id2) {
                        productPairs[id1][id2] = (productPairs[id1][id2] || 0) + 1;
                    }
                });
            });
        });

        // 找出與購物車商品最常一起購買的產品
        const cartProductIds = cartItems.map(item => item.productId);
        const recommendations = new Map();

        cartProductIds.forEach(productId => {
            if (productPairs[productId]) {
                Object.entries(productPairs[productId]).forEach(([otherId, count]) => {
                    if (!cartProductIds.includes(otherId)) {
                        recommendations.set(
                            otherId,
                            (recommendations.get(otherId) || 0) + count
                        );
                    }
                });
            }
        });

        // 排序並返回
        return Array.from(recommendations.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([productId]) => currentProducts.find(p => p.id === productId))
            .filter(p => p);
    },

    // 基於評分的推薦
    getTopRatedProducts(limit = 4) {
        const currentProducts = this.getCurrentProducts();

        const productsWithRating = currentProducts.map(product => {
            const avgRating = parseFloat(ReviewSystem.getAverageRating(product.id)) || 0;
            const reviewCount = ReviewSystem.getProductReviews(product.id).length;

            return {
                ...product,
                avgRating: avgRating,
                reviewCount: reviewCount
            };
        });

        // 只推薦有評價的產品，並按評分排序
        return productsWithRating
            .filter(p => p.reviewCount > 0)
            .sort((a, b) => {
                if (b.avgRating !== a.avgRating) {
                    return b.avgRating - a.avgRating;
                }
                return b.reviewCount - a.reviewCount;
            })
            .slice(0, limit);
    },

    // 個人化推薦
    getPersonalizedRecommendations(limit = 4) {
        const member = MemberSystem.getCurrentMember();

        if (member) {
            // 會員推薦：基於購買歷史
            return this.getRecommendationsForMember(member.id, limit);
        } else {
            // 訪客推薦：熱門產品
            return this.getPopularProducts(limit);
        }
    }
};

// 渲染推薦產品
function renderRecommendations(recommendations, title = '推薦商品') {
    if (recommendations.length === 0) {
        return '';
    }

    let html = `<div class="recommendations-section"><h2>${title}</h2><div class="recommendation-grid">`;

    recommendations.forEach(product => {
        const avgRating = ReviewSystem.getAverageRating(product.id);
        const reviewCount = ReviewSystem.getProductReviews(product.id).length;

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

        html += `
            <div class="recommendation-card">
                <div class="product-image">${imageHTML}</div>
                <div class="product-name">${product.name}</div>
                ${reviewCount > 0 ? `
                    <div class="product-rating">
                        <span class="rating-stars">${renderStars(avgRating)}</span>
                        <span class="rating-number">${avgRating}</span>
                    </div>
                ` : ''}
                <div class="product-price">NT$ ${product.prices['120g']}</div>
                <button onclick="quickAddToCart('${product.id}', '120g')" class="quick-add-btn">
                    快速加入
                </button>
            </div>
        `;
    });

    html += '</div></div>';
    return html;
}

// 顯示首頁推薦
function showHomeRecommendations() {
    const container = document.getElementById('home-recommendations');
    if (!container) return;

    const personalizedRecs = RecommendationSystem.getPersonalizedRecommendations(4);
    const topRatedRecs = RecommendationSystem.getTopRatedProducts(4);

    let html = '';

    // 個人化推薦
    html += renderRecommendations(personalizedRecs, '為您推薦');

    // 高評分產品
    if (topRatedRecs.length > 0) {
        html += renderRecommendations(topRatedRecs, '高評分商品');
    }

    container.innerHTML = html;
}

// 顯示購物車推薦
function showCartRecommendations() {
    const container = document.getElementById('cart-recommendations');
    if (!container || cart.length === 0) return;

    const recommendations = RecommendationSystem.getFrequentlyBoughtTogether(cart);

    if (recommendations.length > 0) {
        container.innerHTML = renderRecommendations(recommendations, '經常一起購買');
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

// 快速加入購物車
function quickAddToCart(productId, size) {
    addToCart(productId, size);
    alert('已加入購物車！');
}

// 在產品詳情頁顯示相似產品
function showSimilarProducts(productId) {
    const container = document.getElementById('similar-products');
    if (!container) return;

    const recommendations = RecommendationSystem.getSimilarProducts(productId, 3);
    container.innerHTML = renderRecommendations(recommendations, '您可能也喜歡');
}

// 初始化推薦系統
document.addEventListener('DOMContentLoaded', () => {
    // 顯示首頁推薦
    showHomeRecommendations();
});
