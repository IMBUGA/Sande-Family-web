/* Preloader */
window.addEventListener('load', function() {
    const preloader = document.getElementById('preloader');
    setTimeout(() => {
        preloader.classList.add('hidden');
    }, 1000);
});

/* Theme Toggle with Local Storage */
const themeToggle = document.querySelector('.theme-toggle');
const body = document.body;

if (themeToggle) {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.classList.add(savedTheme);
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark');
        const currentTheme = body.classList.contains('dark') ? 'dark' : '';
        localStorage.setItem('theme', currentTheme);
    });
}

/* Scroll Animations */
const sections = document.querySelectorAll('section');

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

sections.forEach(section => {
    observer.observe(section);
});

/* Authentication Functionality */
const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');
const resetForm = document.getElementById('reset-form');
const resetConfirmForm = document.getElementById('reset-confirm-form');
const notificationContainer = document.getElementById('notification-container');

if (signinForm && signupForm && resetForm && resetConfirmForm) {
    // Tab Switching
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const forgotPasswordLink = document.querySelector('.forgot-password');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.add('active');
        });
    });

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            document.querySelector('[data-tab="reset"]').classList.add('active');
            document.getElementById('reset').classList.add('active');
        });
    }

    // Sign Up
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(signupForm);
        const data = Object.fromEntries(formData);

        if (data.password !== data['confirm-password']) {
            showNotification('Passwords do not match!', 'error');
            return;
        }

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    password: data.password
                }),
                credentials: 'include'
            });
            const result = await response.json();
            if (result.success) {
                showNotification('Sign up successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                showNotification(result.error || 'Sign up failed!', 'error');
            }
        } catch (error) {
            showNotification('An error occurred. Please try again.', 'error');
            console.error('Sign up error:', error);
        }
    });

    // Sign In
    signinForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(signinForm);
        const data = Object.fromEntries(formData);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password
                }),
                credentials: 'include'
            });
            const result = await response.json();
            if (result.success) {
                showNotification('Sign in successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                showNotification(result.error || 'Invalid email or password!', 'error');
            }
        } catch (error) {
            showNotification('An error occurred. Please try again.', 'error');
            console.error('Sign in error:', error);
        }
    });

    // Password Reset Request
    resetForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(resetForm);
        const data = Object.fromEntries(formData);

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.email })
            });
            const result = await response.json();
            if (result.success) {
                showNotification('Password reset token generated. Please check your email.', 'success');
                // For demo, show the reset confirm form and set the token
                resetForm.style.display = 'none';
                resetConfirmForm.style.display = 'block';
                resetConfirmForm.querySelector('input[name="token"]').value = result.token;
            } else {
                showNotification(result.error || 'Failed to request password reset.', 'error');
            }
        } catch (error) {
            showNotification('An error occurred. Please try again.', 'error');
            console.error('Reset request error:', error);
        }
    });

    // Password Reset Confirmation
    resetConfirmForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(resetConfirmForm);
        const data = Object.fromEntries(formData);

        if (data.newPassword !== data['confirm-newPassword']) {
            showNotification('Passwords do not match!', 'error');
            return;
        }

        try {
            const response = await fetch('/api/reset-password/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: data.token,
                    newPassword: data.newPassword
                })
            });
            const result = await response.json();
            if (result.success) {
                showNotification('Password reset successfully! Redirecting to sign in...', 'success');
                setTimeout(() => {
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    tabContents.forEach(content => content.classList.remove('active'));
                    document.querySelector('[data-tab="signin"]').classList.add('active');
                    document.getElementById('signin').classList.add('active');
                    resetForm.style.display = 'block';
                    resetConfirmForm.style.display = 'none';
                    resetConfirmForm.reset();
                }, 2000);
            } else {
                showNotification(result.error || 'Failed to reset password.', 'error');
            }
        } catch (error) {
            showNotification('An error occurred. Please try again.', 'error');
            console.error('Reset confirm error:', error);
        }
    });
}

