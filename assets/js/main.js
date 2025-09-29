// Strapi API configuration - loaded from environment config
//const STRAPI_API_URL = window.ENV_CONFIG?.STRAPI_API_URL || 'https://artistic-nurture-ef3b87498b.strapiapp.com/api';
const STRAPI_API_URL = 'http://localhost:1337/api';
const STRAPI_API_TOKEN = '1aa47abd1b6dbcbd7dedf326c68d8b10b45b5f00d7d543f3bb9c7504dabdb2f275d2c88a98565671565985de1736f349d4766ce52775bc5bd9caf38aaea533638b6e0759e3f3964348150147ad6e471d3f6395eb8dd862b5379c6b98690f9255fefdaa80d36f8880d3ad57ca9d942168931604da2f343013147b8a2bc0c0e624';
// const STRAPI_API_TOKEN = window.ENV_CONFIG?.STRAPI_API_TOKEN || 'b92e18ec3c4acfff11b6f5ad39e0cd0e65fb69cb55b162cbe6f1951ddf4f2b739efba3962078aabad0b99d1faa9cc726b45d2143909c355d15126a4fabd84d54dc8f8bdd1bd6c86e1164665a46d3f536150a6a3ed019daca0ff103747c730d449a1d26d99fee9f0922c96b375c769b6c7cc147a7b85fc58c862bec943d091a1c';
//const STRAPI_MEDIA_URL = window.ENV_CONFIG?.STRAPI_MEDIA_URL || 'https://artistic-nurture-ef3b87498b.strapiapp.com';
const STRAPI_MEDIA_URL = 'http://localhost:1337';

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

// Fetch evenemang data from Strapi
async function fetchEvenemang() {
	const data = await fetchFromStrapi('/evenemangs?populate=*');
	return data?.data || [];
}

// Group peppsare by generation with dynamic ordering
function groupPeppsareByGeneration(peppsare) {
	const groups = {};
	
	peppsare.forEach(person => {
		const generation = person.Generation || 'Yngel';
		if (!groups[generation]) {
			groups[generation] = [];
		}
		groups[generation].push(person);
	});
	
	// Get all generation names
	const allGenerations = Object.keys(groups);
	
	// Separate special generations from numbered generations
	const specialGenerations = allGenerations.filter(gen => gen === 'OG' || gen === 'Yngel');
	const numberedGenerations = allGenerations.filter(gen => gen.startsWith('Gen '));
	
	// Sort numbered generations numerically (Gen 1, Gen 2, Gen 3, etc.)
	numberedGenerations.sort((a, b) => {
		const numA = parseInt(a.replace('Gen ', ''));
		const numB = parseInt(b.replace('Gen ', ''));
		return numA - numB;
	});
	
	// Build the final order: OG first, then numbered generations, then Yngel last
	const generationOrder = [];
	
	// Add OG first (if it exists)
	if (groups['OG']) {
		generationOrder.push('OG');
	}
	
	// Add numbered generations in order
	generationOrder.push(...numberedGenerations);
	
	// Add Yngel last (if it exists)
	if (groups['Yngel']) {
		generationOrder.push('Yngel');
	}
	
	// Add any other unexpected generations at the end
	const otherGenerations = allGenerations.filter(gen => 
		gen !== 'OG' && gen !== 'Yngel' && !gen.startsWith('Gen ')
	);
	generationOrder.push(...otherGenerations);
	
	// Create ordered groups object
	const orderedGroups = {};
	generationOrder.forEach(gen => {
		if (groups[gen]) {
			orderedGroups[gen] = groups[gen];
		}
	});
	
	return orderedGroups;
}

