/**
 * Futbol Wordle - Animations & UX
 */

document.addEventListener('DOMContentLoaded', () => {
    // Reveal animations for cards
    const cards = document.querySelectorAll('.game-card, .mission-card, .stat-card');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease-out';
        observer.observe(card);
    });

    // Logo icon rotation on hover
    const logo = document.querySelector('.logo-icon');
    if (logo) {
        logo.addEventListener('mouseenter', () => {
            logo.style.transform = 'rotate(360deg)';
            logo.style.transition = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
        });
        logo.addEventListener('mouseleave', () => {
            logo.style.transform = 'rotate(0deg)';
        });
    }
});