/* Protect Routes */
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check', {
            credentials: 'include'
        });
        const data = await response.json();
        if (!data.success && window.location.pathname !== '/auth') {
            window.location.href = '/auth';
        }
    } catch (error) {
        console.error('Auth check error:', error);
        if (window.location.pathname !== '/auth') {
            window.location.href = '/auth';
        }
    }
}

// Run auth check on page load
document.addEventListener('DOMContentLoaded', checkAuth);

/* Sign Out */
document.querySelectorAll('a[href="#signout"]').forEach(link => {
    link.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            const result = await response.json();
            if (result.success) {
                showNotification('Signed out successfully!', 'success');
                setTimeout(() => {
                    window.location.href = '/auth';
                }, 2000);
            } else {
                showNotification('Logout failed!', 'error');
            }
        } catch (error) {
            showNotification('An error occurred. Please try again.', 'error');
            console.error('Logout error:', error);
        }
    });
});

/* Search Functionality */
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

const searchData = [
    { name: 'Chesang', type: 'Family Member', section: 'family-members' },
    { name: 'Martin', type: 'Family Member', section: 'family-members' },
    { name: 'Sophy', type: 'Family Member', section: 'family-members' },
    { name: 'Rodgers', type: 'Family Member', section: 'family-members' },
    { name: 'Kevin', type: 'Family Member', section: 'family-members' },
    { name: 'Philip', type: 'Family Member', section: 'family-members' },
    { name: 'Chedy', type: 'Family Member', section: 'family-members' },
    { name: 'Daniel', type: 'Family Member', section: 'family-members' },
    { name: 'Family Reunion', type: 'Event', section: 'events' },
    { name: 'Graduation', type: 'Event', section: 'events' },
    { name: 'Cultural Celebration', type: 'Event', section: 'events' },
    { name: 'Family Gallery', type: 'Section', section: 'gallery' },
    { name: 'Family Tree', type: 'Section', section: 'family-tree' },
    { name: 'Family Quotes', type: 'Section', section: 'quotes' }
];

if (searchInput && searchResults) {
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        searchResults.innerHTML = '';
        
        if (query.length > 1) {
            const results = searchData.filter(item => 
                item.name.toLowerCase().includes(query)
            );
            
            if (results.length > 0) {
                searchResults.classList.add('active');
                results.forEach(result => {
                    const div = document.createElement('div');
                    div.textContent = `${result.name} (${result.type})`;
                    div.addEventListener('click', () => {
                        document.getElementById(result.section).scrollIntoView({ behavior: 'smooth' });
                        searchResults.classList.remove('active');
                        searchInput.value = '';
                    });
                    searchResults.appendChild(div);
                });
            } else {
                searchResults.classList.remove('active');
            }
        } else {
            searchResults.classList.remove('active');
        }
    });

    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
}

/* Countdown Timer - Updated for November 8th, 2025 */
function updateCountdown() {
    const targetDate = new Date('Nov 8, 2025 00:00:00').getTime();
    const now = new Date().getTime();
    const distance = targetDate - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (document.getElementById('days')) {
        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }
}

setInterval(updateCountdown, 1000);
updateCountdown();

/* Testimonial Slider */
let currentSlide = 0;
const slides = document.querySelectorAll('.testimonial-slide');
const dots = document.querySelectorAll('.testimonial-dot');

function showSlide(n) {
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    currentSlide = (n + slides.length) % slides.length;
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

if (dots.length > 0) {
    dots.forEach(dot => {
        dot.addEventListener('click', function() {
            showSlide(parseInt(this.getAttribute('data-slide')));
        });
    });

    // Auto-advance testimonials
    setInterval(() => {
        showSlide(currentSlide + 1);
    }, 5000);
}

/* Contact Form Submission with Formspree */
const contactForm = document.getElementById('contact-form');
const submitBtn = document.getElementById('submit-btn');

if (contactForm && submitBtn) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        submitBtn.classList.add('sending');
        submitBtn.textContent = '';
        
        const formData = new FormData(contactForm);
        
        fetch(contactForm.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                showNotification('Message sent successfully!', 'success');
                contactForm.reset();
            } else {
                throw new Error('Form submission failed');
            }
        })
        .catch(error => {
            showNotification('Failed to send message. Please try again.', 'error');
            console.error('Error:', error);
        })
        .finally(() => {
            submitBtn.classList.remove('sending');
            submitBtn.textContent = 'Send Message';
        });
    });
}