// Create person card HTML
function createPersonCard(person) {
	// Check if the URL is already complete (starts with http/https)
	const profileImage = person.Profilbild?.url 
		? (person.Profilbild.url.startsWith('http') 
			? person.Profilbild.url 
			: `${STRAPI_MEDIA_URL}${person.Profilbild.url}`)
		: 'assets/images/pagen.jpg'; // fallback image
	
	
	return `
		<article class="person-card" data-member='${JSON.stringify(person).replace(/'/g, "&#39;")}'>
			<img src="${profileImage}" 
				 alt="${person.Namn}" 
				 class="avatar" 
				 onerror="this.src='assets/images/pagen.jpg'">
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

// Create event card HTML
function createEventCard(event) {
	const linkHtml = event.Link ? `<a href="${event.Link}" target="_blank" rel="noopener">Anmäl dig här</a>` : '';
	
	return `
		<article class="event-card">
			<h3>${event.Titel || 'Evenemang'}</h3>
			<p class="muted">${event.Datum || ''}${event.Plats ? ` • ${event.Plats}` : ''}</p>
			<p>${event.Tagline || ''}</p>
			${linkHtml}
		</article>
	`;
}

// Test image URL accessibility (for debugging)
async function testImageUrl(url) {
	try {
		const response = await fetch(url, { method: 'HEAD' });
		return response.ok;
	} catch (error) {
		return false;
	}
}

// Show test statistics when no data is available
function showTestStatistics() {
	console.log('Showing test statistics...');
	const medlemmarSection = document.getElementById('medlemmar');
	const container = medlemmarSection.querySelector('.container');
	
	// Clear existing content except the title
	const title = container.querySelector('h2');
	container.innerHTML = '';
	container.appendChild(title);
	
	// Create test statistics
	const testStats = {
		total: 10,
		withSkauning: 6,
		percentage: 60,
		byGeneration: {
			'OG': { total: 3, withSkauning: 2, percentage: 67 },
			'Gen 1': { total: 4, withSkauning: 3, percentage: 75 },
			'Yngel': { total: 3, withSkauning: 1, percentage: 33 }
		}
	};
	
	const statisticsHtml = createStatisticsDisplay(testStats);
	console.log('Test statistics HTML:', statisticsHtml);
	container.insertAdjacentHTML('beforeend', statisticsHtml);
	
	// Add a test message
	container.insertAdjacentHTML('beforeend', '<p style="color: #D4AF37; text-align: center; margin-top: 1rem;">Test data - No real data loaded from Strapi</p>');
}

// Calculate statistics from peppsare data
function calculateStatistics(peppsare) {
	console.log('Calculating statistics for peppsare:', peppsare);
	
	const stats = {
		total: peppsare.length,
		withSkauning: peppsare.filter(person => person.Skauning === true).length,
		percentage: 0,
		byGeneration: {}
	};
	
	console.log('Basic stats:', { total: stats.total, withSkauning: stats.withSkauning });
	
	// Calculate overall percentage
	if (stats.total > 0) {
		stats.percentage = Math.round((stats.withSkauning / stats.total) * 100);
	}
	
	// Group by generation and calculate stats
	const groupedPeppsare = groupPeppsareByGeneration(peppsare);
	
	Object.keys(groupedPeppsare).forEach(generation => {
		const generationMembers = groupedPeppsare[generation];
		const withSkauning = generationMembers.filter(person => person.Skauning === true).length;
		
		stats.byGeneration[generation] = {
			total: generationMembers.length,
			withSkauning: withSkauning,
			percentage: generationMembers.length > 0 ? Math.round((withSkauning / generationMembers.length) * 100) : 0
		};
	});
	
	return stats;
}

// Create statistics display HTML
function createStatisticsDisplay(stats) {
	return `
		<div class="statistics-section">
			<div class="stats-overview">
				<h3>Statistik</h3>
				<div class="percentage-display">
					<div class="percentage-circle">
						<svg viewBox="0 0 100 100" class="percentage-svg">
							<circle cx="50" cy="50" r="45" class="percentage-bg"></circle>
							<circle cx="50" cy="50" r="45" class="percentage-fill" 
									stroke-dasharray="${2 * Math.PI * 45}" 
									stroke-dashoffset="${2 * Math.PI * 45 * (1 - stats.percentage / 100)}"></circle>
						</svg>
						<div class="percentage-text">
							<span class="percentage-number">${stats.percentage}%</span>
						</div>
					</div>
					<div class="stats-details">
						<p><strong>${stats.withSkauning}</strong> av <strong>${stats.total}</strong> peppsare är skåningar</p>
						<p>Resten önskar att de var det</p>
					</div>
				</div>
			</div>
			<div class="generation-graph">
				<h3>Skåningar i Pepps över tid</h3>
				<div class="graph-container">
					<svg viewBox="0 0 400 200" class="line-graph">
						${createLineGraph(stats.byGeneration)}
					</svg>
				</div>
			</div>
		</div>
	`;
}

// Create line graph SVG
function createLineGraph(generationStats) {
	const generations = Object.keys(generationStats);
	if (generations.length === 0) return '';
	
	// Calculate cumulative statistics
	let cumulativeTotal = 0;
	let cumulativeSkauning = 0;
	const cumulativePoints = [];
	
	generations.forEach(generation => {
		cumulativeTotal += generationStats[generation].total;
		cumulativeSkauning += generationStats[generation].withSkauning;
		const cumulativePercentage = Math.round((cumulativeSkauning / cumulativeTotal) * 100);
		
		cumulativePoints.push({
			generation,
			total: cumulativeTotal,
			withSkauning: cumulativeSkauning,
			percentage: cumulativePercentage
		});
	});
	
	const maxPercentage = Math.max(...cumulativePoints.map(point => point.percentage));
	const minPercentage = Math.min(...cumulativePoints.map(point => point.percentage));
	const percentageRange = maxPercentage - minPercentage;
	const padding = 40;
	const width = 400 - (padding * 2);
	const height = 200 - (padding * 2);
	
	// Calculate points for the line (cumulative percentages)
	const points = cumulativePoints.map((point, index) => {
		const x = padding + (index * (width / (generations.length - 1)));
		// Scale based on the actual range of percentages
		const normalizedPercentage = percentageRange > 0 ? 
			(point.percentage - minPercentage) / percentageRange : 0.5;
		const y = padding + height - (normalizedPercentage * height);
		return { x, y, generation: point.generation, percentage: point.percentage, total: point.total, withSkauning: point.withSkauning };
	});
	
	// Create line path
	const pathData = points.map((point, index) => 
		`${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
	).join(' ');
	
	// Create grid lines
	const gridLines = [];
	for (let i = 0; i <= 4; i++) {
		const y = padding + (i * height / 4);
		gridLines.push(`
			<line x1="${padding}" y1="${y}" x2="${padding + width}" y2="${y}" class="grid-line"/>
		`);
	}
	
	// Create generation labels
	const genLabels = points.map(point => `
		<text x="${point.x}" y="${height + padding + 20}" class="generation-label" text-anchor="middle">${point.generation}</text>
	`);
	
	// Create dots and tooltips
	const dots = points.map(point => `
		<circle cx="${point.x}" cy="${point.y}" r="4" class="data-point" data-generation="${point.generation}" data-percentage="${point.percentage}" data-total="${point.total}" data-skauning="${point.withSkauning}"/>
		<text x="${point.x}" y="${point.y - 10}" class="point-label" text-anchor="middle">${point.percentage}%</text>
	`);
	
	return `
		${gridLines.join('')}
		<path d="${pathData}" class="line-path"/>
		${dots.join('')}
		${genLabels.join('')}
	`;
}

