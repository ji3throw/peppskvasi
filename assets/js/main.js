document.addEventListener('DOMContentLoaded', function () {
	const yearEl = document.getElementById('year');
	if (yearEl) yearEl.textContent = new Date().getFullYear();

	const toggle = document.querySelector('.nav-toggle');
	const links = document.getElementById('nav-links');
	if (toggle && links) {
		toggle.addEventListener('click', function () {
			const expanded = this.getAttribute('aria-expanded') === 'true';
			this.setAttribute('aria-expanded', String(!expanded));
			links.style.display = expanded ? 'none' : 'flex';
		});
	}
});

