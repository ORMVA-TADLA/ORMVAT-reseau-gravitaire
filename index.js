// Register Service Worker with correct path
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Use absolute path for GitHub Pages
        const swPath = './sw.js';

        navigator.serviceWorker.register(swPath)
            .then(reg => {
                console.log('✅ Service Worker registered successfully');
                console.log('Scope:', reg.scope);
            })
            .catch(err => {
                console.error('❌ Service Worker registration failed:', err);
                console.error('Tried to register:', swPath);
            });
    });
} else {
    console.warn('⚠️ Service Workers not supported in this browser');
}

// Rest of your code...

console.log('🗺️ Initializing map...');
const map = L.map('map').setView([32.294577425170004, -6.7027966781581165], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
}).addTo(map);
console.log('✅ Map initialized');

let userMarker = null;

function locateUser() {
    console.log('📍 Location button clicked');
    // Send message to React Native to get location
    if (window.ReactNativeWebView) {
        console.log('📤 Sending getLocation request to React Native');
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'getLocation' }));
    } else {
        console.log('⚠️ Not in React Native WebView, using browser geolocation');
        // Fallback for web testing
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('✅ Browser location received:', position.coords);
                    updateUserLocation(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.error('❌ Browser geolocation error:', error);
                    alert('Unable to get location: ' + error.message);
                }
            );
        } else {
            console.error('❌ Geolocation not supported');
        }
    }
}

function updateUserLocation(lat, lon) {
    console.log('📍 Updating user location:', { lat, lon });

    // Remove old marker if exists
    if (userMarker) {
        console.log('🗑️ Removing old marker');
        map.removeLayer(userMarker);
    }

    // Add new marker
    userMarker = L.marker([lat, lon], {
        icon: L.divIcon({
            className: 'user-location-marker',
            html: '<div style="background-color: #2563eb; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
        })
    }).addTo(map);

    userMarker.bindPopup('Your Location').openPopup();

    // Center map on user location
    map.setView([lat, lon], 15);
    console.log('✅ User location updated and map centered');
}

// Listen for messages from React Native - document.addEventListener (for Android)
document.addEventListener('message', (event) => {
    console.log('📨 Message received (document):', event.data);
    handleMessage(event.data);
});

// Listen for messages from React Native - window.addEventListener (for iOS)
window.addEventListener('message', (event) => {
    console.log('📨 Message received (window):', event.data);
    handleMessage(event.data);
});

function handleMessage(data) {
    try {
        console.log('🔍 Parsing message data...');
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        console.log('✅ Parsed data:', parsedData);

        if (parsedData.type === 'locationUpdate') {
            console.log('📍 Location update received:', parsedData);
            updateUserLocation(parsedData.latitude, parsedData.longitude);
        } else if (parsedData.type === 'locationError') {
            console.error('❌ Location error received:', parsedData.message);
            alert('Location error: ' + parsedData.message);
        } else {
            console.log('⚠️ Unknown message type:', parsedData.type);
        }
    } catch (error) {
        console.error('❌ Error parsing message:', error, 'Raw data:', data);
    }
}

console.log('🌐 Loading GeoJSON layers...');

// Add P GeoJSON layer
fetch("P.geojson")
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: function (feature) {
                return {
                    weight: 1.5,
                    color: 'blue',
                };
            },
        }).addTo(map);
        console.log('✅ P.geojson loaded');
    }).catch(error => console.error('❌ Error loading P.geojson:', error));

// Add S GeoJSON layer
fetch("S.geojson")
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: function (feature) {
                return {
                    weight: 1.5,
                    color: 'purple',
                };
            },
        }).addTo(map);
        console.log('✅ S.geojson loaded');
    }).catch(error => console.error('❌ Error loading S.geojson:', error));

// Add T GeoJSON layer
fetch("T.geojson")
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: function (feature) {
                return {
                    weight: 1.5,
                    color: 'darkgreen',
                };
            },
        }).addTo(map);
        console.log('✅ T.geojson loaded');
    }).catch(error => console.error('❌ Error loading T.geojson:', error));

const ZOOM_THRESHOLD = 14;

// Function to update the marker's visibility
function updateMarkerVisibility() {
    console.log("🔍 Zoom level changed");

    const currentZoom = map.getZoom();
    console.log("🔍 Current Zoom Level:", currentZoom);

    const iconElements = document.getElementsByClassName('custom-annotation');
    for (let iconElement of iconElements) {
        if (iconElement) {
            if (currentZoom < ZOOM_THRESHOLD) {
                iconElement.style.visibility = 'hidden';
            } else {
                iconElement.style.visibility = 'visible';
            }
        }
    }
}

// add points from annotations.json
fetch("annotations.json")
    .then(response => response.json())
    .then(data => {
        data.forEach(point => {
            let myTextIcon = L.divIcon({
                className: `${point.value}`,
                html: `<div class="custom-annotation" style="transform: rotate(${point.angleInDegrees - 90}deg); transform-origin: center center;visibility: hidden;">${point.value}</div>`,
                iconSize: [100, 20]
            });
            const marker = L.marker([point.lat, point.lon], { icon: myTextIcon }).addTo(map);
        });
        console.log('✅ Annotations loaded');
    }).catch(error => console.error('❌ Error loading annotations:', error));

// Attach the function to the 'zoomend' event
map.on('zoomend', updateMarkerVisibility);

console.log('✅ All event listeners set up');