// Load and display peppsare data
async function loadPeppsare() {
	console.log('Starting to load peppsare data...');
	console.log('Environment config:', window.ENV_CONFIG);
	
	const peppsare = await fetchPeppsare();
	console.log('Fetched peppsare data:', peppsare);
	
	if (peppsare.length === 0) {
		console.warn('No peppsare data found or error loading from Strapi');
		// Show a test statistics section even with no data
		showTestStatistics();
		return;
	}
	
	const groupedPeppsare = groupPeppsareByGeneration(peppsare);
	const statistics = calculateStatistics(peppsare);
	
	// Debug: Log the generation order
	console.log('Final generation order:', Object.keys(groupedPeppsare));
	console.log('Statistics:', statistics);
	
	const medlemmarSection = document.getElementById('medlemmar');
	const container = medlemmarSection.querySelector('.container');
	
	// Clear existing content except the title
	const title = container.querySelector('h2');
	container.innerHTML = '';
	container.appendChild(title);
	
	// Add statistics section
	const statisticsHtml = createStatisticsDisplay(statistics);
	console.log('Statistics HTML:', statisticsHtml);
	container.insertAdjacentHTML('beforeend', statisticsHtml);
	
	// Add a simple test to see if the section was added
	const statsSection = container.querySelector('.statistics-section');
	console.log('Statistics section found:', statsSection);
	
	// Add each generation group
	Object.keys(groupedPeppsare).forEach(generation => {
		const groupHtml = createMemberGroup(generation, groupedPeppsare[generation]);
		container.insertAdjacentHTML('beforeend', groupHtml);
	});
	
	// Add click event listeners to person cards
	setupPersonCardClickListeners();
}