/* Function to show notification */
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.setAttribute('aria-live', 'polite');
    
    notificationContainer.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 400);
    }, 5000);
}

/* Back to Top Button */
const backToTop = document.getElementById('back-to-top');

if (backToTop) {
    window.addEventListener('scroll', () => {
        backToTop.style.display = window.scrollY > 200 ? 'block' : 'none';
    });
    
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* Mobile Menu Toggle */
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('nav ul');

if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    document.querySelectorAll('nav ul li a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
}

/* Gallery Data */
const galleryData = [
    {
        name: "Mum",
        whatsapp: "https://wa.me/0703288502",
        instagram: "https://www.instagram.com/stellasande619",
        media: [
            { type: "image", src: "images/j.jpeg", caption: "Mum in the 1900s" },
            { type: "image", src: "images/n.jpeg", caption: "Another Memory!" },
            { type: "image", src: "images/group 1.jpeg", caption: "August 2025" },
            { type: "image", src: "images/mum.jpg", caption: "Ahaa!" }
        ]
    },
    {
        name: "Group Photo",
        whatsapp: "https://wa.me/0797971425",
        instagram: "https://www.instagram.com/_dan_marc_",
        media: [
            { type: "image", src: "images/group 7.jpeg", caption: "September 2025" },
            { type: "image", src: "images/jj.jpeg", caption: "Road Trip!" },
            { type: "image", src: "images/group 3.jpeg", caption: "Family Time" },
            { type: "image", src: "images/ff.jpeg", caption: "Road trip" }
        ]
    },
    {
        name: "Chesang",
        whatsapp: "https://wa.me/0725217499",
        instagram: "https://www.instagram.com/zennahsande",
        media: [
            { type: "image", src: "images/CHESANG.jpg", caption: "With Kids!" },
            { type: "image", src: "images/o.jpeg", caption: "1900s!" },
            { type: "image", src: "images/rein.jpg", caption: "Outside!" },
            { type: "image", src: "images/reyzer 1.jpg", caption: "Reyzer" }
        ]
    },
    {
        name: "Martin",
        whatsapp: "https://wa.me/0797971425",
        instagram: "https://instagram.com/sn-metit",
        media: [
            { type: "image", src: "images/martin.jpeg", caption: "🙂The best😎" }
        ]
    },
    {
        name: "Sophy",
        whatsapp: "https://wa.me/0702836939",
        instagram: "https://www.instagram.com/sandesophy",
        media: [
            { type: "image", src: "images/sophy.jpeg", caption: "Sharp!" },
            { type: "image", src: "images/t.jpeg", caption: "Random day" },
            { type: "image", src: "images/m.jpeg", caption: "2000s! 😂😂" }
        ]
    },
    {
        name: "Rodgers",
        whatsapp: "https://wa.me/0721859015",
        instagram: "https://www.instagram.com/kiplimos",
        media: [
            { type: "image", src: "images/limo 2.jpg", caption: "Road trip" },
            { type: "image", src: "images/kayla.jpg", caption: "Kayla" },
            { type: "image", src: "images/kayla 1.jpg", caption: "Smiley Kayla" }
        ]
    },
    {
        name: "Kevin",
        whatsapp: "https://wa.me/0721416018",
        instagram: "https://www.instagram.com/kevinhosunday",
        media: [
            { type: "image", src: "images/kevin.jpeg", caption: "Mr. Kevin" },
            { type: "image", src: "images/andy.jpg", caption: "Andy" }
        ]
    },
    {
        name: "Philip",
        whatsapp: "https://wa.me/0703288502",
        instagram: "https://www.instagram.com/sandephilip",
        media: [
            { type: "image", src: "images/p.jpeg", caption: "1900s!" },
            { type: "image", src: "images/y.jpeg", caption: "Outside!" },
            { type: "image", src: "images/z.jpeg", caption: "Church session!" },
            { type: "image", src: "images/h.jpeg", caption: "Taraji" }
        ]
    },
    {
        name: "Chedy",
        whatsapp: "https://wa.me/0705264775",
        instagram: "https://www.instagram.com/chedy.sharon",
        media: [
            { type: "image", src: "images/chedeye.jpg", caption: "Congratulations!" },
            { type: "image", src: "images/chedy.jpeg", caption: "Funny moment 😂" },
            { type: "image", src: "images/chedy 2.jpeg", caption: "The family model!" },
            { type: "image", src: "images/chedy 4.jpeg", caption: "2000s!" }
        ]
    },
    {
        name: "Daniel",
        whatsapp: "https://wa.me/0797971425",
        instagram: "https://www.instagram.com/_dan_marc_",
        media: [
            { type: "image", src: "images/graduation.jpeg", caption: "Congratulations!" },
            { type: "image", src: "images/i.jpeg", caption: "😂😂😂" },
            { type: "image", src: "images/daniel.jpeg", caption: "Smiley" },
            { type: "image", src: "images/dan.jpeg", caption: "Outdoor!" }
        ]
    }
];

/* Gallery functionality */
const galleryStacks = document.getElementById('gallery-stacks');
const mediaModal = document.getElementById('media-modal');
const modalImage = document.getElementById('modal-image');
const modalVideo = document.getElementById('modal-video');
const modalClose = document.querySelector('.modal-close');

function initGallery() {
    renderGalleryStacks(galleryData);
    setupEventListeners();
}

function renderGalleryStacks(data) {
    if (galleryStacks) {
        galleryStacks.innerHTML = '';
        
        data.forEach(member => {
            const stack = document.createElement('div');
            stack.className = `stack`;
            stack.dataset.name = member.name.toLowerCase();
            
            stack.innerHTML = `
                <div class="stack-header">
                    <h3>${member.name}</h3>
                    <div class="stack-socials">
                        <a href="${member.whatsapp}" target="_blank" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>
                        <a href="${member.instagram}" target="_blank" title="Instagram"><i class="fab fa-instagram"></i></a>
                    </div>
                </div>
                <div class="stack-content">
                    <div class="stack-items">
                        ${member.media.map((item, index) => `
                            <div class="stack-item ${item.type}" data-index="${index}">
                                ${item.type === 'image' 
                                    ? `<img src="/${item.src}" alt="${item.caption}" loading="lazy">`
                                    : `<div class="video-thumbnail"><img src="/${item.thumbnail}" alt="${item.caption}" loading="lazy"></div>`
                                }
                                <div class="stack-item-caption">${item.caption}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            galleryStacks.appendChild(stack);
        });
        
        document.querySelectorAll('.stack-header').forEach(header => {
            header.addEventListener('click', function() {
                const stack = this.parentElement;
                stack.classList.toggle('expanded');
            });
        });
        
        document.querySelectorAll('.stack-item').forEach(item => {
            item.addEventListener('click', function() {
                const stack = this.closest('.stack');
                const memberName = stack.dataset.name;
                const member = data.find(m => m.name.toLowerCase() === memberName);
                const index = parseInt(this.dataset.index);
                const mediaItem = member.media[index];
                
                if (mediaItem.type === 'image') {
                    modalImage.src = `/${mediaItem.src}`;
                    modalImage.alt = mediaItem.caption;
                    modalImage.style.display = 'block';
                    modalVideo.style.display = 'none';
                } else {
                    modalVideo.src = `/${mediaItem.src}`;
                    modalVideo.poster = `/${mediaItem.thumbnail}`;
                    modalVideo.controls = true;
                    modalVideo.style.display = 'block';
                    modalImage.style.display = 'none';
                }
                
                mediaModal.classList.add('active');
            });
        });
    }
}

function setupEventListeners() {
    if (modalClose && mediaModal) {
        modalClose.addEventListener('click', function() {
            mediaModal.classList.remove('active');
            modalVideo.pause();
        });
        
        mediaModal.addEventListener('click', function(e) {
            if (e.target === mediaModal) {
                mediaModal.classList.remove('active');
                modalVideo.pause();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initGallery);