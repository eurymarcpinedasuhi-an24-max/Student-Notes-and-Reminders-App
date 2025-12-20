const notes = [];
const reminders = [];

// Unique ID counter
let idCounter = parseInt(localStorage.getItem('idCounter')) || 0;

displayNotes();
displayReminders();

// Check reminders every minute
setInterval(checkReminders, 60000);
checkReminders(); // Check immediately on load

document.getElementById("add-note-button").addEventListener("click", () => {
    const noteContent = document.getElementById("note-content").value;
    const noteTitle = document.getElementById("note-title").value;
    const noteDatetime = document.getElementById("note-datetime").value;

    // Generate title if empty
    let title = noteTitle.trim();
    if (!title) {
        const untitledCount = [...notes, ...reminders].filter(note => note.title && note.title.startsWith("Untitled")).length;
        title = `Untitled${untitledCount + 1}`;
    }

    const note = {
        id: ++idCounter,
        title: title,
        content: noteContent,
        timestamp: new Date().toLocaleString(),
        lastEditTime: new Date().toLocaleString(),
        reminder: noteDatetime || null,
        alertedDay: false,
        alertedTime: false,
        done: false,
        missed: false
    };

    localStorage.setItem('idCounter', idCounter);

    if (note.reminder) {
        reminders.push(note);
        displayReminders();
    } else {
        notes.push(note);
        displayNotes();
    }

    // Clear fields
    document.getElementById("note-content").value = "";
    document.getElementById("note-title").value = "";
    document.getElementById("note-datetime").value = "";

    checkReminders();
});

function displayNotes() {
    const notesContainer = document.getElementById("notes-container");
    notesContainer.innerHTML = "";

    if (notes.length === 0) {
        notesContainer.innerHTML = "<p>No notes available.</p>";
        return;
    }

    notes.forEach((note, index) => {
        const noteElement = document.createElement("div");
        noteElement.className = "note compact";
        noteElement.innerHTML = `
            <div class="note-summary" data-id="${note.id}">
                <div class="title-line">${note.title}</div>
                <p>${note.content}</p>
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
    remindersContainer.innerHTML = "";

    if (reminders.length === 0) {
        remindersContainer.innerHTML = "<p>No reminders set.</p>";
        return;
    }

    // Sort reminders: missed -> upcoming -> done
    const sortedReminders = [...reminders].sort((a, b) => {
        if (a.missed && !b.missed) return -1;
        if (!a.missed && b.missed) return 1;
        if (!a.done && b.done) return -1;
        if (a.done && !b.done) return 1;
        return 0; // same status, maintain order
    });

    sortedReminders.forEach((note, index) => {
        const reminderElement = document.createElement("div");
        reminderElement.className = `reminder compact ${note.missed ? 'missed' : ''} ${note.done ? 'done' : ''}`;
        reminderElement.innerHTML = `
            <div class="note-summary" data-id="${note.id}">
                <div class="title-line">${note.title} ${note.missed ? '<span class="status missed">MISSED</span>' : note.done ? '<span class="status done">DONE</span>' : ''}</div>
                <p>${note.content}</p>
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
    const container = type === 'note' ? document.getElementById("notes-container") : document.getElementById("reminders-container");
    const noteList = type === 'note' ? notes : reminders;
    const note = noteList[index];
    const noteElement = container.children[index];

    noteElement.innerHTML = `
        <input type="text" id="edit-title-${type}-${index}" value="${note.title}">
        <textarea id="edit-content-${type}-${index}">${note.content}</textarea>
        <small>Created at: ${note.timestamp}</small>
        ${note.reminder ? `<br><small>Reminder set for: ${note.reminder}</small>` : ''}
        <button id="done-${type}-${index}">Done</button>
        <button id="cancel-${type}-${index}">Cancel</button>
    `;

    // Add event listener to the done button
    const doneButton = document.getElementById(`done-${type}-${index}`);
    doneButton.addEventListener("click", () => {
        const newTitle = document.getElementById(`edit-title-${type}-${index}`).value;
        const newContent = document.getElementById(`edit-content-${type}-${index}`).value;
        note.title = newTitle;
        note.content = newContent;
        note.lastEditTime = new Date().toLocaleString();
        if (type === 'note') {
            displayNotes();
        } else {
            displayReminders();
        }
    });

    // Add event listener to the cancel button
    const cancelButton = document.getElementById(`cancel-${type}-${index}`);
    cancelButton.addEventListener("click", () => {
        if (type === 'note') {
            displayNotes();
        } else {
            displayReminders();
        }
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
            <button id="toggle-done-detail">${note.done ? 'Undone' : 'Done'}</button>
            <button id="reschedule-detail">Reschedule</button>
        `;
    }

    modalBody.innerHTML = `
        <h2>${note.title}</h2>
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

    // Add event listeners to buttons
    document.getElementById('edit-detail').addEventListener('click', () => {
        editNote(index, type);
        modal.style.display = 'none';
    });

    document.getElementById('delete-detail').addEventListener('click', () => {
        if (type === 'note') {
            notes.splice(index, 1);
            displayNotes();
        } else {
            reminders.splice(index, 1);
            displayReminders();
        }
        modal.style.display = 'none';
    });

    if (type === 'reminder') {
        document.getElementById('toggle-done-detail').addEventListener('click', () => {
            note.done = !note.done;
            if (note.done) {
                note.missed = false;
            }
            displayReminders();
            checkReminders();
            modal.style.display = 'none';
        });

        document.getElementById('reschedule-detail').addEventListener('click', () => {
            const newDatetime = prompt('Enter new reminder date and time:', note.reminder);
            if (newDatetime) {
                note.reminder = newDatetime;
                note.lastEditTime = new Date().toLocaleString();
                note.alertedDay = false;
                note.alertedTime = false;
                note.missed = false;
                displayReminders();
                checkReminders();
            }
            modal.style.display = 'none';
        });
    }
}

function checkReminders() {
    const now = new Date();
    const today = now.toDateString(); // e.g., "Fri Dec 20 2025"

    reminders.forEach((reminder) => {
        if (!reminder.reminder || reminder.done) return;

        try {
            const reminderDate = new Date(reminder.reminder);
            if (isNaN(reminderDate.getTime())) return; // Invalid date

            const reminderDay = reminderDate.toDateString();
            const reminderTime = reminderDate.getTime();

            // Check if it's the day of the reminder
            if (!reminder.alertedDay && reminderDay === today) {
                alert(`Reminder for today: ${reminder.title}`);
                reminder.alertedDay = true;
            }

            // Check if it's the specific time (within 1 minute)
            if (!reminder.alertedTime && Math.abs(now.getTime() - reminderTime) < 60000) {
                alert(`Reminder time: ${reminder.title}`);
                reminder.alertedTime = true;
            }

            // Check if missed
            if (!reminder.missed && now.getTime() > reminderTime + 60000) { // Past by more than 1 minute
                reminder.missed = true;
                alert(`Missed reminder: ${reminder.title}`);
                displayReminders(); // Update display
            }
        } catch (error) {
            console.error('Error checking reminder:', error);
        }
    });
}
