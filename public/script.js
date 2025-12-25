let notes = [];
let reminders = [];
let currentCategoryFilter = 'All';
let formHandler = null;
let eventListenersAttached = false;

const API_BASE = 'http://localhost:3000';

// Load data from server on page load
async function loadData() {
    try {
        const response = await fetch(`${API_BASE}/api/notes`);
        const data = await response.json();
        notes = data.notes || [];
        reminders = data.reminders || [];
        displayNotes();
        displayReminders();
        initializeCategoryFilters();
        checkReminders();
    } catch (error) {
        console.error('Error loading data from server:', error);
        loadFromLocalStorage();
    }
    
    // Add category input if missing
    addCategoryInput();
}

// Fallback function to load from localStorage
function loadFromLocalStorage() {
    const savedNotes = localStorage.getItem('notes');
    const savedReminders = localStorage.getItem('reminders');

    if (savedNotes) {
        notes = JSON.parse(savedNotes);
    }
    if (savedReminders) {
        reminders = JSON.parse(savedReminders);
    }

    displayNotes();
    displayReminders();
    initializeCategoryFilters();
}

// Save data to server and update local arrays
async function saveToServerAndUpdateLocal(note) {
    try {
        const response = await fetch(`${API_BASE}/api/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(note),
        });
        const savedNote = await response.json();

        // Update local arrays
        if (savedNote.reminder) {
            reminders.push(savedNote);
        } else {
            notes.push(savedNote);
        }

        // Update localStorage as backup
        saveToLocalStorage();
        
        return savedNote;
    } catch (error) {
        console.error('Error saving to server:', error);
        // Fallback to localStorage
        saveToLocalStorage();
        if (note.reminder) {
            reminders.push(note);
        } else {
            notes.push(note);
        }
        return note;
    }
}

// Update data on server and local arrays
async function updateOnServerAndLocal(id, updates) {
    try {
        const response = await fetch(`${API_BASE}/api/notes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
        });
        const updatedNote = await response.json();

        // Update local arrays
        updateLocalArrays(updatedNote);
        
        // Update localStorage
        updateLocalStorage();

        return updatedNote;
    } catch (error) {
        console.error('Error updating on server:', error);
        // Fallback to localStorage
        updateLocalStorage();
        return null;
    }
}

// Delete from server and local arrays
async function deleteFromServerAndLocal(id) {
    try {
        await fetch(`${API_BASE}/api/notes/${id}`, {
            method: 'DELETE',
        });

        // Update local arrays
        notes = notes.filter(note => note.id !== id);
        reminders = reminders.filter(reminder => reminder.id !== id);
        
        // Update localStorage
        deleteFromLocalStorage(id);

    } catch (error) {
        console.error('Error deleting from server:', error);
        // Fallback to localStorage
        deleteFromLocalStorage(id);
    }
}

// Helper function to update local arrays
function updateLocalArrays(updatedNote) {
    // Remove from both arrays first
    notes = notes.filter(note => note.id !== updatedNote.id);
    reminders = reminders.filter(reminder => reminder.id !== updatedNote.id);

    // Add to appropriate array
    if (updatedNote.reminder) {
        reminders.push(updatedNote);
    } else {
        notes.push(updatedNote);
    }
}

// Fallback localStorage functions
function saveToLocalStorage() {
    localStorage.setItem('notes', JSON.stringify(notes));
    localStorage.setItem('reminders', JSON.stringify(reminders));
}

function updateLocalStorage() {
    saveToLocalStorage();
}

function deleteFromLocalStorage(id) {
    notes = notes.filter(note => note.id !== id);
    reminders = reminders.filter(reminder => reminder.id !== id);
    saveToLocalStorage();
}

// Get next ID from server
async function getNextId() {
    try {
        const response = await fetch(`${API_BASE}/api/next-id`);
        const data = await response.json();
        return data.nextId;
    } catch (error) {
        // Fallback to localStorage counter
        let idCounter = parseInt(localStorage.getItem('idCounter')) || 0;
        idCounter++;
        localStorage.setItem('idCounter', idCounter.toString());
        return idCounter;
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing app');
    
    // Initialize form handler if available
    if (typeof window.FormHandler !== 'undefined') {
        formHandler = new window.FormHandler();
    }
    
    // Load data and setup
    loadData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check reminders every minute
    setInterval(checkReminders, 60000);
    
    // Request notification permission
    requestNotificationPermission();
});

