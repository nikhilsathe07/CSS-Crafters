let map, streetView, trafficLayer, directionsService, directionsRenderer;
let currentLocationMarker, searchMarker;
let startAutocomplete, endAutocomplete, searchAutocomplete;
let userLocationSet = false;
let accountCreated = localStorage.getItem('accountCreated') === 'true';

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 17.4993709, lng: 78.2988525 },
        zoom: 12,
        mapTypeId: "roadmap",
        disableDefaultUI: false,
	streetViewControl: true,
    });

    streetView = map.getStreetView();
    trafficLayer = new google.maps.TrafficLayer();
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

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

    startAutocomplete = new google.maps.places.Autocomplete(document.getElementById("start"));
    endAutocomplete = new google.maps.places.Autocomplete(document.getElementById("end"));
    searchAutocomplete = new google.maps.places.Autocomplete(document.getElementById("search"));
    searchAutocomplete.addListener("place_changed", searchLocation);
}

function toggleMapTypeDropdown() {
    document.getElementById("mapTypeDropdown").classList.toggle("show");
}

function setMapType(mapType) {
    if (mapType === 'satellite') {
        map.setMapTypeId('satellite');
        map.setOptions({styles: []});
    } else if (mapType === 'terrain') {
        map.setMapTypeId('terrain');
        map.setOptions({styles: []});
    } else {
        map.setMapTypeId('roadmap');
        map.setOptions({styles: []});
    }

    toggleMapTypeDropdown();
}

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
        } else {
            alert("Invalid credentials.");
        }
    }
}

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

function toggleTraffic() {
    trafficLayer.setMap(trafficLayer.getMap() ? null : map);
}

function resetMap() {
    map.setCenter({ lat: 17.4993709, lng: 78.2988525 });
    map.setZoom(12);
}

window.initMap = initMap;
