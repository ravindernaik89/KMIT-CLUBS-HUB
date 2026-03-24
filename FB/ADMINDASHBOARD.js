// Admin Dashboard JavaScript

// Global variables
let allEvents = [];
let allUsers = [];
let allClubs = [];
let fundRequests = [];

// Initialize dashboard when page loads
window.onload = async function() {
    const role = localStorage.getItem('role');
    if (!getToken() || role !== "admin") {
        alert("Please login as Admin first!");
        window.location.href = "login.html";
        return;
    }

    // Set admin name if available
    const adminName = localStorage.getItem('username') || 'Admin';
    document.getElementById('adminName').textContent = adminName;

    // Load all data
    await loadDashboardStats();
    await loadAllEvents();
    await loadAllUsers();
    await loadAllClubs();
    await loadFundRequests();
    await loadRecentActivity();
};

// Section navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll("main section").forEach(sec => sec.classList.add("hidden"));
    
    // Show selected section
    document.getElementById(sectionId).classList.remove("hidden");
    
    // Update active link in sidebar
    document.querySelectorAll(".sidebar-link").forEach(link => link.classList.remove("active"));
    event.target.classList.add("active");
    
    // Refresh section data if needed
    if (sectionId === 'events') refreshEvents();
    if (sectionId === 'users') refreshUsers();
    if (sectionId === 'clubs') refreshClubs();
    if (sectionId === 'funds') refreshFunds();
    if (sectionId === 'reports') generateReport('preview');
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const clubs = await apiRequest("/clubs");
        const events = await apiRequest("/events/approved");
        const pendingEvents = allEvents.filter(e => e.status === 'pending');
        
        // Get faculty count
        const facultyCount = allUsers.filter(u => u.role === 'faculty').length;
        
        // Calculate total members across all clubs
        let totalMembers = 0;
        if (clubs && Array.isArray(clubs)) {
            clubs.forEach(club => {
                if (club.members && Array.isArray(club.members)) {
                    totalMembers += club.members.length;
                }
            });
        }
        
        // Update UI
        document.getElementById("totalClubs").textContent = clubs ? clubs.length : 0;
        document.getElementById("totalMembers").textContent = totalMembers;
        document.getElementById("totalFaculty").textContent = facultyCount;
        document.getElementById("pendingEvents").textContent = pendingEvents.length;
        
    } catch (error) {
        console.error("Error loading dashboard stats:", error);
    }
}

// Load all events (REPLACE THIS FUNCTION)
async function loadAllEvents() {
    try {
        allEvents = await apiRequest("/admin/events");
        if (!allEvents) allEvents = [];
        console.log("Events loaded:", allEvents.length);
    } catch (error) {
        console.error("Error loading events:", error);
        allEvents = [];
    }
}

// Load all users
async function loadAllUsers() {
    try {
        allUsers = await apiRequest("/admin/users");
    } catch (error) {
        console.error("Error loading users:", error);
        allUsers = [];
    }
}

// Load all clubs
async function loadAllClubs() {
    try {
        allClubs = await apiRequest("/clubs");
        if (!allClubs) allClubs = [];
        
        // Add mock data if no clubs returned
        if (allClubs.length === 0) {
            allClubs = [
                { _id: '1', name: 'Coding Club', headUsername: 'Coding-Head', members: Array(15), description: 'Programming and tech enthusiasts' },
                { _id: '2', name: 'Cultural Club', headUsername: 'Cultural-Head', members: Array(25), description: 'Arts and cultural activities' },
                { _id: '3', name: 'Sports Club', headUsername: null, members: Array(30), description: 'Sports and physical activities' },
                { _id: '4', name: 'Literary Club', headUsername: null, members: Array(12), description: 'Debates and literary activities' }
            ];
        }
    } catch (error) {
        console.error("Error loading clubs:", error);
        allClubs = [];
    }
}
// Load fund requests (REPLACE THIS FUNCTION)