// Setup event listeners (only once)
function setupEventListeners() {
    if (eventListenersAttached) return;
    
    console.log('Setting up event listeners');
    
    // Add note button
    const addButton = document.getElementById("add-note-button");
    if (addButton) {
        // Remove any existing listeners by cloning
        const newAddButton = addButton.cloneNode(true);
        addButton.parentNode.replaceChild(newAddButton, addButton);
        
        newAddButton.addEventListener("click", handleAddNote);
    }
    
    // Reset button
    const resetButton = document.getElementById("reset-button");
    if (resetButton) {
        const newResetButton = resetButton.cloneNode(true);
        resetButton.parentNode.replaceChild(newResetButton, resetButton);
        
        newResetButton.addEventListener("click", handleResetForm);
    }
    
    eventListenersAttached = true;
}

// Handle add note
async function handleAddNote(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Add note button clicked');
    
    // Use form handler if available, otherwise use direct method
    if (formHandler && formHandler.submitNoteForm) {
        await formHandler.submitNoteForm();
    } else {
        await addNote();
    }
}

// Handle reset form
function handleResetForm(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Reset button clicked');
    
    // Use form handler if available, otherwise use direct method
    if (formHandler && formHandler.resetForm) {
        formHandler.resetForm('note');
    } else {
        resetNoteForm();
    }
}

// Function to add category input if missing
function addCategoryInput() {
    const noteInputSection = document.getElementById('note-input-section');
    const datetimeGroup = document.querySelector('.input-group:has(#note-datetime)');
    
    if (datetimeGroup && !document.getElementById('note-category')) {
        const categoryHtml = `
            <div class="input-group">
                <label for="note-category">Category</label>
                <select id="note-category">
                    <option value="General">General</option>
                    <option value="School">School</option>
                    <option value="Personal">Personal</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                </select>
            </div>
        `;
        
        datetimeGroup.insertAdjacentHTML('afterend', categoryHtml);
        
        // Re-setup event listeners since DOM changed
        eventListenersAttached = false;
        setupEventListeners();
    }
}

// Initialize category filter buttons
function initializeCategoryFilters() {
    const categories = ['All', 'General', 'School', 'Personal', 'Work', 'Other'];
    const notesContainer = document.getElementById('notes-display');
    const remindersContainer = document.getElementById('reminders');
    
    // Remove existing filter buttons
    document.querySelectorAll('.filter-buttons').forEach(el => el.remove());
    
    // Add filter buttons to notes section
    const notesFilterDiv = document.createElement('div');
    notesFilterDiv.className = 'filter-buttons';
    notesFilterDiv.innerHTML = categories.map(cat => 
        `<button class="category-filter ${cat === 'All' ? 'active' : ''}" data-category="${cat}">${cat}</button>`
    ).join('');
    
    // Add filter buttons to reminders section
    const remindersFilterDiv = document.createElement('div');
    remindersFilterDiv.className = 'filter-buttons';
    remindersFilterDiv.innerHTML = categories.map(cat => 
        `<button class="category-filter ${cat === 'All' ? 'active' : ''}" data-category="${cat}">${cat}</button>`
    ).join('');
    
    // Insert before containers
    const notesTitle = notesContainer.querySelector('h2');
    const remindersTitle = remindersContainer.querySelector('h2');
    
    if (notesTitle && notesContainer.querySelector('#notes-container')) {
        notesTitle.insertAdjacentElement('afterend', notesFilterDiv);
    }
    
    if (remindersTitle && remindersContainer.querySelector('#reminders-container')) {
        remindersTitle.insertAdjacentElement('afterend', remindersFilterDiv);
    }
    
    // Add event listeners to all filter buttons
    document.querySelectorAll('.category-filter').forEach(button => {
        button.addEventListener('click', () => {
            // Update active state
            document.querySelectorAll('.category-filter').forEach(btn => 
                btn.classList.remove('active')
            );
            button.classList.add('active');
            
            // Update filter
            currentCategoryFilter = button.getAttribute('data-category');
            displayNotes();
            displayReminders();
        });
    });
}

