const form = document.getElementById('data-form');
const dataTableBody = document.querySelector('#data-table tbody');
const archiveTableBody = document.querySelector('#archive-table tbody');
const searchInput = document.getElementById('search');

const dataEntries = [];
const archivedEntries = [];

// Add data entry
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const serialNo = document.getElementById('serialNo').value;
    const date = document.getElementById('date').value;
    const photoFile = document.getElementById('photo').files[0];
    const amount = document.getElementById('amount').value;
    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const note = document.getElementById('note').value;

    const photoURL = photoFile ? URL.createObjectURL(photoFile) : '';

    const newData = { serialNo, date, photoURL, amount, name, address, note };
    dataEntries.push(newData);
    renderTable(dataEntries, dataTableBody, true);

    form.reset();
});

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

// Search functionality
searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const filteredEntries = dataEntries.filter((entry) =>
        Object.values(entry).some((value) =>
            value.toString().toLowerCase().includes(query)
        )
    );
    renderTable(filteredEntries, dataTableBody, true);
});
