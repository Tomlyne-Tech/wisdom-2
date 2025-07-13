
  const toggleBtn = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  toggleBtn.addEventListener('click', () => {
    navLinks.classList.toggle('show');
  });