// Main function to add a note
async function addNote() {
    console.log('addNote function called');
    
    const addButton = document.getElementById("add-note-button");
    
    // Disable button to prevent double clicks
    if (addButton.disabled) {
        console.log('Button already disabled, ignoring click');
        return;
    }
    
    addButton.disabled = true;
    const originalText = addButton.textContent;
    addButton.textContent = 'Saving...';
    
    try {
        // Get form values directly
        const noteContent = document.getElementById("note-content").value;
        const noteTitle = document.getElementById("note-title").value;
        const noteDatetime = document.getElementById("note-datetime").value;
        const noteCategory = document.getElementById("note-category")?.value || 'General';
        
        console.log('Form values:', { noteTitle, noteCategory });

        // Validate required fields
        if (!noteContent.trim()) {
            alert('Note content is required');
            return;
        }

        // Generate title if empty
        let title = noteTitle;
        if (!title) {
            const untitledCount = [...notes, ...reminders].filter(note => 
                note.title && note.title.startsWith("Untitled")
            ).length;
            title = `Untitled${untitledCount + 1}`;
        }

        const id = await getNextId();

        const note = {
            id: id,
            title: title,
            content: noteContent,
            timestamp: new Date().toLocaleString(),
            lastEditTime: new Date().toLocaleString(),
            reminder: noteDatetime || null,
            alertedDay: false,
            alertedTime: false,
            done: false,
            missed: false,
            category: noteCategory
        };

        console.log('Saving note:', note);

        // Save to server and update local arrays
        await saveToServerAndUpdateLocal(note);

        // Update display
        displayNotes();
        displayReminders();

        // Clear fields
        resetNoteForm();

        // Check reminders
        checkReminders();
        
        console.log('Note saved successfully');
        
    } catch (error) {
        console.error('Error saving note:', error);
        alert('Failed to save note. Please try again.');
    } finally {
        // Re-enable button
        addButton.disabled = false;
        addButton.textContent = originalText;
    }
}

function resetNoteForm() {
    document.getElementById("note-content").value = "";
    document.getElementById("note-title").value = "";
    document.getElementById("note-datetime").value = "";
    const categorySelect = document.getElementById("note-category");
    if (categorySelect) {
        categorySelect.value = "General";
    }
}

function displayNotes() {
    const notesContainer = document.getElementById("notes-container");
    if (!notesContainer) return;
    
    notesContainer.innerHTML = "";

    // Filter notes by category
    let filteredNotes = notes;
    if (currentCategoryFilter !== 'All') {
        filteredNotes = notes.filter(note => note.category === currentCategoryFilter);
    }

    if (filteredNotes.length === 0) {
        notesContainer.innerHTML = `<p>No ${currentCategoryFilter === 'All' ? '' : currentCategoryFilter + ' '}notes available.</p>`;
        return;
    }

    filteredNotes.forEach((note) => {
        const noteElement = document.createElement("div");
        noteElement.className = "note compact";
        noteElement.innerHTML = `
            <div class="note-summary" data-id="${note.id}">
                <div class="title-line">
                    ${note.title}
                    ${note.category ? `<span class="category-badge category-${note.category.toLowerCase()}">${note.category}</span>` : ''}
                </div>
                <p>${note.content.length > 100 ? note.content.substring(0, 100) + '...' : note.content}</p>
            </div>
        `;
        notesContainer.appendChild(noteElement);

        // Add click event to summary
        const summary = noteElement.querySelector('.note-summary');
        summary.addEventListener('click', () => {
            const id = parseInt(summary.getAttribute('data-id'));
            const index = notes.findIndex(n => n.id === id);
            showNoteDetails(index, 'note');
        });
    });
}

function displayReminders() {
    const remindersContainer = document.getElementById("reminders-container");
    if (!remindersContainer) return;
    
    remindersContainer.innerHTML = "";

    // Filter reminders by category
    let filteredReminders = reminders;
    if (currentCategoryFilter !== 'All') {
        filteredReminders = reminders.filter(reminder => reminder.category === currentCategoryFilter);
    }

    if (filteredReminders.length === 0) {
        remindersContainer.innerHTML = `<p>No ${currentCategoryFilter === 'All' ? '' : currentCategoryFilter + ' '}reminders set.</p>`;
        return;
    }

    // Sort reminders: missed -> upcoming -> done
    const sortedReminders = [...filteredReminders].sort((a, b) => {
        if (a.missed && !b.missed) return -1;
        if (!a.missed && b.missed) return 1;
        if (!a.done && b.done) return -1;
        if (a.done && !b.done) return 1;
        return 0; // same status, maintain order
    });

    sortedReminders.forEach((note) => {
        const reminderElement = document.createElement("div");
        reminderElement.className = `reminder compact ${note.missed ? 'missed' : ''} ${note.done ? 'done' : ''}`;
        reminderElement.innerHTML = `
            <div class="note-summary" data-id="${note.id}">
                <div class="title-line">
                    ${note.title}
                    ${note.category ? `<span class="category-badge category-${note.category.toLowerCase()}">${note.category}</span>` : ''}
                    ${note.missed ? '<span class="status missed">MISSED</span>' : note.done ? '<span class="status done">DONE</span>' : ''}
                </div>
                <p>${note.content.length > 100 ? note.content.substring(0, 100) + '...' : note.content}</p>
            </div>
        `;
        remindersContainer.appendChild(reminderElement);

        // Add click event to summary
        const summary = reminderElement.querySelector('.note-summary');
        summary.addEventListener('click', () => {
            const id = parseInt(summary.getAttribute('data-id'));
            const index = reminders.findIndex(r => r.id === id);
            showNoteDetails(index, 'reminder');
        });
    });
}