// Setup click listeners for person cards
function setupPersonCardClickListeners() {
	const personCards = document.querySelectorAll('.person-card');
	personCards.forEach(card => {
		card.addEventListener('click', () => {
			try {
				const memberData = JSON.parse(card.getAttribute('data-member'));
				openMemberModal(memberData);
			} catch (error) {
				console.error('Error parsing member data:', error);
			}
		});
	});
}

// Load and display evenemang data
async function loadEvenemang() {
	console.log('Starting to load evenemang data...');
	
	const evenemang = await fetchEvenemang();
	console.log('Fetched evenemang data:', evenemang);
	
	const evenemangSection = document.getElementById('evenemang');
	const container = evenemangSection.querySelector('.container');
	
	// Clear existing content except the title and section lead
	const title = container.querySelector('h2');
	const sectionLead = container.querySelector('.section-lead');
	container.innerHTML = '';
	container.appendChild(title);
	container.appendChild(sectionLead);
	
	if (evenemang.length === 0) {
		console.warn('No evenemang data found or error loading from Strapi');
		container.insertAdjacentHTML('beforeend', '<p>Inga evenemang tillgängliga för tillfället.</p>');
		return;
	}
	
	// Create card grid container
	const cardGrid = document.createElement('div');
	cardGrid.className = 'card-grid';
	
	// Add each event card
	evenemang.forEach(event => {
		const eventCard = createEventCard(event);
		cardGrid.insertAdjacentHTML('beforeend', eventCard);
	});
	
	container.appendChild(cardGrid);
}

// Modal functionality
function openMemberModal(member) {
	const modal = document.getElementById('memberModal');
	const modalImage = document.getElementById('modalMemberImage');
	const modalName = document.getElementById('modalMemberName');
	const modalGeneration = document.getElementById('modalMemberGeneration');
	const modalDetails = document.getElementById('modalMemberDetails');
	
	// Set member image
	const profileImage = member.Profilbild?.url 
		? (member.Profilbild.url.startsWith('http') 
			? member.Profilbild.url 
			: `${STRAPI_MEDIA_URL}${member.Profilbild.url}`)
		: 'assets/images/pagen.jpg';
	
	modalImage.src = profileImage;
	modalImage.alt = member.Namn;
	
	// Set member name and generation
	modalName.textContent = member.Namn;
	
	// Set member details with new fields in single column
	let detailsHtml = '';
	
	// Add Skauning status
	if (member.Skauning !== undefined) {
		detailsHtml += `<p><strong>Skåning:</strong> ${member.Skauning ? 'Ja' : 'Nej'}</p>`;
	}
	
	// Add favorite drink
	if (member.Favoritdryck) {
		detailsHtml += `<p><strong>Favoritdryck:</strong> ${member.Favoritdryck}</p>`;
	}
	
	// Add favorite melody
	if (member.Favoritmelodi) {
		detailsHtml += `<p><strong>Favoritmelodi:</strong> ${member.Favoritmelodi}</p>`;
	}
	
	// Add favorite quote
	if (member.Favoritcitat) {
		detailsHtml += `<p><strong>Favoritcitat:</strong> "${member.Favoritcitat}"</p>`;
	}
	
	modalDetails.innerHTML = detailsHtml;
	
	// Show modal
	modal.classList.add('active');
	document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeMemberModal() {
	const modal = document.getElementById('memberModal');
	modal.classList.remove('active');
	document.body.style.overflow = ''; // Restore scrolling
}

// Event listeners for modal
function setupModalEventListeners() {
	const modal = document.getElementById('memberModal');
	const closeButton = modal.querySelector('.modal-close');
	
	// Close button click
	closeButton.addEventListener('click', closeMemberModal);
	
	// Click outside modal to close
	modal.addEventListener('click', (e) => {
		if (e.target === modal) {
			closeMemberModal();
		}
	});
	
	// Escape key to close
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && modal.classList.contains('active')) {
			closeMemberModal();
		}
	});
}

