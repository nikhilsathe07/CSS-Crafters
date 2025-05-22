
    let map, streetView, trafficLayer, directionsService, directionsRenderer;
    let currentLocationMarker, searchMarker;
    let startAutocomplete, endAutocomplete, searchAutocomplete;
    let userLocationSet = false;
    let savedPlaces = JSON.parse(localStorage.getItem('savedPlaces')) || [];
    let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

    function initMap() {
    // Initialize map with default center
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 17.4993709, lng: 78.2988525 },
        zoom: 12,
        mapTypeId: "roadmap",
        disableDefaultUI: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        mapTypeControl: false
    });

    // Initialize services and layers
    streetView = map.getStreetView();
    trafficLayer = new google.maps.TrafficLayer();
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: false,
    preserveViewport: false
});

    // Initialize autocomplete for search inputs
    initAutocomplete();

    // Try to get user's current location
    if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
    (position) => {
    const userLocation = {
    lat: position.coords.latitude,
    lng: position.coords.longitude
};
    setUserLocation(userLocation);
},
    (error) => {
    console.error("Geolocation error:", error);
},
{ enableHighAccuracy: true }
    );
}

    // Load saved data
    loadSavedData();
}

    function initAutocomplete() {
    searchAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById("search"),
        { types: ['geocode'] }
    );
    startAutocomplete = new google.maps.places.Autocomplete(
    document.getElementById("start"),
{ types: ['geocode'] }
    );
    endAutocomplete = new google.maps.places.Autocomplete(
    document.getElementById("end"),
{ types: ['geocode'] }
    );

    searchAutocomplete.addListener("place_changed", () => {
    const place = searchAutocomplete.getPlace();
    if (!place.geometry) return;
    addRecentSearch(place);
    centerMapOnPlace(place);
});
}

    function setUserLocation(location) {
    map.setCenter(location);

    if (currentLocationMarker) {
    currentLocationMarker.setMap(null);
}

    currentLocationMarker = new google.maps.Marker({
    position: location,
    map: map,
    title: "Your Location",
    icon: {
    url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    scaledSize: new google.maps.Size(40, 40)
}
});

    userLocationSet = true;
}

    function searchLocation() {
    const searchInput = document.getElementById("search").value.trim();
    if (!searchInput) {
    alert("Please enter a location to search");
    return;
}

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: searchInput }, (results, status) => {
    if (status === "OK" && results[0]) {
    const place = {
    name: searchInput,
    geometry: results[0].geometry,
    formatted_address: results[0].formatted_address
};
    addRecentSearch(place);
    centerMapOnPlace(place);
} else {
    alert("Location not found: " + status);
}
});
}

    function centerMapOnPlace(place) {
    map.setCenter(place.geometry.location);
    map.setZoom(15);

    if (searchMarker) {
    searchMarker.setMap(null);
}

    searchMarker = new google.maps.Marker({
    position: place.geometry.location,
    map: map,
    title: place.name || place.formatted_address
});

    // Show info window
    const infoWindow = new google.maps.InfoWindow({
    content: `
                    <div class="info-window">
                        <h3>${place.name || 'Location'}</h3>
                        <p>${place.formatted_address}</p>
                        <button onclick="saveCurrentLocation()">Save Place</button>
                    </div>
                `
});
    infoWindow.open(map, searchMarker);
}

    function routeBetweenTwoLocations(travelMode) {
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;

    if (!start || !end) {
    alert("Please enter both start and end locations");
    return;
}

    directionsService.route(
{
    origin: start,
    destination: end,
    travelMode: travelMode,
    provideRouteAlternatives: true
},
    (response, status) => {
    if (status === "OK") {
    directionsRenderer.setDirections(response);

    // Show route summary
    const route = response.routes[0];
    const summaryPanel = document.createElement("div");
    summaryPanel.innerHTML = `
                            <h3>Route Summary</h3>
                            <p>Distance: ${route.legs[0].distance.text}</p>
                            <p>Duration: ${route.legs[0].duration.text}</p>
                        `;

    const infoWindow = new google.maps.InfoWindow({
    content: summaryPanel
});
    infoWindow.setPosition(route.legs[0].start_location);
    infoWindow.open(map);
} else {
    alert("Directions request failed: " + status);
}
}
    );
}

    function toggleTraffic() {
    trafficLayer.setMap(trafficLayer.getMap() ? null : map);
}

    function showCurrentLocation() {
    if (!userLocationSet) {
    if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
    (position) => {
    const location = {
    lat: position.coords.latitude,
    lng: position.coords.longitude
};
    setUserLocation(location);
},
    (error) => {
    alert("Error getting location: " + error.message);
}
    );
} else {
    alert("Geolocation is not supported by this browser.");
}
} else {
    map.setCenter(currentLocationMarker.getPosition());
    map.setZoom(15);
}
}

    function setMapType(mapType) {
    map.setMapTypeId(mapType);
}

    function resetMap() {
    map.setCenter({ lat: 17.4993709, lng: 78.2988525 });
    map.setZoom(12);
    if (directionsRenderer) directionsRenderer.setMap(null);
    if (searchMarker) searchMarker.setMap(null);
}

    function toggleNav() {
    document.getElementById("leftNav").classList.toggle("show");
}

    function saveCurrentLocation() {
    if (!searchMarker) {
    alert("No location to save. Search for a place first.");
    return;
}

    const place = {
    position: searchMarker.getPosition().toJSON(),
    title: searchMarker.getTitle() || "Saved Location",
    timestamp: new Date().toISOString()
};

    savedPlaces.unshift(place);
    if (savedPlaces.length > 10) savedPlaces.pop();

    localStorage.setItem('savedPlaces', JSON.stringify(savedPlaces));
    alert("Location saved!");
}

    function addRecentSearch(place) {
    recentSearches.unshift({
        query: place.name || place.formatted_address,
        position: place.geometry.location.toJSON(),
        timestamp: new Date().toISOString()
    });

    if (recentSearches.length > 10) recentSearches.pop();
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
}

    function loadSavedData() {
    // Could be used to display saved places or recent searches
}

    function showSavedPlaces() {
    // Implementation to show saved places
}

    function showRecentSearches() {
    // Implementation to show recent searches
}

    function showSignInModal() {
    // Implementation for sign in modal
}

    function showCreateAccountModal() {
    // Implementation for create account modal
}

    window.initMap = initMap;
