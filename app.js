// Initialize Supabase
const supabaseClient = supabase.createClient(
    'https://pwqwshinrnrcgqfbubyr.supabase.co', // Replace with your Supabase URL
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3cXdzaGlucm5yY2dxZmJ1YnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0MjIyMTgsImV4cCI6MjA0Nzk5ODIxOH0.al0mBeeqpwQaK1W2Q-cUtLKSk4feFCYJYUwLJetz7vg' // Replace with your anon key
);

// Add event listener for form submission
const form = document.getElementById('data-form');
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const serialNo = document.getElementById('serialNo').value;
    const date = document.getElementById('date').value;
    const photoFile = document.getElementById('photo').files[0];
    const amount = document.getElementById('amount').value;
    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const note = document.getElementById('note').value;

    let photoURL = '';

    if (photoFile) {
        const { data, error } = await supabaseClient.storage
            .from('photos')
            .upload(`photos/${photoFile.name}`, photoFile);

        if (error) {
            console.error('Photo upload error:', error.message);
            return;
        }

        photoURL = supabaseClient.storage.from('photos').getPublicUrl(`photos/${photoFile.name}`).data.publicUrl;
    }

    const { error } = await supabaseClient.from('entries').insert([
        {
            serial_no: serialNo,
            date,
            photo_url: photoURL,
            amount: parseFloat(amount),
            name,
            address,
            note,
        },
    ]);

    if (error) {
        console.error('Database insertion error:', error.message);
    } else {
        alert('Data saved successfully!');
        form.reset();
        fetchData();
    }
});

// Fetch data and display it in the table
async function fetchData() {
    const { data, error } = await supabaseClient.from('entries').select('*').eq('is_archived', false);

    if (error) {
        console.error('Error fetching data:', error.message);
        return;
    }

    const tableBody = document.querySelector('#data-table tbody');
    tableBody.innerHTML = '';

    data.forEach((entry) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.serial_no}</td>
            <td>${entry.date}</td>
            <td><img src="${entry.photo_url}" alt="Photo" style="width: 50px;"></td>
            <td>${entry.amount}</td>
            <td>${entry.name}</td>
            <td>${entry.address}</td>
            <td>${entry.note}</td>
            <td><button onclick="archiveEntry(${entry.id})">Archive</button></td>
        `;
        tableBody.appendChild(row);
    });
}

// Archive an entry
async function archiveEntry(id) {
    const { error } = await supabaseClient.from('entries').update({ is_archived: true }).eq('id', id);

    if (error) {
        console.error('Error archiving data:', error.message);
        alert('Error archiving data!');
    } else {
        alert('Data archived successfully!');
        fetchData();
    }
}

// Fetch data initially
fetchData();
document.getElementById('search').addEventListener('input', async (e) => {
    const query = e.target.value.toLowerCase();
    console.log('Search query:', query);

    try {
        // Fetch data from Supabase
        const { data, error } = await supabaseClient.from('entries').select('*');
        if (error) throw error;

        console.log('Fetched data:', data);

        // Filter data based on the search query
        const filteredData = data.filter((entry) =>
            Object.values(entry).some((value) =>
                value && value.toString().toLowerCase().includes(query)
            )
        );

        console.log('Filtered data:', filteredData);

        // Render the filtered data
        renderTable(filteredData);
    } catch (err) {
        console.error('Error searching data:', err.message);
    }
});
function renderTable(data) {
    const tableBody = document.querySelector('#data-table tbody');
    tableBody.innerHTML = ''; // Clear the table

    data.forEach((entry) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.serial_no}</td>
            <td>${entry.date}</td>
            <td><img src="${entry.photo_url}" alt="Photo" style="width: 50px;"></td>
            <td>${entry.amount}</td>
            <td>${entry.name}</td>
            <td>${entry.address}</td>
            <td>${entry.note}</td>
            <td><button onclick="archiveEntry(${entry.id})">Archive</button></td>
        `;
        tableBody.appendChild(row);
    });
}
// Fetch archived entries
async function fetchArchivedEntries() {
    try {
        const { data, error } = await supabaseClient
            .from('entries')
            .select('*')
            .eq('is_archived', true);

        if (error) throw error;

        console.log('Fetched archived entries:', data);
        renderArchivedTable(data);
    } catch (err) {
        console.error('Error fetching archived entries:', err.message);
    }
}

// Render archived entries in the table
function renderArchivedTable(data) {
    const tableBody = document.querySelector('#archived-table tbody');
    tableBody.innerHTML = ''; // Clear existing data

    data.forEach((entry) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.serial_no}</td>
            <td>${entry.date}</td>
            <td><img src="${entry.photo_url}" alt="Photo" style="width: 50px;"></td>
            <td>${entry.amount}</td>
            <td>${entry.name}</td>
            <td>${entry.address}</td>
            <td>${entry.note}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Search archived entries
document.getElementById('archived-search').addEventListener('input', async (e) => {
    const query = e.target.value.toLowerCase();

    try {
        const { data, error } = await supabaseClient
            .from('entries')
            .select('*')
            .eq('is_archived', true);

        if (error) throw error;

        const filteredData = data.filter((entry) =>
            Object.values(entry).some((value) =>
                value && value.toString().toLowerCase().includes(query)
            )
        );

        renderArchivedTable(filteredData);
    } catch (err) {
        console.error('Error searching archived entries:', err.message);
    }
});

// Fetch archived entries on page load
fetchArchivedEntries();
