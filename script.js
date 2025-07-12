// script.js
console.log("Wisdom Chamber site is loading...");


// script.js

const menuToggle = document.getElementById("menu-toggle");
const nav = document.getElementById("nav");

menuToggle.addEventListener("click", () => {
  nav.classList.toggle("active");
});

// Reveal on scroll 
function revealOnScroll() {
  const reveals = document.querySelectorAll(".reveal");

  reveals.forEach(el => {
    const windowHeight = window.innerHeight;
    const revealTop = el.getBoundingClientRect().top;
    const revealPoint = 100; // adjust for earlier/later reveal

    if (revealTop < windowHeight - revealPoint) {
      el.classList.add("active");
    } else {
      el.classList.remove("active"); // optional: removes animation on scroll out
    }
  });
}

window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll); // trigger on page load



// Simple fade-in using IntersectionObserver
const cards = document.querySelectorAll('.founder-card');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in');
    }
  });
}, {
  threshold: 0.1
});

cards.forEach(card => observer.observe(card));


const verses = [
  "Proverbs 4:7 – Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding.",
  "James 1:5 – If any of you lack wisdom, let him ask of God, that giveth to all men liberally...",
  "Isaiah 30:21 – Your ears shall hear a word behind you, saying, ‘This is the way, walk in it.’",
  "Psalm 111:10 – The fear of the LORD is the beginning of wisdom...",
  "Colossians 2:3 – In Christ are hidden all the treasures of wisdom and knowledge.",
  "Ecclesiastes 7:12 – Wisdom preserves those who have it."
];

// Rotate based on day
const today = new Date();
const verseIndex = today.getDate() % verses.length;

document.getElementById("daily-verse").innerText = verses[verseIndex];


const carouselTrack = document.getElementById('carouselTrack');
const images = carouselTrack.querySelectorAll('img');
let index = 0;
const intervalTime = 2000; // 2 seconds

function moveCarousel() {
  index++;
  if (index >= images.length) {
    index = 0;
  }
  const offset = -index * images[0].clientWidth;
  carouselTrack.style.transform = `translateX(${offset}px)`;
}

let carouselInterval = setInterval(moveCarousel, intervalTime);

// Optional: Pause on hover
const wrapper = document.getElementById('carouselWrapper');
wrapper.addEventListener('mouseenter', () => clearInterval(carouselInterval));
wrapper.addEventListener('mouseleave', () => {
  carouselInterval = setInterval(moveCarousel, intervalTime);
});


const testimonials = document.querySelectorAll('.testimonial');

window.addEventListener('scroll', () => {
  testimonials.forEach(testimonial => {
    const top = testimonial.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;

    if (top < windowHeight - 50) {
      testimonial.classList.add('visible');
    }
  });
});