function editNote(index, type) {
    const noteList = type === 'note' ? notes : reminders;
    const note = noteList[index];
    const modal = document.getElementById('note-modal');
    const modalBody = document.getElementById('modal-body');

    const hasReminder = !!note.reminder;
    const categories = ['General', 'School', 'Personal', 'Work', 'Other'];
    const categoryOptions = categories.map(cat => 
        `<option value="${cat}" ${note.category === cat ? 'selected' : ''}>${cat}</option>`
    ).join('');

    modalBody.innerHTML = `
        <h2>Edit ${type === 'note' ? 'Note' : 'Reminder'}</h2>
        <div class="edit-input-section">
            <input type="text" id="edit-title" value="${note.title}" placeholder="Edit Note Title">
            <textarea id="edit-content" placeholder="Edit your note here...">${note.content}</textarea>
            <select id="edit-category">
                ${categoryOptions}
            </select>
            <input type="datetime-local" id="edit-datetime" value="${note.reminder ? new Date(note.reminder).toISOString().slice(0, 16) : ''}" style="display: ${hasReminder ? 'block' : 'none'}">
            <div class="edit-buttons">
                <button id="toggle-reminder">${hasReminder ? 'Remove Reminder' : 'Add Reminder'}</button>
                <button id="reset-edit">Reset</button>
                <button id="save-edit">Save</button>
                <button id="cancel-edit">Cancel</button>
            </div>
        </div>
    `;

    modal.style.display = 'block';

    // Close modal
    const closeBtn = document.querySelector('.close');
    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target === modal) modal.style.display = 'none';
    };

    let currentHasReminder = hasReminder;

    // Toggle reminder button
    document.getElementById('toggle-reminder').addEventListener('click', () => {
        const datetimeInput = document.getElementById('edit-datetime');
        const toggleBtn = document.getElementById('toggle-reminder');
        if (currentHasReminder) {
            // Remove reminder
            datetimeInput.value = '';
            datetimeInput.style.display = 'none';
            toggleBtn.textContent = 'Add Reminder';
            currentHasReminder = false;
        } else {
            // Add reminder
            datetimeInput.style.display = 'block';
            toggleBtn.textContent = 'Remove Reminder';
            currentHasReminder = true;
        }
    });

    // Reset button
    document.getElementById('reset-edit').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all changes?')) {
            document.getElementById('edit-title').value = note.title;
            document.getElementById('edit-content').value = note.content;
            document.getElementById('edit-category').value = note.category || 'General';
            const datetimeInput = document.getElementById('edit-datetime');
            datetimeInput.value = note.reminder ? new Date(note.reminder).toISOString().slice(0, 16) : '';
            datetimeInput.style.display = hasReminder ? 'block' : 'none';
            document.getElementById('toggle-reminder').textContent = hasReminder ? 'Remove Reminder' : 'Add Reminder';
            currentHasReminder = hasReminder;
        }
    });

    // Save button
    document.getElementById('save-edit').addEventListener('click', async () => {
        const newTitle = document.getElementById('edit-title').value;
        const newContent = document.getElementById('edit-content').value;
        const newCategory = document.getElementById('edit-category').value;
        const newDatetime = currentHasReminder ? document.getElementById('edit-datetime').value : null;

        const updates = {
            title: newTitle,
            content: newContent,
            category: newCategory,
            reminder: newDatetime,
            lastEditTime: new Date().toLocaleString()
        };
        
        if (newDatetime) {
            updates.alertedDay = false;
            updates.alertedTime = false;
            updates.missed = false;
        }

        try {
            // Update on server and local arrays
            await updateOnServerAndLocal(note.id, updates);

            // Refresh both displays since item might have moved
            displayNotes();
            displayReminders();
            checkReminders();
        } catch (error) {
            console.error('Error updating note:', error);
        }
        modal.style.display = 'none';
    });

    // Cancel button
    document.getElementById('cancel-edit').addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

