// Initialize AOS
AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true,
    offset: 100
});

// Navbar Scroll Effect
window.addEventListener('scroll', function() {
    const header = document.getElementById('mainHeader');
    const scrollToTop = document.getElementById('scrollToTop');
    
    if (window.scrollY > 50) {
        header.classList.add('scrolled', 'shadow-sm');
        scrollToTop.classList.add('show');
    } else {
        header.classList.remove('scrolled', 'shadow-sm');
        scrollToTop.classList.remove('show');
    }

    // Parallax Effect for Offers Section
    const parallaxSection = document.querySelector('.parallax-offers');
    const parallaxBg = document.querySelector('.parallax-bg');
    if (parallaxSection && parallaxBg) {
        const rect = parallaxSection.getBoundingClientRect();
        const speed = 0.3; // Parallax speed
        
        // If section is in viewport
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            const yPos = (window.innerHeight - rect.top) * speed;
            parallaxBg.style.transform = `translateY(-${yPos}px)`;
        }
    }
});

// Scroll to Top Functionality
document.getElementById('scrollToTop').addEventListener('click', function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Initialize Swiper for Categories
const categorySwiper = new Swiper('.categorySwiper', {
    slidesPerView: 1,
    spaceBetween: 20,
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },
    breakpoints: {
        640: {
            slidesPerView: 2,
            spaceBetween: 20,
        },
        768: {
            slidesPerView: 3,
            spaceBetween: 30,
        },
        1024: {
            slidesPerView: 4,
            spaceBetween: 30,
        },
    },
    autoplay: {
        delay: 3000,
        disableOnInteraction: false,
    }
});

// Initialize Swiper for Reviews
const reviewSwiper = new Swiper('.reviewSwiper', {
    slidesPerView: 1,
    spaceBetween: 20,
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },
    breakpoints: {
        768: {
            slidesPerView: 2,
            spaceBetween: 30,
        },
        1024: {
            slidesPerView: 3,
            spaceBetween: 30,
        },
    },
    autoplay: {
        delay: 5000,
        disableOnInteraction: false,
    }
});

// Form Submission Handling (Mock)
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Thank you for your enquiry! Our team will get back to you shortly.');
        contactForm.reset();
    });
}
