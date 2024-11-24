const form = document.getElementById('data-form');
const dataTableBody = document.querySelector('#data-table tbody');
const archiveTableBody = document.querySelector('#archive-table tbody');
const searchInput = document.getElementById('search');

const dataEntries = [];
const archivedEntries = [];

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = supabase.createClient(
    'https://pwqwshinrnrcgqfbubyr.supabase.co', // Replace with your Supabase URL
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3cXdzaGlucm5yY2dxZmJ1YnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0MjIyMTgsImV4cCI6MjA0Nzk5ODIxOH0.al0mBeeqpwQaK1W2Q-cUtLKSk4feFCYJYUwLJetz7vg' // Replace with your anon key
);
console.log('Supabase initialized:', supabase);

console.log(supabase); // This should output a valid Supabase client object in the browser console.

// Add data entry
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const serialNo = document.getElementById('serialNo').value;
    const date = document.getElementById('date').value;
    const photoFile = document.getElementById('photo').files[0];
    const amount = document.getElementById('amount').value;
    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const note = document.getElementById('note').value;

    console.log({ serialNo, date, photoFile, amount, name, address, note });

    let photoURL = '';

    // Upload photo to Supabase Storage
    if (photoFile) {
        const { data, error } = await supabase.storage
            .from('photos')
            .upload(`photos/${photoFile.name}`, photoFile);

        if (error) {
            console.error('Error uploading photo:', error);
            return;
        }
        photoURL = `${supabase.storage.from('photos').getPublicUrl(`photos/${photoFile.name}`).data.publicUrl}`;
    }

    // Insert data into Supabase Database
    const { error } = await supabase.from('entries').insert([
        {
            serial_no: serialNo,
            date: date,
            photo_url: photoURL,
            amount: parseFloat(amount),
            name: name,
            address: address,
            note: note,
        },
    ]);

    if (error) {
        console.error('Error inserting data:', error);
        alert('Error saving data!');
    } else {
        alert('Data saved successfully!');
        form.reset();
        fetchData(); // Refresh the table
    }
});

async function fetchData() {
    const { data, error } = await supabase.from('entries').select('*').eq('is_archived', false);

    if (error) {
        console.error('Error fetching data:', error);
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

fetchData();


async function archiveEntry(id) {
    const { error } = await supabase.from('entries').update({ is_archived: true }).eq('id', id);

    if (error) {
        console.error('Error archiving data:', error);
        alert('Error archiving data!');
    } else {
        alert('Data archived successfully!');
        fetchData(); // Refresh the table
    }
}


// Render table
function renderTable(entries, tableBody, allowArchive) {
    tableBody.innerHTML = '';
    entries.forEach((entry, index) => {
        const row = document.createElement('tr');

        Object.keys(entry).forEach((key) => {
            const cell = document.createElement('td');
            if (key === 'photoURL') {
                const img = document.createElement('img');
                img.src = entry[key];
                img.alt = 'Photo';
                img.style.width = '50px';
                cell.appendChild(img);
            } else {
                cell.textContent = entry[key];
            }
            row.appendChild(cell);
        });

        if (allowArchive) {
            const archiveCell = document.createElement('td');
            const archiveButton = document.createElement('button');
            archiveButton.textContent = 'Archive';
            archiveButton.addEventListener('click', () => {
                archivedEntries.push(entry);
                dataEntries.splice(index, 1);
                renderTable(dataEntries, dataTableBody, true);
                renderTable(archivedEntries, archiveTableBody, false);
            });
            archiveCell.appendChild(archiveButton);
            row.appendChild(archiveCell);
        }

        tableBody.appendChild(row);
    });
}

document.getElementById('search').addEventListener('input', async (e) => {
    const query = e.target.value.toLowerCase();

    const { data, error } = await supabase.from('entries').select('*').eq('is_archived', false);

    if (error) {
        console.error('Error searching data:', error);
        return;
    }

    const filteredData = data.filter((entry) =>
        Object.values(entry).some((value) => value.toString().toLowerCase().includes(query))
    );

    const tableBody = document.querySelector('#data-table tbody');
    tableBody.innerHTML = '';

    filteredData.forEach((entry) => {
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
});

