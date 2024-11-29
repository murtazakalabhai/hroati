// Initialize Supabase
const supabaseClient = supabase.createClient(
    'https://pwqwshinrnrcgqfbubyr.supabase.co', // Replace with your Supabase URL
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3cXdzaGlucm5yY2dxZmJ1YnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0MjIyMTgsImV4cCI6MjA0Nzk5ODIxOH0.al0mBeeqpwQaK1W2Q-cUtLKSk4feFCYJYUwLJetz7vg' // Replace with your anon key
);


// Custom Login Functionality
document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        alert('Login failed: ' + error.message);
    } else {
        alert('Login successful!');
        localStorage.setItem('isLoggedIn', 'true'); // Store login state locally
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('main-section').style.display = 'block';
        fetchData(); // Load data after login
    }
});

// Check Login State on Page Load
document.addEventListener('DOMContentLoaded', async () => {
    const { data: session } = await supabaseClient.auth.getSession();
    if (session?.session) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('main-section').style.display = 'block';
        fetchData(); // Load data on page load
    } else {
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('main-section').style.display = 'none';
    }
});

// Logout Functionality
document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        const { error } = await supabaseClient.auth.signOut(); // Logout from Supabase
        if (error) throw error;

        // Clear local session storage
        localStorage.removeItem('isLoggedIn');

        alert('Logged out successfully!');
        location.reload(); // Redirect to the login screen
    } catch (err) {
        console.error('Error during logout:', err.message);
        alert('Failed to log out. Please try again.');
    }
});

// Generate Serial Number
async function generateSerialNo() {
    const currentYear = new Date().getFullYear();
    const { data, error } = await supabaseClient.from('entries').select('serial_no').order('id', { ascending: false }).limit(1);

    let nextNumber = 1;
    if (data && data.length > 0) {
        const lastSerialNo = data[0].serial_no;
        const lastYear = lastSerialNo.split('-')[0];
        const lastNumber = parseInt(lastSerialNo.split('-')[1]);

        if (lastYear == currentYear) {
            nextNumber = lastNumber + 1;
        }
    }

    return `${currentYear}-${String(nextNumber).padStart(3, '0')}`;
}

// // Form Submission for Add/Edit Entry
let currentEditId = null; // Track the ID of the entry being edited
document.getElementById('data-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Check Supabase Session
    const { data: session } = await supabaseClient.auth.getSession();
    if (!session?.session) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('isLoggedIn');
        location.reload();
        return;
    }

    const serialNo = await generateSerialNo();
    const date = document.getElementById('date').value;
    const photoFile = document.getElementById('photo').files[0];
    const amount = document.getElementById('amount').value;
    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const note = document.getElementById('note').value;

    let photoURL = '';

    // Upload photo if provided
    if (photoFile) {
        try {
            // Generate a unique file name using a timestamp
            const uniqueFileName = `entry-${Date.now()}-${photoFile.name}`;
            const { data, error } = await supabaseClient.storage
                .from('photos')
                .upload(`photos/${uniqueFileName}`, photoFile);

            if (error) throw error;

            photoURL = supabaseClient.storage
                .from('photos')
                .getPublicUrl(`photos/${uniqueFileName}`)
                .data.publicUrl;
        } catch (err) {
            console.error('Photo upload error:', err.message);
            alert('Failed to upload photo.');
            return;
        }
    }

    // Insert new entry into the database
    try {
        if (currentEditId) {
            // Edit Mode: Update the existing entry
            const { error } = await supabaseClient
                .from('entries')
                .update({
                    date,
                    photo_url: photoURL,
                    amount: parseFloat(amount),
                    name,
                    address,
                    note,
                    is_archived: false,
                })
                .eq('id', currentEditId);

            if (error) throw error;

            alert('Entry updated successfully!');
        } else {
            // Add Mode: Create a new entry
            const { error } = await supabaseClient.from('entries').insert({
                serial_no: serialNo,
                date,
                photo_url: photoURL,
                amount: parseFloat(amount),
                name,
                address,
                note,
                is_archived: false,
            });

            if (error) throw error;

            alert('Entry added successfully!');
        }

        // Reset form and fetch updated data
        resetForm();
        fetchData();
    } catch (err) {
        console.error('Error saving entry:', err.message);
        alert('Failed to save entry.');
    }
});


// Check Login State on Page Load
document.addEventListener('DOMContentLoaded', async () => {
    const { data: session } = await supabaseClient.auth.getSession();
    if (session?.session) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('main-section').style.display = 'block';
        fetchData(); // Load data on page load
    } else {
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('main-section').style.display = 'none';
    }
});


// Fetch and Render Data
async function fetchData() {
    const { data, error } = await supabaseClient.from('entries').select('*').eq('is_archived', false);
    if (error) {
        console.error(error);
        return;
    }
    renderTable(data);
}

