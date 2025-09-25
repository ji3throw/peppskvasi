// Strapi API configuration
const STRAPI_API_URL = 'https://artistic-nurture-ef3b87498b.strapiapp.com/api';
const STRAPI_API_TOKEN = '6a9cf10cf2949fdeb65e54962c00b1ee338e601271c8e5d4b9f28f29a94ebed9f40777a794d6850a12c60c21b726ef25eb1b7ff8982ceb5a3246f8372a5019be3f792521ef8d11777c259d584cb1d7fb2ca6dbd6928755cdac48280686179056bc9e5d80520d77bf427fc6cfd700f1e4067805150f7b9c2f325b4a387257868b'; // Replace with your actual API token

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

