// 評價系統

// 評價資料結構
class Review {
    constructor(data) {
        this.id = data.id || Date.now().toString() + Math.random();
        this.productId = data.productId;
        this.memberId = data.memberId;
        this.memberName = data.memberName;
        this.rating = data.rating; // 1-5 星
        this.comment = data.comment;
        this.timestamp = data.timestamp || new Date().toISOString();
        this.verified = data.verified || false; // 是否為購買後評價
        this.helpful = data.helpful || 0; // 有幫助的數量
        this.images = data.images || []; // 評價圖片
    }
}

// 評價管理系統
const ReviewSystem = {
    // 取得所有評價
    getAllReviews() {
        const data = localStorage.getItem('reviews');
        return data ? JSON.parse(data).map(r => new Review(r)) : [];
    },

    // 儲存評價
    saveReviews(reviews) {
        localStorage.setItem('reviews', JSON.stringify(reviews));
    },

    // 取得產品的評價
    getProductReviews(productId) {
        const reviews = this.getAllReviews();
        return reviews.filter(r => r.productId === productId)
                     .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    // 新增評價
    addReview(reviewData) {
        const member = MemberSystem.getCurrentMember();
        if (!member) {
            return { success: false, message: '請先登入會員' };
        }

        // 檢查是否已評價過此產品
        const existing = this.getProductReviews(reviewData.productId)
                            .find(r => r.memberId === member.id);

        if (existing) {
            return { success: false, message: '您已評價過此產品' };
        }

        const review = new Review({
            ...reviewData,
            memberId: member.id,
            memberName: member.name,
            verified: this.hasOrderedProduct(member.id, reviewData.productId)
        });

        const reviews = this.getAllReviews();
        reviews.push(review);
        this.saveReviews(reviews);

        // 如果是驗證購買評價，給予獎勵點數
        if (review.verified) {
            MemberSystem.updateMember(member.id, {
                points: member.points + 10
            });
        }

        return { success: true, review: review };
    },

    // 檢查會員是否購買過此產品
    hasOrderedProduct(memberId, productId) {
        const orders = OrderTracking.getMemberOrders();
        return orders.some(order =>
            order.items.some(item => item.productId === productId)
        );
    },

    // 計算產品平均評分
    getAverageRating(productId) {
        const reviews = this.getProductReviews(productId);
        if (reviews.length === 0) return 0;

        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return (sum / reviews.length).toFixed(1);
    },

    // 取得評分分布
    getRatingDistribution(productId) {
        const reviews = this.getProductReviews(productId);
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

        reviews.forEach(r => {
            distribution[r.rating]++;
        });

        return distribution;
    },

    // 標記評價為有幫助
    markHelpful(reviewId) {
        const reviews = this.getAllReviews();
        const index = reviews.findIndex(r => r.id === reviewId);

        if (index !== -1) {
            reviews[index].helpful++;
            this.saveReviews(reviews);
            return true;
        }
        return false;
    },

    // 取得會員的評價
    getMemberReviews(memberId) {
        const reviews = this.getAllReviews();
        return reviews.filter(r => r.memberId === memberId);
    }
};

// 渲染產品評價
function renderProductReviews(productId) {
    const reviews = ReviewSystem.getProductReviews(productId);
    const avgRating = ReviewSystem.getAverageRating(productId);
    const distribution = ReviewSystem.getRatingDistribution(productId);

    let html = '<div class="reviews-section">';

    // 評分總覽
    html += `
        <div class="reviews-summary">
            <div class="average-rating">
                <div class="rating-number">${avgRating}</div>
                <div class="rating-stars">${renderStars(avgRating)}</div>
                <div class="rating-count">共 ${reviews.length} 則評價</div>
            </div>
            <div class="rating-distribution">
                ${[5, 4, 3, 2, 1].map(star => {
                    const count = distribution[star];
                    const percentage = reviews.length > 0 ? (count / reviews.length * 100) : 0;
                    return `
                        <div class="distribution-bar">
                            <span class="star-label">${star} 星</span>
                            <div class="bar">
                                <div class="bar-fill" style="width: ${percentage}%"></div>
                            </div>
                            <span class="star-count">${count}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    // 評價列表
    html += '<div class="reviews-list">';

    if (reviews.length === 0) {
        html += '<p class="no-reviews">目前還沒有評價，成為第一個評價的人吧！</p>';
    } else {
        reviews.forEach(review => {
            html += `
                <div class="review-card">
                    <div class="review-header">
                        <div class="reviewer-info">
                            <span class="reviewer-name">${review.memberName}</span>
                            ${review.verified ? '<span class="verified-badge">✓ 已購買</span>' : ''}
                        </div>
                        <div class="review-rating">${renderStars(review.rating)}</div>
                    </div>
                    <div class="review-date">${new Date(review.timestamp).toLocaleDateString('zh-TW')}</div>
                    <div class="review-comment">${review.comment}</div>
                    <div class="review-footer">
                        <button onclick="markReviewHelpful('${review.id}')" class="helpful-btn">
                            👍 有幫助 (${review.helpful})
                        </button>
                    </div>
                </div>
            `;
        });
    }

    html += '</div>';

    // 新增評價按鈕
    html += `
        <button onclick="showAddReviewModal('${productId}')" class="add-review-btn">
            撰寫評價
        </button>
    `;

    html += '</div>';

    return html;
}

// 渲染星星
function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    let html = '';
    for (let i = 0; i < fullStars; i++) html += '★';
    if (halfStar) html += '☆';
    for (let i = 0; i < emptyStars; i++) html += '☆';

    return html;
}