function renderTable(data) {
    const tableBody = document.querySelector('#data-table tbody');
    tableBody.innerHTML = ''; // Clear the table before rendering

    data.forEach((entry) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.serial_no}</td>
            <td>${formatDate(entry.date)}</td>
            <td><img src="${entry.photo_url}" style="width:50px;"></td>
            <td>${entry.amount}</td>
            <td>${entry.name}</td>
            <td>${entry.address}</td>
            <td>${entry.note}</td>
            <td>
                <button onclick="enableArchivePhoto(${entry.id})">Archive</button>
                <input type="file" id="archived-photo-${entry.id}" accept="image/*" disabled>
                <button onclick="finalizeArchive(${entry.id})">Submit Archive</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function enableArchivePhoto(entryId) {
    const photoInput = document.getElementById(`archived-photo-${entryId}`);
    if (photoInput) {
        photoInput.disabled = false; // Enable the file input
        alert('You can now upload the archived photo.');
    }
}
async function finalizeArchive(entryId) {
    const archivedPhotoInput = document.getElementById(`archived-photo-${entryId}`);
    if (archivedPhotoInput.disabled) {
        alert('Please enable and upload an archived photo before submitting.');
        return;
    }

    const archivedPhoto = archivedPhotoInput.files[0];
    let archivedPhotoURL = '';

    // Upload the archived photo if provided
    if (archivedPhoto) {
        try {
            // Generate a unique file name using a timestamp
            const uniqueFileName = `archived-${Date.now()}-${archivedPhoto.name}`;
            const { data, error } = await supabaseClient.storage
                .from('archived-photos')
                .upload(`archived-photos/${uniqueFileName}`, archivedPhoto);

            if (error) throw error;

            archivedPhotoURL = supabaseClient.storage
                .from('archived-photos')
                .getPublicUrl(`archived-photos/${uniqueFileName}`)
                .data.publicUrl;
        } catch (err) {
            console.error('Archived photo upload error:', err.message);
            alert('Failed to upload archived photo.');
            return;
        }
    }

    // Update the entry with archived details
    try {
        const archivedDate = new Date().toISOString();
        const { error } = await supabaseClient
            .from('entries')
            .update({
                is_archived: true,
                archived_date: archivedDate,
                archived_photo_url: archivedPhotoURL,
            })
            .eq('id', entryId);

        if (error) throw error;

        alert('Entry archived successfully!');
        fetchData(); // Refresh the table
    } catch (err) {
        console.error('Error archiving entry:', err.message);
        alert('Failed to archive entry.');
    }
}



function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Archive an Entry
async function archiveEntry(id) {
    const confirmArchive = confirm('Are you sure you want to archive this entry? This action cannot be undone.');
    if (!confirmArchive) return;

    const archivedDate = new Date().toISOString();

    const archivedPhoto = document.getElementById(`archived-photo-${id}`).files[0];
    let archivedPhotoURL = '';

    if (archivedPhoto) {
        const { data, error } = await supabaseClient.storage
            .from('archived-photos')
            .upload(`archived-photos/${archivedPhoto.name}`, archivedPhoto);

        if (error) {
            console.error('Archived photo upload error:', error.message);
            alert('Failed to upload archived photo.');
            return;
        }

        archivedPhotoURL = supabaseClient.storage
            .from('archived-photos')
            .getPublicUrl(`archived-photos/${archivedPhoto.name}`)
            .data.publicUrl;
    }

    const { error } = await supabaseClient
        .from('entries')
        .update({ is_archived: true, archived_date: archivedDate, archived_photo_url: archivedPhotoURL })
        .eq('id', id);

    if (error) {
        alert('Error archiving entry: ' + error.message);
        return;
    }

    alert('Entry archived successfully!');
    fetchData();
}

// Export Data to Excel
document.getElementById('export-btn').addEventListener('click', async () => {
    const { data, error } = await supabaseClient.from('entries').select('*');
    if (error) {
        console.error(error);
        alert('Failed to export data.');
        return;
    }

    const formattedData = data.map((entry) => ({
        SerialNo: entry.serial_no,
        Date: formatDate(entry.date),
        PhotoURL: entry.photo_url,
        Amount: entry.amount,
        Name: entry.name,
        Address: entry.address,
        Note: entry.note,
        ArchivedDate: entry.archived_date ? formatDate(entry.archived_date) : 'N/A',
        ArchivedPhotoURL: entry.archived_photo_url || '',
        Archived: entry.is_archived ? 'Yes' : 'No',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Entries');
    XLSX.writeFile(workbook, 'Entries.xlsx');
});

// Import Data from Excel
document.getElementById('import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const importedData = XLSX.utils.sheet_to_json(sheet);

        for (const row of importedData) {
            const { SerialNo, Date, PhotoURL, Amount, Name, Address, Note, ArchivedDate, ArchivedPhotoURL, Archived } = row;
            await supabaseClient.from('entries').insert({
                serial_no: SerialNo,
                date: new Date(Date).toISOString(),
                photo_url: PhotoURL,
                amount: parseFloat(Amount),
                name: Name,
                address: Address,
                note: Note,
                archived_date: ArchivedDate ? new Date(ArchivedDate).toISOString() : null,
                archived_photo_url: ArchivedPhotoURL || null,
                is_archived: Archived === 'Yes',
            });
        }
        alert('Data imported successfully!');
        fetchData();
    };
    reader.readAsArrayBuffer(file);
});

// Fetch Data on Page Load
fetchData();

// Backup to JSON
document.getElementById('backup-btn').addEventListener('click', async () => {
    try {
        const { data, error } = await supabaseClient.from('entries').select('*');
        if (error) throw error;

        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'backup.json';
        a.click();
        URL.revokeObjectURL(url);

        alert('Backup created successfully!');
    } catch (err) {
        console.error('Error creating backup:', err.message);
        alert('Failed to create backup.');
    }
});

// Restore from JSON
document.getElementById('restore-btn').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const jsonData = JSON.parse(event.target.result);

            for (const row of jsonData) {
                await supabaseClient.from('entries').insert(row);
            }

            alert('Restore completed successfully!');
            fetchData(); // Refresh the table
        };

        reader.readAsText(file);
    } catch (err) {
        console.error('Error restoring data:', err.message);
        alert('Failed to restore data.');
    }
});

