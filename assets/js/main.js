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
	// Check if the URL is already complete (starts with http/https)
	const profileImage = person.Profilbild?.url 
		? (person.Profilbild.url.startsWith('http') 
			? person.Profilbild.url 
			: `${STRAPI_MEDIA_URL}${person.Profilbild.url}`)
		: 'assets/images/pagen.jpg'; // fallback image
	
	// Debug logging (can be removed in production)
	// console.log('Person:', person.Namn, 'Profile Image URL:', person.Profilbild?.url);
	// console.log('Full Image URL:', profileImage);
	
	return `
		<article class="person-card">
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

// Test image URL accessibility (for debugging)
async function testImageUrl(url) {
	try {
		const response = await fetch(url, { method: 'HEAD' });
		return response.ok;
	} catch (error) {
		return false;
	}
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
	
	// Load peppsare data from Strapi
	loadPeppsare();
});

