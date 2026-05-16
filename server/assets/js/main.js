document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            mirror: false
        });
    }

    // Load dynamic categories on homepage
    loadHomeCategories();

    // Initialize Swiper for Reviews
    if (document.querySelector('.reviewSwiper')) {
        new Swiper('.reviewSwiper', {
            slidesPerView: 1,
            spaceBetween: 30,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            breakpoints: {
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
            }
        });
    }

    // Update Header Cart Count globally
    updateGlobalCartCount();
});

// Color palette for category cards
const catColors = [
    { bg: '#fff3e6', text: '#ff6b35', border: '#ff6b35' },
    { bg: '#fff8e1', text: '#f9a825', border: '#f9a825' },
    { bg: '#e3f2fd', text: '#1976d2', border: '#1976d2' },
    { bg: '#f3e5f5', text: '#8e24aa', border: '#8e24aa' },
    { bg: '#fce4ec', text: '#e53935', border: '#e53935' },
    { bg: '#e8f5e9', text: '#43a047', border: '#43a047' },
    { bg: '#e0f7fa', text: '#00897b', border: '#00897b' },
    { bg: '#eceff1', text: '#546e7a', border: '#546e7a' },
];

async function loadHomeCategories() {
    const grid = document.getElementById('homeCategoryGrid');
    if (!grid) return;

    let categories = [];
    const data = await apiFetchData();
    if (data && data.categories) {
        categories = data.categories;
    }

    grid.innerHTML = '';
    categories.forEach((cat, i) => {
        const color = catColors[i % catColors.length];
        const imgSrc = safeMediaSrc(cat.image);
        const link = cat.link || 'shop.html';

        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `
            <a href="${link}" class="text-decoration-none d-flex h-100">
                <div class="category-card category-card-fill rounded-5 shadow-sm h-100"
                     style="background:#fff; border:2px solid transparent; transition: all 0.3s; cursor:pointer;"
                     onmouseenter="this.style.borderColor='${color.border}'; this.style.transform='translateY(-8px)'; this.style.boxShadow='0 15px 35px rgba(0,0,0,0.1)'"
                     onmouseleave="this.style.borderColor='transparent'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'">
                    <div class="category-card-fill__media">
                        <img src="${imgSrc}" alt="${cat.name}"
                            onerror="this.src='assets/img/Kaviya_crackers_logo.jpeg'">
                    </div>
                    <div class="category-card-fill__body" style="background:${color.bg};">
                        <h5 class="fw-bold mb-0" style="color:${color.text};">${cat.name}</h5>
                        <span class="small fw-bold" style="color:${color.text};">View Collection <i class="bi bi-arrow-right"></i></span>
                    </div>
                </div>
            </a>
        `;
        grid.appendChild(slide);
    });

    // Initialize Swiper after slides are added
    new Swiper('.categorySwiper', {
        slidesPerView: 1.3,
        spaceBetween: 20,
        grabCursor: true,
        navigation: {
            nextEl: '.cat-next',
            prevEl: '.cat-prev',
        },
        breakpoints: {
            480: { slidesPerView: 2.2 },
            768: { slidesPerView: 3.2 },
            1024: { slidesPerView: 4.2 },
        }
    });
}

function updateGlobalCartCount() {
    const cart = JSON.parse(localStorage.getItem('Kaviya_cart') || '{}');
    let itemCount = 0;
    for (const id in cart) {
        itemCount += parseInt(cart[id]) || 0;
    }

    const headerCount = document.getElementById('headerCartCount');
    if (headerCount) {
        headerCount.innerText = itemCount;
        headerCount.style.display = itemCount > 0 ? 'inline-block' : 'none';
    }
}

// Export for use in other scripts
window.updateGlobalCartCount = updateGlobalCartCount;