async function loadFundRequests() {
    try {
        fundRequests = await apiRequest("/admin/fund-requests") || [];
        console.log("Fund requests:", fundRequests.length);
    } catch (error) {
        console.error("Error loading fund requests:", error);
        fundRequests = [];
    }
}
// Load recent activity
async function loadRecentActivity() {
    try {
        const activityContainer = document.getElementById("recentActivity");
        
        // Simulate recent activity
        const activities = [
            { action: 'New club registration', details: 'Photography Club registered', time: '2 hours ago' },
            { action: 'Event approved', details: 'Tech Workshop by Coding Club', time: '5 hours ago' },
            { action: 'User registered', details: 'New faculty member registered', time: '1 day ago' },
            { action: 'Funds released', details: '₹5000 released for Cultural Fest', time: '2 days ago' },
            { action: 'Club head assigned', details: 'New head assigned to Sports Club', time: '3 days ago' }
        ];
        
        activityContainer.innerHTML = activities.map(activity => `
            <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div class="bg-secondary text-white p-2 rounded-full">
                    <i class="fas fa-bell text-sm"></i>
                </div>
                <div class="flex-1">
                    <p class="font-medium">${activity.action}</p>
                    <p class="text-sm text-gray-600">${activity.details}</p>
                </div>
                <span class="text-xs text-gray-500">${activity.time}</span>
            </div>
        `).join('');
        
    } catch (error) {
        console.error("Error loading recent activity:", error);
    }
}

// EVENT MANAGEMENT FUNCTIONS

// Refresh events table
async function refreshEvents() {
    await loadAllEvents();
    renderEventsTable();
}

