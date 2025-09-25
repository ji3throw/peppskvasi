// Strapi API configuration
const STRAPI_API_URL = 'http://localhost:1337/api'; // Adjust this URL based on your Strapi setup
const STRAPI_API_TOKEN = '7a857b7a04ab7a261eeb90cca2f21dc96866bf349bf1cd961a4a3eae30f34a9b6cf8c46dc9032a226d5d7db743cec335c9a8076c1b75a58415af859115d762dc45d5425fe18105ea8c0805adc72f71c125081edd64039c68d2512ca1e0f3b19e95013002148a37633e91c2af70662cb5e45c0bbcd2a85928701ce602e55f9c52'; // Replace with your actual API token

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
		? `http://localhost:1337${person.Profilbild.url}` 
		: 'assets/images/pagen.jpg'; // fallback image
	
	return `
		<article class="person-card">
			<img src="${profileImage}" alt="${person.Namn}" class="avatar" onerror="this.src='assets/images/pagen.jpg'">
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
	if (peppsare.length === 0) {
		console.warn('No peppsare data found or error loading from Strapi');
		return;
	}
	
	const groupedPeppsare = groupPeppsareByGeneration(peppsare);
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

