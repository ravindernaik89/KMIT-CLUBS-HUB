// This is the complete, final script for clubhead-dashboard.js

/**
 * This is the main function that runs when the page is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. We start by loading all the initial data for the dashboard.
    loadInitialDashboard();

    // 2. We find the event form and attach our createEvent function to its 'submit' event.
    //    This is a more reliable way than using 'onsubmit' in the HTML.
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', createEvent);
    }
});

/**
 * Fetches and displays all the initial data for the Club Head dashboard.
 */
async function loadInitialDashboard() {
    const role = localStorage.getItem('role');
    if (!getToken() || role !== "clubhead") {
        alert("Please login as a Club Head first!");
        window.location.href = "LOGIN.html";
        return;
    }

    // Fetch the main dashboard data (with cache-busting)
    const res = await apiRequest("/clubhead/dashboard?_=" + new Date().getTime());

    if (res.error) {
        document.body.innerHTML = `<h2>Error: ${res.error}</h2>`;
        return;
    }

    // Populate the dashboard stat cards
    document.getElementById("clubName").innerText = res.name;
    document.getElementById("totalMembers").innerText = res.members.length;
    document.getElementById("pendingRequestsCount").innerText = res.pendingRequests.length;

    // Render the dynamic lists on the page
    renderPendingRequests(res.pendingRequests);
    renderMembers(res.members);
    loadMyEventStatus();
}

/**
 * Fetches and displays the status of events created by this club.
 */
async function loadMyEventStatus() {
    const events = await apiRequest("/clubhead/my-events");
    const list = document.getElementById("eventsList");
    if (!events || events.length === 0) {
        list.innerHTML = "<p class='text-gray-500'>Your club has no events.</p>";
        return;
    }

    list.innerHTML = events.map(event => {
        let statusColor = 'text-yellow-600';
        if (event.status === 'approved') statusColor = 'text-green-600';
        if (event.status === 'rejected') statusColor = 'text-red-600';

        return `<div class="border p-3 rounded-lg">
                    <p><strong>${event.title}</strong></p>
                    <p class="text-sm">Date: ${new Date(event.date).toLocaleDateString()}</p>
                    <p class="text-sm font-bold ${statusColor}">Status: ${event.status}</p>
                </div>`;
    }).join("");
}

/**
 * Renders the list of students waiting to join the club.
 * IMPORTANT: This version is fixed to use 'req.username' since your students don't have a 'name' field.
 */
function renderPendingRequests(requests) {
    const list = document.getElementById("pendingRequestsList");
    if (!requests || requests.length === 0) {
        list.innerHTML = "<p class='text-gray-500'>No pending requests</p>";
        return;
    }
    list.innerHTML = requests.map(req => `
        <div class="border p-3 rounded-lg shadow-sm">
            <div class="font-bold">${req.username}</div>
            <div class="mt-2 flex gap-2">
                <button class="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600" 
                        onclick="respondToRequest('${req._id}', 'accept')">
                    Accept
                </button>
                <button class="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600" 
                        onclick="respondToRequest('${req._id}', 'reject')">
                    Reject
                </button>
            </div>
        </div>
    `).join("");
}

/**
 * Renders the list of current club members.
 */
function renderMembers(members) {
    const list = document.getElementById("membersList");
    if (!members || members.length === 0) {
        list.innerHTML = "<p class='text-gray-500'>No members yet</p>";
        return;
    }
    list.innerHTML = members.map(mem => `
        <div class="border p-3 rounded-lg">
            <div class="font-bold">${mem.username}</div>
        </div>
    `).join("");
}

/**
 * Handles the 'Accept' or 'Reject' action for a student join request.
 */
async function respondToRequest(studentId, action) {
    if (!confirm(`Are you sure you want to ${action} this request?`)) return;

    const res = await apiRequest("/clubhead/respond", "POST", { studentId, action });
    if (res.message) {
        alert(res.message);
        window.location.reload();
    } else {
        alert("Error: " + (res.error || "Failed to respond"));
    }
}

/**
 * This function runs when the "Create Event" form is submitted.
 */
async function createEvent(event) {
    event.preventDefault(); // Stops the page from reloading

    const form = document.getElementById('eventForm');
    const eventData = {
        title: form.title.value,
        description: form.description.value,
        date: form.date.value
    };

    try {
        const res = await apiRequest("/clubhead/events", "POST", eventData);
        if (res.message) {
            alert(res.message);
            closeModal();
            window.location.reload();
        } else {
            alert("Server Error: " + (res.error || "An unknown error occurred."));
        }
    } catch (error) {
        console.error("API Request Failed:", error);
        alert("CRITICAL ERROR: Could not reach the server. Is it running? Details: " + error);
    }
}

/**
 * Opens the 'Create Event' modal.
 */
function openCreateEventModal() {
    document.getElementById('createEventModal').classList.remove('hidden');
}

/**
 * Closes the 'Create Event' modal.
 */
function closeModal() {
    document.getElementById('createEventModal').classList.add('hidden');
}

/**
 * Logs the user out.
 */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = 'LOGIN.html';
}