// Device detection utilities
function detectAppleDevice() {
	const userAgent = navigator.userAgent.toLowerCase();
	
	// Check for various Apple devices and browsers
	const isAppleDevice = 
		userAgent.includes('iphone') ||
		userAgent.includes('ipad') ||
		userAgent.includes('ipod') ||
		userAgent.includes('macintosh') ||
		userAgent.includes('mac os x') ||
		userAgent.includes('safari') && userAgent.includes('version') ||
		// Check for iOS devices (even if user agent is spoofed)
		(navigator.platform && navigator.platform.toLowerCase().includes('mac')) ||
		// Check for touch devices that are likely iOS
		('ontouchend' in document && window.screen && window.screen.width <= 1024);
	
	return isAppleDevice;
}

function getDeviceInfo() {
	const userAgent = navigator.userAgent.toLowerCase();
	const isApple = detectAppleDevice();
	
	let deviceType = 'unknown';
	let deviceName = 'Unknown Device';
	
	if (isApple) {
		if (userAgent.includes('iphone')) {
			deviceType = 'iphone';
			deviceName = 'iPhone';
		} else if (userAgent.includes('ipad')) {
			deviceType = 'ipad';
			deviceName = 'iPad';
		} else if (userAgent.includes('ipod')) {
			deviceType = 'ipod';
			deviceName = 'iPod';
		} else if (userAgent.includes('macintosh') || userAgent.includes('mac os x')) {
			deviceType = 'mac';
			deviceName = 'Mac';
		} else {
			deviceType = 'apple-other';
			deviceName = 'Apple Device';
		}
	} else {
		if (userAgent.includes('android')) {
			deviceType = 'android';
			deviceName = 'Android';
		} else if (userAgent.includes('windows')) {
			deviceType = 'windows';
			deviceName = 'Windows';
		} else if (userAgent.includes('linux')) {
			deviceType = 'linux';
			deviceName = 'Linux';
		}
	}
	
	return {
		isApple: isApple,
		deviceType: deviceType,
		deviceName: deviceName,
		userAgent: navigator.userAgent
	};
}


// Add device detection to the page
function addDeviceDetection() {
	const deviceInfo = getDeviceInfo();
	
	// Add device class to body for CSS targeting
	document.body.classList.add(`device-${deviceInfo.deviceType}`);
	if (deviceInfo.isApple) {
		document.body.classList.add('apple-device');
	}
	
	return deviceInfo;
}

// Global utility functions for device detection
window.DeviceDetection = {
	// Check if current device is Apple
	isApple: () => detectAppleDevice(),
	
	// Get full device info
	getInfo: () => getDeviceInfo(),
	
	// Check specific device types
	isiPhone: () => getDeviceInfo().deviceType === 'iphone',
	isiPad: () => getDeviceInfo().deviceType === 'ipad',
	isMac: () => getDeviceInfo().deviceType === 'mac',
	isAndroid: () => getDeviceInfo().deviceType === 'android',
	isWindows: () => getDeviceInfo().deviceType === 'windows',
	
	// Check if device supports touch
	isTouchDevice: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
	
	// Check if device is mobile
	isMobile: () => {
		const info = getDeviceInfo();
		return info.deviceType === 'iphone' || info.deviceType === 'ipad' || info.deviceType === 'android';
	}
};

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
	
	// Detect Apple device and add device info
	const deviceInfo = addDeviceDetection();
	
	// Setup modal event listeners
	setupModalEventListeners();
	
	// Load peppsare data from Strapi
	loadPeppsare();
	
	// Load evenemang data from Strapi
	loadEvenemang();
});

