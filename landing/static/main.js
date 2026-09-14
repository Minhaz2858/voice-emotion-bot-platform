// main.js - Enhance UI interactivity

document.addEventListener('DOMContentLoaded', function () {
    // Animate buttons on hover
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.classList.add('active');
        });
        btn.addEventListener('mouseleave', () => {
            btn.classList.remove('active');
        });
    });
    // Add more JS features as needed
});
