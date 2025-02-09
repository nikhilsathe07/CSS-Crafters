let map, streetView, trafficLayer, directionsService, directionsRenderer;
let currentLocationMarker, searchMarker;
let startAutocomplete, endAutocomplete, searchAutocomplete;
let userLocationSet = false;
let accountCreated = localStorage.getItem('accountCreated') === 'true'; // Load account status

// Initialize the map after the API is loaded.
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 17.4993709, lng: 78.2988525 },
        zoom: 12,
        mapTypeId: "roadmap",
        disableDefaultUI: true
    });

    streetView = map.getStreetView();
    trafficLayer = new google.maps.TrafficLayer();
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    // Get Current Location
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition((position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(userLocation);

            if (currentLocationMarker) currentLocationMarker.setMap(null);
            currentLocationMarker = new google.maps.Marker({
                position: userLocation,
                map:map,
                title: "You are here",
                icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            });
        });
    }

    // Autocomplete for inputs
    startAutocomplete = new google.maps.places.Autocomplete(document.getElementById("start"));
    endAutocomplete = new google.maps.places.Autocomplete(document.getElementById("end"));
    searchAutocomplete = new google.maps.places.Autocomplete(document.getElementById("search"));
    searchAutocomplete.addListener("place_changed", searchLocation);
}

document.addEventListener('DOMContentLoaded', () => {
    // Button Event Listeners
    document.getElementById('mapTypeButton').addEventListener('click', toggleMapTypeDropdown);
    document.getElementById('searchButton').addEventListener('click', searchLocation);
    document.getElementById('trafficButton').addEventListener('click', toggleTraffic);
    document.getElementById('myLocationButton').addEventListener('click', showCurrentLocation);
    document.getElementById('driveButton').addEventListener('click', () => routeBetweenTwoLocations('DRIVING'));
    document.getElementById('trainButton').addEventListener('click', () => routeBetweenTwoLocations('TRANSIT'));
    document.getElementById('resetMap').addEventListener('click', resetMap);
    document.getElementById('signInButton').addEventListener('click', signIn);
    document.getElementById('createAccountButton').addEventListener('click', createAccount);

    // Map type selection
    document.querySelectorAll('#mapTypeOptions a').forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent the link from navigating
            const mapType = this.dataset.mapType;
            setMapType(mapType);
        });
    });

    // Load account status
    accountCreated = localStorage.getItem('accountCreated') === 'true';
});

function toggleMapTypeDropdown() {
    document.getElementById("mapTypeDropdown").classList.toggle("show");
}

// Set the map type
function setMapType(mapType) {
    let styles = []; // Default to empty array

    switch (mapType) {
        case 'satellite':
            map.setMapTypeId('satellite');
            break;
        case 'terrain':
            map.setMapTypeId('terrain');
            break;
        default:
            map.setMapTypeId('roadmap');
            break;
    }

    map.setOptions({ styles: styles });
    toggleMapTypeDropdown();
}

// Handle Sign-In
function signIn() {
    if (!accountCreated) {
        createAccount();
    } else {
        let username = prompt("Enter username:");
        let password = prompt("Enter password:");

        let storedUsername = localStorage.getItem("username");
        let storedPassword = localStorage.getItem("password");

        if (storedUsername === username && storedPassword === password) {
            alert("Sign in successful!");
            // You can proceed with any actions after successful sign-in.
        } else {
            alert("Invalid credentials.");
        }
    }
}

// Handle Create Account
function createAccount() {
    let username = prompt("Enter a username:");
    let password = prompt("Enter a password:");

    if (username && password) {
        localStorage.setItem("username", username);
        localStorage.setItem("password", password);
        accountCreated = true;
        localStorage.setItem('accountCreated', 'true');
        alert("Account created successfully!");
    } else {
        alert("Please enter both a username and password.");
    }
}

// Search for a location and display it on the map
function searchLocation() {
    const searchInput = document.getElementById("search").value;
    if (!searchInput) {
        alert("Enter a location to search!");
        return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: searchInput }, (results, status) => {
        if (status === "OK") {
            const location = results[0].geometry.location;
            map.setCenter(location);
            map.setZoom(15);

            if (searchMarker) searchMarker.setMap(null);
            searchMarker = new google.maps.Marker({
                position: location,
                map:map,
                title: results[0].formatted_address
            });
        } else {
            alert("Location not found: " + status);
        }
    });
}

// Route between two locations (Driving or Train)
function routeBetweenTwoLocations(travelMode) {
    const startInput = document.getElementById("start").value;
    const endInput = document.getElementById("end").value;
    if (!startInput || !endInput) {
        alert("Enter both start and end locations!");
        return;
    }

    directionsService.route(
        {
            origin: startInput,
            destination: endInput,
            travelMode: travelMode === "TRANSIT" ? "TRANSIT" : "DRIVING",
            transitOptions: travelMode === "TRANSIT" ? { modes: ["RAIL"] } : null
        },
        (result, status) => {
            if (status === "OK") {
                directionsRenderer.setDirections(result);
            } else {
                alert("Could not get directions: " + status);
            }
        }
    );
}

// Show Current Location on Map
function showCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(userLocation);
            map.setZoom(15);

            if (currentLocationMarker) currentLocationMarker.setMap(null);
            currentLocationMarker = new google.maps.Marker({
                position: userLocation,
                map:map,
                title: "You are here",
                icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            });
        });
    } else {
        alert("Geolocation not supported by your browser!");
    }
}

// Toggle Traffic Layer
function toggleTraffic() {
    trafficLayer.setMap(trafficLayer.getMap() ? null : map);
}

// Reset the map View to default when Logo is clicked
function resetMap() {
    // Reset to default center and zoom level
    map.setCenter({ lat: 17.4993709, lng: 78.2988525 });
    map.setZoom(12);
}

window.initMap = initMap;