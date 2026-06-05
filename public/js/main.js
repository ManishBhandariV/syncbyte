/**
 * Syncbyte Innovations - Main JavaScript
 */

function bootstrapSyncbyte() {
    // Initialize all components
    initMobileMenu();
    initBackToTop();
    initSearch();
    initCustomersCarousel();
}

// In Next.js this script is injected with strategy="afterInteractive", which
// runs AFTER DOMContentLoaded — so a plain DOMContentLoaded listener would
// never fire. Check readyState and run immediately if the DOM is already
// parsed; otherwise fall through to the event for the rare cold-cache case.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapSyncbyte);
} else {
    bootstrapSyncbyte();
}

/**
 * Mobile Menu Toggle
 */
function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mainNav = document.getElementById('mainNav');

    if (mobileMenuToggle && mainNav) {
        function closeMenu() {
            mainNav.classList.remove('active');
            const icon = mobileMenuToggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }

        mobileMenuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            const icon = this.querySelector('i');
            if (mainNav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!mobileMenuToggle.contains(e.target) && !mainNav.contains(e.target)) {
                closeMenu();
            }
        });

        // Close menu after the user picks a nav link. We use THREE redundant
        // hooks because a single delegated bubble handler was found to miss
        // taps on links inside the .mega-dropdown on mobile:
        //   1. delegated click on #mainNav  (catches top-level nav items)
        //   2. delegated click in *capture* phase   (catches dropdown items
        //      even if something later in the bubble path stops propagation)
        //   3. direct listeners on each <a> as a final fallback
        function handleNavClick(e) {
            const t = e.target;
            const el = t && t.nodeType === 3 ? t.parentElement : t;
            const link = el && el.closest ? el.closest('a') : null;
            if (!link) return;
            closeMenu();
        }
        mainNav.addEventListener('click', handleNavClick);
        mainNav.addEventListener('click', handleNavClick, true);

        function attachDirectCloseHandlers() {
            mainNav.querySelectorAll('a').forEach(function(a) {
                if (a.__sbClose) return;
                a.__sbClose = true;
                a.addEventListener('click', closeMenu);
            });
        }
        attachDirectCloseHandlers();
        // Re-attach when React re-renders the nav (e.g. on route change).
        new MutationObserver(attachDirectCloseHandlers).observe(mainNav, {
            childList: true,
            subtree: true,
        });
    }
}

/**
 * Back to Top Button
 */
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');

    if (backToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });

        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

/**
 * Live Search Functionality
 */
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (!searchInput || !searchResults) return;

    let debounceTimer;

    searchInput.addEventListener('input', function() {
        const query = this.value.trim();

        clearTimeout(debounceTimer);

        if (query.length < 2) {
            searchResults.classList.remove('active');
            searchResults.innerHTML = '';
            return;
        }

        debounceTimer = setTimeout(function() {
            performSearch(query);
        }, 300);
    });

    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });

    // Show results on focus if there's content
    searchInput.addEventListener('focus', function() {
        if (searchResults.innerHTML !== '') {
            searchResults.classList.add('active');
        }
    });
}

/**
 * Perform AJAX Search
 */