let allEntries = []; // Store fetched entries globally for searching

// Fetch and Render Data
async function fetchData() {
    try {
        const { data, error } = await supabaseClient.from('entries').select('*').eq('is_archived', false);
        if (error) throw error;

        allEntries = data; // Store fetched data globally
        renderTable(data); // Render the fetched data
    } catch (err) {
        console.error('Error fetching data:', err.message);
        alert('Failed to fetch data.');
    }
}

// Search Functionality
document.getElementById('search').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();

    // Filter globally stored entries
    const filteredData = allEntries.filter((entry) =>
        Object.values(entry).some((value) =>
            value && value.toString().toLowerCase().includes(query)
        )
    );

    renderTable(filteredData); // Re-render the table with filtered data
});

function renderTable(data) {
    const tableBody = document.querySelector('#data-table tbody');
    tableBody.innerHTML = ''; // Clear the table before rendering

    data.forEach((entry) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.serial_no}</td>
            <td>${formatDate(entry.date)}</td>
            <td><img src="${entry.photo_url}" style="width:50px;"></td>
            <td>${entry.amount}</td>
            <td>${entry.name}</td>
            <td>${entry.address}</td>
            <td>${entry.note}</td>
            <td>
                <button onclick="editEntry(${entry.id})">Edit</button>
                <button onclick="enableArchivePhoto(${entry.id})">Archive</button>
                <input type="file" id="archived-photo-${entry.id}" accept="image/*" disabled>
                <button onclick="finalizeArchive(${entry.id})">Submit Archive</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}
async function editEntry(entryId) {
    // Fetch the existing entry data
    try {
        const { data: entry, error } = await supabaseClient
            .from('entries')
            .select('*')
            .eq('id', entryId)
            .single();

        if (error) throw error;

        // Populate the form fields with the entry data
        document.getElementById('serialNo').value = entry.serial_no;
        document.getElementById('date').value = entry.date.split('T')[0]; // Format the date for the input
        document.getElementById('amount').value = entry.amount;
        document.getElementById('name').value = entry.name;
        document.getElementById('address').value = entry.address;
        document.getElementById('note').value = entry.note;

 // Switch to Edit Mode
 currentEditId = entryId;

 // Update the form submit button text
 document.querySelector('button[type="submit"]').textContent = 'Save Changes';
 document.getElementById('cancel-edit-btn').style.display = 'block'; // Show the cancel button
} catch (err) {
 console.error('Error fetching entry for editing:', err.message);
 alert('Failed to fetch entry for editing.');
}
}


function resetForm() {
    // Clear form fields
    document.getElementById('serialNo').value = '';
    document.getElementById('date').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('name').value = '';
    document.getElementById('address').value = '';
    document.getElementById('note').value = '';

    // Reset to Add Mode
    currentEditId = null;

    // Reset the form submit button text
    document.querySelector('button[type="submit"]').textContent = 'Add Entry';
}


document.getElementById('cancel-edit-btn').addEventListener('click', () => {
    resetForm();
    document.getElementById('cancel-edit-btn').style.display = 'none'; // Hide the cancel button
});