// 顯示新增評價視窗
function showAddReviewModal(productId) {
    const member = MemberSystem.getCurrentMember();
    if (!member) {
        alert('請先登入會員才能評價');
        showLoginModal();
        return;
    }

    const modal = document.getElementById('add-review-modal');
    if (!modal) return;

    document.getElementById('review-product-id').value = productId;
    document.getElementById('review-rating').value = 5;
    updateRatingStars(5);

    modal.classList.add('active');
}

// 關閉新增評價視窗
function closeAddReviewModal() {
    const modal = document.getElementById('add-review-modal');
    if (modal) {
        modal.classList.remove('active');
        document.getElementById('add-review-form').reset();
    }
}

// 更新評分星星顯示
function updateRatingStars(rating) {
    const display = document.getElementById('rating-display');
    if (display) {
        display.textContent = renderStars(rating);
    }
}

// 提交評價
function submitReview(event) {
    event.preventDefault();

    const productId = document.getElementById('review-product-id').value;
    const rating = parseInt(document.getElementById('review-rating').value);
    const comment = document.getElementById('review-comment').value;

    const result = ReviewSystem.addReview({
        productId: productId,
        rating: rating,
        comment: comment
    });

    if (result.success) {
        alert(result.review.verified ?
            '評價已送出！感謝您的評價，已獲得 10 點獎勵！' :
            '評價已送出！感謝您的評價！'
        );
        closeAddReviewModal();
        // 重新載入評價列表
        if (typeof loadProductReviews === 'function') {
            loadProductReviews(productId);
        }
    } else {
        alert(result.message);
    }
}

// 標記評價有幫助
function markReviewHelpful(reviewId) {
    if (ReviewSystem.markHelpful(reviewId)) {
        // 重新渲染評價
        location.reload(); // 簡單的重新載入方式
    }
}

// 在產品卡片上顯示評分
function updateProductRatings() {
    products.forEach(product => {
        const avgRating = ReviewSystem.getAverageRating(product.id);
        const reviewCount = ReviewSystem.getProductReviews(product.id).length;

        const ratingElement = document.querySelector(`[data-product="${product.id}"] .product-rating`);
        if (ratingElement && reviewCount > 0) {
            ratingElement.innerHTML = `
                <span class="rating-stars">${renderStars(avgRating)}</span>
                <span class="rating-number">${avgRating}</span>
                <span class="review-count">(${reviewCount})</span>
            `;
        }
    });
}