function showNoteDetails(index, type) {
    const noteList = type === 'note' ? notes : reminders;
    const note = noteList[index];
    const modal = document.getElementById('note-modal');
    const modalBody = document.getElementById('modal-body');

    let buttons = `
        <button id="edit-detail">Edit</button>
        <button id="delete-detail">Delete</button>
    `;

    if (type === 'reminder') {
        buttons += `
            <button id="toggle-done-detail" class="${note.done ? 'undone' : 'done'}">${note.done ? 'Undone' : 'Done'}</button>
        `;
    }

    modalBody.innerHTML = `
        <h2>${note.title}</h2>
        ${note.category ? `<p><strong>Category:</strong> ${note.category}</p>` : ''}
        <p>${note.content}</p>
        <small>Created at: ${note.timestamp}</small>
        <br><small>Last edited: ${note.lastEditTime}</small>
        ${note.reminder ? `<br><small>Reminder set for: ${new Date(note.reminder).toLocaleString()}</small>` : ''}
        ${note.missed ? '<br><small class="status missed">MISSED</small>' : ''}
        ${note.done ? '<br><small class="status done">DONE</small>' : ''}
        <div class="modal-buttons">
            ${buttons}
        </div>
    `;

    modal.style.display = 'block';

    // Close modal
    const closeBtn = document.querySelector('.close');
    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target === modal) modal.style.display = 'none';
    };

    // Edit button
    document.getElementById('edit-detail').addEventListener('click', () => {
        editNote(index, type);
    });

    // Delete button
    document.getElementById('delete-detail').addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this note?')) {
            await deleteFromServerAndLocal(note.id);
            
            if (type === 'note') {
                displayNotes();
            } else {
                displayReminders();
            }
            modal.style.display = 'none';
        }
    });

    // Toggle done button for reminders
    if (type === 'reminder') {
        document.getElementById('toggle-done-detail').addEventListener('click', async () => {
            note.done = !note.done;
            if (note.done) {
                note.missed = false;
            }

            // Update on server and local arrays
            await updateOnServerAndLocal(note.id, {
                done: note.done,
                missed: note.missed
            });

            displayReminders();
            checkReminders();
            modal.style.display = 'none';
        });
    }
}

function checkReminders() {
    const now = new Date();
    const today = now.toDateString();

    reminders.forEach(async (reminder) => {
        if (!reminder.reminder || reminder.done) return;

        try {
            const reminderDate = new Date(reminder.reminder);
            if (isNaN(reminderDate.getTime())) return;

            const reminderDay = reminderDate.toDateString();
            const reminderTime = reminderDate.getTime();

            let needsUpdate = false;
            const updates = {};

            // Check if it's the day of the reminder
            if (!reminder.alertedDay && reminderDay === today) {
                showNotification(`Reminder for today: ${reminder.title}`, reminder.content);
                reminder.alertedDay = true;
                updates.alertedDay = true;
                needsUpdate = true;
            }

            // Check if it's the specific time (within 1 minute)
            if (!reminder.alertedTime && Math.abs(now.getTime() - reminderTime) < 60000) {
                showNotification(`Reminder time: ${reminder.title}`, reminder.content);
                reminder.alertedTime = true;
                updates.alertedTime = true;
                needsUpdate = true;
            }

            // Check if missed
            if (!reminder.missed && now.getTime() > reminderTime + 60000) {
                reminder.missed = true;
                showNotification(`Missed reminder: ${reminder.title}`, reminder.content);
                updates.missed = true;
                needsUpdate = true;
                displayReminders();
            }

            // Update server if needed
            if (needsUpdate) {
                await updateOnServerAndLocal(reminder.id, updates);
            }
        } catch (error) {
            console.error('Error checking reminder:', error);
        }
    });
}

// Notification functions
function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("Notification permission granted");
            }
        });
    }
}

function showNotification(title, body) {
    // Show browser notification if available
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
            body: body,
            icon: '/icon.png'
        });
    }
    
    // Also show alert as fallback
    alert(`${title}\n${body}`);
}

// Make functions available globally
window.addNote = addNote;
window.editNote = editNote;
window.showNoteDetails = showNoteDetails;
window.checkReminders = checkReminders;
window.resetNoteForm = resetNoteForm;
window.displayNotes = displayNotes;
window.displayReminders = displayReminders;