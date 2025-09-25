// Strapi API configuration - loaded from environment config
const STRAPI_API_URL = window.ENV_CONFIG?.STRAPI_API_URL || 'https://artistic-nurture-ef3b87498b.strapiapp.com/api';
const STRAPI_API_TOKEN = window.ENV_CONFIG?.STRAPI_API_TOKEN || 'b92e18ec3c4acfff11b6f5ad39e0cd0e65fb69cb55b162cbe6f1951ddf4f2b739efba3962078aabad0b99d1faa9cc726b45d2143909c355d15126a4fabd84d54dc8f8bdd1bd6c86e1164665a46d3f536150a6a3ed019daca0ff103747c730d449a1d26d99fee9f0922c96b375c769b6c7cc147a7b85fc58c862bec943d091a1c';
const STRAPI_MEDIA_URL = window.ENV_CONFIG?.STRAPI_MEDIA_URL || 'https://artistic-nurture-ef3b87498b.strapiapp.com';

// Strapi API helper functions
async function fetchFromStrapi(endpoint) {
	try {
		const response = await fetch(`${STRAPI_API_URL}${endpoint}`, {
			headers: {
				'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
				'Content-Type': 'application/json'
			}
		});
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`HTTP error! status: ${response.status}`, errorText);
			throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Error fetching from Strapi:', error);
		return null;
	}
}

// Fetch peppsare data from Strapi
async function fetchPeppsare() {
	const data = await fetchFromStrapi('/peppsares?populate=*');
	return data?.data || [];
}

// Group peppsare by generation
function groupPeppsareByGeneration(peppsare) {
	const groups = {};
	
	peppsare.forEach(person => {
		const generation = person.Generation || 'Yngel';
		if (!groups[generation]) {
			groups[generation] = [];
		}
		groups[generation].push(person);
	});
	
	return groups;
}

// Create person card HTML
function createPersonCard(person) {
	const profileImage = person.Profilbild?.url 
		? `${STRAPI_MEDIA_URL}${person.Profilbild.url}` 
		: 'assets/images/pagen.jpg'; // fallback image
	
	// Debug logging
	console.log('Person:', person.Namn, 'Profile Image URL:', person.Profilbild?.url);
	console.log('Full Image URL:', profileImage);
	
	return `
		<article class="person-card">
			<img src="${profileImage}" alt="${person.Namn}" class="avatar" onerror="console.log('Image failed to load:', this.src); this.src='assets/images/pagen.jpg'">
			<h3>${person.Namn}</h3>
			<p class="muted">${person.Generation || 'Yngel'}</p>
		</article>
	`;
}

// Create member group HTML
function createMemberGroup(generation, members) {
	const isOpen = generation === 'OG' ? 'open' : '';
	const membersHtml = members.map(createPersonCard).join('');
	
	return `
		<details class="member-group" ${isOpen}>
			<summary>${generation}</summary>
			<div class="card-grid">
				${membersHtml}
			</div>
		</details>
	`;
}

// Load and display peppsare data
async function loadPeppsare() {
	const peppsare = await fetchPeppsare();
	console.log('Fetched peppsare data:', peppsare);
	
	if (peppsare.length === 0) {
		console.warn('No peppsare data found or error loading from Strapi');
		return;
	}
	
	const groupedPeppsare = groupPeppsareByGeneration(peppsare);
	console.log('Grouped peppsare:', groupedPeppsare);
	
	const medlemmarSection = document.getElementById('medlemmar');
	const container = medlemmarSection.querySelector('.container');
	
	// Clear existing content except the title
	const title = container.querySelector('h2');
	container.innerHTML = '';
	container.appendChild(title);
	
	// Add each generation group
	Object.keys(groupedPeppsare).forEach(generation => {
		const groupHtml = createMemberGroup(generation, groupedPeppsare[generation]);
		container.insertAdjacentHTML('beforeend', groupHtml);
	});
}

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
	
	// Load peppsare data from Strapi
	loadPeppsare();
});