// Render events table
function renderEventsTable() {
    const table = document.getElementById('eventTable');
    const filter = document.getElementById('eventFilter').value;
    
    let filteredEvents = allEvents;
    if (filter !== 'all') {
        filteredEvents = allEvents.filter(event => event.status === filter);
    }
    
    if (!filteredEvents || filteredEvents.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center text-gray-500">
                    <i class="fas fa-calendar-times text-3xl mb-2 block"></i>
                    <p>No events found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    table.innerHTML = filteredEvents.map(event => {
        const statusColor = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'approved': 'bg-green-100 text-green-800',
            'rejected': 'bg-red-100 text-red-800'
        }[event.status] || 'bg-gray-100 text-gray-800';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="py-3 px-4 font-medium">${event.title}</td>
                <td class="py-3 px-4">${event.club?.name || 'Unknown Club'}</td>
                <td class="py-3 px-4">${new Date(event.date).toLocaleDateString()}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColor}">
                        ${event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </span>
                </td>
                <td class="py-3 px-4 text-center">
                    <div class="flex justify-center space-x-2">
                        ${event.status === 'pending' ? `
                            <button onclick="approveEvent('${event._id}')" class="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600">
                                <i class="fas fa-check mr-1"></i>Approve
                            </button>
                            <button onclick="rejectEvent('${event._id}')" class="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600">
                                <i class="fas fa-times mr-1"></i>Reject
                            </button>
                        ` : ''}
                        <button onclick="viewEventDetails('${event._id}')" class="bg-secondary text-white px-3 py-1 rounded text-xs hover:bg-blue-600">
                            <i class="fas fa-eye mr-1"></i>View
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Filter events
function filterEvents() {
    renderEventsTable();
}

// Approve event
async function approveEvent(eventId) {
    if (!confirm('Are you sure you want to approve this event?')) return;
    
    try {
        await apiRequest(`/admin/events/${eventId}/approve`, 'POST');
        alert('Event approved successfully!');
        refreshEvents();
        loadDashboardStats();
    } catch (error) {
        alert('Error approving event: ' + (error.message || 'Unknown error'));
    }
}
// Reject event
// Reject event (REAL API)  
async function rejectEvent(eventId) {
    if (!confirm('Are you sure you want to reject this event?')) return;
    
    try {
        await apiRequest(`/admin/events/${eventId}/reject`, 'POST');
        alert('Event rejected successfully!');
        refreshEvents();
        loadDashboardStats();
    } catch (error) {
        alert('Error rejecting event: ' + (error.message || 'Unknown error'));
    }
}
// View event details
function viewEventDetails(eventId) {
    const event = allEvents.find(e => e._id === eventId);
    if (event) {
        alert(`Event Details:\n\nTitle: ${event.title}\nClub: ${event.club?.name || 'Unknown'}\nDate: ${new Date(event.date).toLocaleString()}\nStatus: ${event.status}\nDescription: ${event.description || 'No description'}`);
    }
}

// USER MANAGEMENT FUNCTIONS

// Refresh users table
async function refreshUsers() {
    await loadAllUsers();
    renderUsersTable();
}

// Render users table
function renderUsersTable() {
    const table = document.getElementById('userTable');
    const filter = document.getElementById('userFilter').value;
    
    let filteredUsers = allUsers;
    if (filter !== 'all') {
        filteredUsers = allUsers.filter(user => user.role === filter);
    }
    
    if (!filteredUsers || filteredUsers.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center text-gray-500">
                    <i class="fas fa-users-slash text-3xl mb-2 block"></i>
                    <p>No users found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    table.innerHTML = filteredUsers.map(user => {
        const roleColor = {
            'student': 'bg-blue-100 text-blue-800',
            'faculty': 'bg-purple-100 text-purple-800',
            'clubhead': 'bg-green-100 text-green-800',
            'admin': 'bg-red-100 text-red-800'
        }[user.role] || 'bg-gray-100 text-gray-800';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="py-3 px-4 font-medium">${user.username}</td>
                <td class="py-3 px-4">${user.name}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${roleColor}">
                        ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                </td>
                <td class="py-3 px-4">${user.email || 'N/A'}</td>
                <td class="py-3 px-4 text-center">
                    <div class="flex justify-center space-x-2">
                        <button onclick="editUser('${user._id}')" class="bg-secondary text-white px-3 py-1 rounded text-xs hover:bg-blue-600">
                            <i class="fas fa-edit mr-1"></i>Edit
                        </button>
                        <button onclick="deleteUser('${user._id}')" class="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600">
                            <i class="fas fa-trash mr-1"></i>Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Filter users
function filterUsers() {
    renderUsersTable();
}

// Edit user
function editUser(userId) {
    const user = allUsers.find(u => u._id === userId);
    if (user) {
        alert(`Edit user: ${user.name}\n\nThis feature would open a user edit form in a real implementation.`);
    }
}

// Delete user
// HARD DELETE - Completely removes user from database
async function deleteUser(userId) {
    if (!confirm('⚠️ PERMANENT DELETE!\n\nThis user will be COMPLETELY REMOVED from the database.\n userdata is removed completely .\n\nContinue?')) return;
    
    try {
        // ✅ Use DELETE method for hard deletion
        const result = await apiRequest(`/admin/users/${userId}`, 'DELETE');
        
        if (result.message) {
            alert('✅ User permanently deleted !');
            // Remove from frontend list
            allUsers = allUsers.filter(user => user._id !== userId);
            renderUsersTable();
        } else {
            alert('Error: ' + (result.error || 'Deletion failed'));
        }
        
    } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting user: ' + (error.message || 'Unknown error'));
    }
}

// CLUB MANAGEMENT FUNCTIONS

// Refresh clubs table
async function refreshClubs() {
    await loadAllClubs();
    renderClubsTable();
}

// Render clubs table
function renderClubsTable() {
    const table = document.getElementById('clubTable');
    
    if (!allClubs || allClubs.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center text-gray-500">
                    <i class="fas fa-chess-queen text-3xl mb-2 block"></i>
                    <p>No clubs found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    table.innerHTML = allClubs.map(club => {
        const memberCount = club.members ? club.members.length : 0;
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="py-3 px-4 font-medium">${club.name}</td>
                <td class="py-3 px-4">${club.headUsername || 'Not assigned'}</td>
                <td class="py-3 px-4">${memberCount} members</td>
                <td class="py-3 px-4">${club.description || 'No description'}</td>
                <td class="py-3 px-4 text-center">
                    <div class="flex justify-center space-x-2">
                        <button onclick="viewClubDetails('${club._id}')" class="bg-secondary text-white px-3 py-1 rounded text-xs hover:bg-blue-600">
                            <i class="fas fa-eye mr-1"></i>View
                        </button>
                        <button onclick="editClub('${club._id}')" class="bg-yellow-500 text-white px-3 py-1 rounded text-xs hover:bg-yellow-600">
                            <i class="fas fa-edit mr-1"></i>Edit
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// View club details
function viewClubDetails(clubId) {
    const club = allClubs.find(c => c._id === clubId);
    if (club) {
        const memberCount = club.members ? club.members.length : 0;
        alert(`Club Details:\n\nName: ${club.name}\nHead: ${club.headUsername || 'Not assigned'}\nMembers: ${memberCount}\nDescription: ${club.description || 'No description'}\nSlug: ${club.slug || 'N/A'}`);
    }
}

// Edit club
function editClub(clubId) {
    const club = allClubs.find(c => c._id === clubId);
    if (club) {
        alert(`Edit club: ${club.name}\n\nThis feature would open a club edit form in a real implementation.`);
    }
}

// FUND MANAGEMENT FUNCTIONS

// Refresh funds table
async function refreshFunds() {
    await loadFundRequests();
    renderFundsTable();
}

// Render funds table
function renderFundsTable() {
    const table = document.getElementById('fundTable');
    
    if (!fundRequests || fundRequests.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center text-gray-500">
                    <i class="fas fa-money-bill-wave text-3xl mb-2 block"></i>
                    <p>No fund requests found</p>
                    <p class="text-sm">Events with fund amounts will appear here</p>
                </td>
            </tr>
        `;
        return;
    }
    
    table.innerHTML = fundRequests.map(event => {
        const statusColor = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'approved': 'bg-green-100 text-green-800',
            'rejected': 'bg-red-100 text-red-800'
        }[event.status] || 'bg-gray-100 text-gray-800';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="py-3 px-4 font-medium">${event.title}</td>
                <td class="py-3 px-4">${event.club?.name || 'Unknown Club'}</td>
                <td class="py-3 px-4">₹${event.fundRequest.toLocaleString()}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColor}">
                        ${event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </span>
                </td>
                <td class="py-3 px-4 text-center">
                    <div class="flex justify-center space-x-2">
                        ${event.status === 'pending' ? `
                            <button onclick="approveEvent('${event._id}')" class="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600">
                                <i class="fas fa-check mr-1"></i>Approve
                            </button>
                            <button onclick="rejectEvent('${event._id}')" class="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600">
                                <i class="fas fa-times mr-1"></i>Reject
                            </button>
                        ` : ''}
                        <button onclick="openFundModal('${event._id}')" class="bg-secondary text-white px-3 py-1 rounded text-xs hover:bg-blue-600">
                            <i class="fas fa-edit mr-1"></i>Modify Funds
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// View fund details
function viewFundDetails(requestId) {
    const request = fundRequests.find(r => r._id === requestId);
    if (request) {
        alert(`Fund Request Details:\n\nEvent: ${request.eventTitle}\nClub: ${request.club}\nAmount: ₹${request.amount.toLocaleString()}\nStatus: ${request.status}\nRequested: ${new Date(request.requestedDate).toLocaleDateString()}`);
    }
}

// Approve fund request
async function approveFundRequest(requestId) {
    if (!confirm('Are you sure you want to approve this fund request?')) return;
    
    try {
        const requestIndex = fundRequests.findIndex(r => r._id === requestId);
        if (requestIndex !== -1) {
            fundRequests[requestIndex].status = 'approved';
        }
        
        alert('Fund request approved successfully!');
        renderFundsTable();
        
    } catch (error) {
        console.error('Error approving fund request:', error);
        alert('Error approving fund request: ' + (error.message || 'Unknown error'));
    }
}

// Reject fund request
async function rejectFundRequest(requestId) {
    if (!confirm('Are you sure you want to reject this fund request?')) return;
    
    try {
        const requestIndex = fundRequests.findIndex(r => r._id === requestId);
        if (requestIndex !== -1) {
            fundRequests[requestIndex].status = 'rejected';
        }
        
        alert('Fund request rejected successfully!');
        renderFundsTable();
        
    } catch (error) {
        console.error('Error rejecting fund request:', error);
        alert('Error rejecting fund request: ' + (error.message || 'Unknown error'));
    }
}

// Open fund modal
function openFundModal(requestId) {
    const request = fundRequests.find(r => r._id === requestId);
    if (request) {
        document.getElementById('fundEventId').value = request._id;
        document.getElementById('fundEventTitle').textContent = `${request.eventTitle} - ${request.club}`;
        document.getElementById('fundAmount').value = request.amount;
        document.getElementById('fundModal').classList.remove('hidden');
    }
}

// Close fund modal
function closeFundModal() {
    document.getElementById('fundModal').classList.add('hidden');
    document.getElementById('fundForm').reset();
}

// Handle fund form submission
// Handle fund form submission - UPDATE TO SAVE TO DATABASE
document.getElementById('fundForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const eventId = document.getElementById('fundEventId').value;
    const approvedAmount = parseInt(document.getElementById('fundAmount').value);
    
    if (!approvedAmount || approvedAmount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    try {
        // ✅ UPDATE: Save to database via API
        const result = await apiRequest(`/admin/events/${eventId}/update-funds`, 'POST', {
            approvedFund: approvedAmount
        });
        
        if (result.message) {
            alert(`Approved funds updated to ₹${approvedAmount.toLocaleString()} successfully!`);
            closeFundModal();
            refreshFunds(); // Refresh to show updated data
        } else {
            alert('Error: ' + (result.error || 'Failed to update funds'));
        }
        
    } catch (error) {
        console.error('Error updating fund amount:', error);
        alert('Error updating fund amount: ' + (error.message || 'Unknown error'));
    }
});
// REPORTS & ANALYTICS FUNCTIONS

// Generate reports
async function generateReport(type) {
    const reportContainer = document.getElementById('reportContainer');
    
    try {
        // Calculate statistics
        const totalClubs = allClubs.length;
        const totalUsers = allUsers.length;
        const totalEvents = allEvents.length;
        const pendingEvents = allEvents.filter(e => e.status === 'pending').length;
        const approvedEvents = allEvents.filter(e => e.status === 'approved').length;
        const rejectedEvents = allEvents.filter(e => e.status === 'rejected').length;
        
        const totalFundsRequested = fundRequests.reduce((sum, req) => sum + req.amount, 0);
        const approvedFunds = fundRequests
            .filter(req => req.status === 'approved')
            .reduce((sum, req) => sum + req.amount, 0);
        
        // Generate report content
        const reportContent = `
            <div class="space-y-4">
                <h4 class="text-lg font-semibold text-primary">System Statistics Report</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="bg-gray-50 p-3 rounded">
                        <strong>Total Clubs:</strong> ${totalClubs}
                    </div>
                    <div class="bg-gray-50 p-3 rounded">
                        <strong>Total Users:</strong> ${totalUsers}
                    </div>
                    <div class="bg-gray-50 p-3 rounded">
                        <strong>Total Events:</strong> ${totalEvents}
                    </div>
                    <div class="bg-gray-50 p-3 rounded">
                        <strong>Pending Events:</strong> ${pendingEvents}
                    </div>
                    <div class="bg-gray-50 p-3 rounded">
                        <strong>Approved Events:</strong> ${approvedEvents}
                    </div>
                    <div class="bg-gray-50 p-3 rounded">
                        <strong>Rejected Events:</strong> ${rejectedEvents}
                    </div>
                    <div class="bg-gray-50 p-3 rounded">
                        <strong>Total Funds Requested:</strong> ₹${totalFundsRequested.toLocaleString()}
                    </div>
                    <div class="bg-gray-50 p-3 rounded">
                        <strong>Approved Funds:</strong> ₹${approvedFunds.toLocaleString()}
                    </div>
                </div>
                
                <h4 class="text-lg font-semibold text-primary mt-6">Club Participation</h4>
                <div class="space-y-2">
                    ${allClubs.map(club => {
                        const memberCount = club.members ? club.members.length : 0;
                        const clubEvents = allEvents.filter(e => e.club?.name === club.name).length;
                        return `
                            <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span>${club.name}</span>
                                <div class="text-sm text-gray-600">
                                    <span class="mr-4">${memberCount} members</span>
                                    <span>${clubEvents} events</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <h4 class="text-lg font-semibold text-primary mt-6">Recent Fund Requests</h4>
                <div class="space-y-2">
                    ${fundRequests.slice(0, 5).map(request => `
                        <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span>${request.eventTitle}</span>
                            <div class="text-sm">
                                <span class="mr-4">${request.club}</span>
                                <span class="font-medium">₹${request.amount.toLocaleString()}</span>
                                <span class="ml-2 px-2 py-1 rounded text-xs ${request.status === 'approved' ? 'bg-green-100 text-green-800' : request.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">
                                    ${request.status}
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        reportContainer.innerHTML = reportContent;
        
        if (type === 'pdf' || type === 'csv') {
            alert(`${type.toUpperCase()} report generated successfully! In a real implementation, this would download the file.`);
        }
        
    } catch (error) {
        console.error('Error generating report:', error);
        reportContainer.innerHTML = '<p class="text-red-500">Error generating report</p>';
    }
}

// UTILITY FUNCTIONS

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

// Add event listener for fund form
document.addEventListener('DOMContentLoaded', function() {
    const fundForm = document.getElementById('fundForm');
    if (fundForm) {
        fundForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const requestId = document.getElementById('fundEventId').value;
            const amount = parseInt(document.getElementById('fundAmount').value);
            
            if (!amount || amount <= 0) {
                alert('Please enter a valid amount');
                return;
            }
            
            try {
                const requestIndex = fundRequests.findIndex(r => r._id === requestId);
                if (requestIndex !== -1) {
                    fundRequests[requestIndex].amount = amount;
                }
                
                alert(`Fund amount updated to ₹${amount.toLocaleString()} successfully!`);
                closeFundModal();
                renderFundsTable();
                
            } catch (error) {
                console.error('Error updating fund amount:', error);
                alert('Error updating fund amount: ' + (error.message || 'Unknown error'));
            }
        });
    }
});