function performSearch(query) {
    const searchResults = document.getElementById('searchResults');

    // Show loading state
    searchResults.innerHTML = '<div class="search-loading" style="padding: 20px; text-align: center;"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
    searchResults.classList.add('active');

    // Fetch search results
    fetch('/api/search?q=' + encodeURIComponent(query))
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                let html = '';
                data.results.forEach(function(item) {
                    html += `
                        <a href="${item.url}" class="search-result-item">
                            <img src="${item.image}" alt="${item.name}" onerror="this.onerror=null;this.src='data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><rect width="50" height="50" fill="#e2e8f0"/><text x="25" y="25" font-family="Arial" font-size="20" fill="#1a365d" text-anchor="middle" dominant-baseline="middle" font-weight="600">' + item.name.charAt(0).replace(/[<>&"']/g, '') + '</text></svg>')}'">
                            <div class="search-result-info">
                                <h4>${item.name}</h4>
                                <span>${item.category}</span>
                            </div>
                        </a>
                    `;
                });
                html += `
                    <a href="/search?q=${encodeURIComponent(query)}" class="search-result-item" style="justify-content: center; background: var(--bg-light);">
                        <span style="font-weight: 500;">View all results for "${query}"</span>
                    </a>
                `;
                searchResults.innerHTML = html;
            } else {
                searchResults.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: var(--text-light);">
                        <i class="fas fa-search" style="font-size: 1.5rem; margin-bottom: 10px; display: block;"></i>
                        No products found for "${query}"
                    </div>
                `;
            }
        })
        .catch(function() {
            searchResults.innerHTML = `
                <div style="padding: 20px; text-align: center; color: var(--text-light);">
                    Error performing search. Please try again.
                </div>
            `;
        });
}

/**
 * Customers Logo Carousel Animation
 * Speed: Logos move from right to left with 3 second interval per logo
 */
function initCustomersCarousel() {
    const track = document.querySelector('.customers-track');
    if (!track) return;

    // Calculate animation duration based on number of logos.
    // 2.1s per logo = 30% faster than the original 3s.
    const logos = track.querySelectorAll('.customer-logo');
    const logoCount = logos.length / 2; // Divided by 2 because logos are duplicated
    const duration = logoCount * 2.1;

    track.style.animationDuration = duration + 's';

    // Pause animation on hover
    track.addEventListener('mouseenter', function() {
        this.style.animationPlayState = 'paused';
    });

    track.addEventListener('mouseleave', function() {
        this.style.animationPlayState = 'running';
    });
}

/**
 * Smooth Scroll for Anchor Links
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

/**
 * Form Validation Helper
 */
function validateForm(formElement) {
    const inputs = formElement.querySelectorAll('input[required], textarea[required]');
    let isValid = true;

    inputs.forEach(function(input) {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('error');
        } else {
            input.classList.remove('error');
        }
    });

    return isValid;
}

/**
 * Lazy Loading for Images
 */
function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img[data-src]');

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(function(img) {
            imageObserver.observe(img);
        });
    } else {
        // Fallback for browsers without IntersectionObserver
        lazyImages.forEach(function(img) {
            img.src = img.dataset.src;
        });
    }
}

/**
 * Handle Form Submissions with AJAX (optional enhancement)
 */
function handleFormSubmit(formElement, successCallback) {
    formElement.addEventListener('submit', function(e) {
        if (!validateForm(this)) {
            e.preventDefault();
            return;
        }

        // Add loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        }
    });
}

/**
 * Animate Numbers on Scroll
 */
function animateNumbers() {
    const numbers = document.querySelectorAll('[data-count]');

    numbers.forEach(function(number) {
        const target = parseInt(number.dataset.count);
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const timer = setInterval(function() {
            current += step;
            if (current >= target) {
                number.textContent = target;
                clearInterval(timer);
            } else {
                number.textContent = Math.floor(current);
            }
        }, 16);
    });
}

/**
 * Header Scroll Effect
 */
let lastScrollTop = 0;
const header = document.querySelector('.main-header');

window.addEventListener('scroll', function() {
    if (!header) return;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    lastScrollTop = scrollTop;
});

/**
 * Print Product Page
 */
function printProduct() {
    window.print();
}

/**
 * Share via Web Share API
 */
function shareProduct(title, url) {
    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        }).catch(console.error);
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(url).then(function() {
            alert('Link copied to clipboard!');
        });
    }
}

/**
 * Cookie Consent (Optional)
 */
function initCookieConsent() {
    const consentBanner = document.getElementById('cookieConsent');
    const acceptBtn = document.getElementById('acceptCookies');

    if (!consentBanner || !acceptBtn) return;

    if (!localStorage.getItem('cookiesAccepted')) {
        consentBanner.style.display = 'block';
    }

    acceptBtn.addEventListener('click', function() {
        localStorage.setItem('cookiesAccepted', 'true');
        consentBanner.style.display = 'none';
    });
}

/**
 * Testimonial/Review Slider
 */
function initReviewSlider() {
    const slider = document.querySelector('.reviews-slider');
    if (!slider) return;

    let currentSlide = 0;
    const slides = slider.querySelectorAll('.review-slide');
    const totalSlides = slides.length;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.style.display = i === index ? 'block' : 'none';
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    }

    // Auto advance every 5 seconds
    setInterval(nextSlide, 5000);
    showSlide(0);
}

/**
 * Initialize Contact Form Map
 */
function initMap() {
    // Google Maps initialization if needed
    // This can be customized based on requirements
}

/**
 * Product Image Zoom
 */
function initImageZoom() {
    const productImage = document.querySelector('.main-image img');
    if (!productImage) return;

    productImage.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * 100;
        const y = (e.clientY - rect.top) / rect.height * 100;
        this.style.transformOrigin = `${x}% ${y}%`;
        this.style.transform = 'scale(1.5)';
    });

    productImage.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
}

/**
 * Utility: Debounce Function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Utility: Throttle Function
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
