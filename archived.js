const supabaseClient = supabase.createClient(
    'https://pwqwshinrnrcgqfbubyr.supabase.co', // Replace with your Supabase URL
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3cXdzaGlucm5yY2dxZmJ1YnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0MjIyMTgsImV4cCI6MjA0Nzk5ODIxOH0.al0mBeeqpwQaK1W2Q-cUtLKSk4feFCYJYUwLJetz7vg' // Replace with your anon key
);

// Check Login State on Page Load
document.addEventListener('DOMContentLoaded', async () => {
    const { data: session } = await supabaseClient.auth.getSession();

    if (session?.session) {
        // User is logged in
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('archived-section').style.display = 'block';
        fetchArchivedEntries();
    } else {
        // User is not logged in
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('archived-section').style.display = 'none';
    }
});

// Login Functionality
document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { user, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        alert('Login failed: ' + error.message);
    } else {
        alert('Login successful!');
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('archived-section').style.display = 'block';
        fetchArchivedEntries();
    }
});

// Fetch Archived Entries
async function fetchArchivedEntries() {
    try {
        const { data, error } = await supabaseClient
            .from('entries')
            .select('*')
            .eq('is_archived', true);

        if (error) throw error;

        renderArchivedTable(data);
    } catch (err) {
        console.error('Error fetching archived entries:', err.message);
        alert('Failed to fetch archived entries.');
    }
}

// Render Archived Table
function renderArchivedTable(data) {
    const tableBody = document.querySelector('#archived-table tbody');
    tableBody.innerHTML = ''; // Clear the table before rendering

    data.forEach((entry) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.serial_no}</td>
            <td>${formatDate(entry.date)}</td>
            <td><img src="${entry.photo_url || ''}" alt="Photo" style="width: 50px;"></td>
            <td>${entry.amount}</td>
            <td>${entry.name}</td>
            <td>${entry.address}</td>
            <td>${entry.note}</td>
            <td>${formatDate(entry.archived_date)}</td>
            <td>
                ${entry.archived_photo_url
                    ? `<img src="${entry.archived_photo_url}" alt="Archived Photo" style="width: 50px;">`
                    : 'No Archived Photo'}
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Format Date to DD-MM-YYYY
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Search Archived Entries
document.getElementById('archived-search').addEventListener('input', async (e) => {
    const query = e.target.value.toLowerCase();

    try {
        const { data, error } = await supabaseClient
            .from('entries')
            .select('*')
            .eq('is_archived', true);

        if (error) throw error;

        // Filter entries based on the search query
        const filteredData = data.filter((entry) =>
            Object.values(entry).some((value) =>
                value && value.toString().toLowerCase().includes(query)
            )
        );

        renderArchivedTable(filteredData);
    } catch (err) {
        console.error('Error searching archived entries:', err.message);
        alert('Failed to search archived entries.');
    }
});
