//initialize variables and storage
console.log("Script loaded");
let records = [];   // data storage
let record_books = [];     // lists of books
let record_borrowers = []; // lists of valid borrowers
let editIndex = -1; // -1 means no record is being edited, also used to store index while editing
let booksToAdd = []; // temporary storage for books to be added to a record
let bookIdCounter = 0;  // for books to have a fixed number for book IDs
let recordViewMode = "table";   //toggle view between table and card

//create book and borrower objects
class Book {
    constructor(name, id, author, year) {
        this.name = name;
        this.id = id;
        this.author = author;
        this.year = year;
        this.isAvailable = true; // to avoid same book from being borrowed simultaneously
    }
    displayInfo() {
        return `${this.name} by ${this.author} (${this.year}) - ID: ${this.id}`;
    }
}

class Borrower {
    constructor(name, serial) {
        this.name = name;
        this.serial = serial;
    }
    displayInfo() {
        return `${this.name} (Serial: ${this.serial})`;
    }
}

class Record {
    constructor(borrower, books, borrowedDate, returnDate, status = "borrowed") {
        this.borrower = borrower;
        this.books = books;
        this.borrowedDate = borrowedDate;
        this.returnDate = returnDate;
        this.status = status; // possible values: borrowed, returned, overdue
    }
    displayInfo() {
        // Collect book names and IDs
        const bookNames = this.books.map(book => book.name).join(", ");
        const bookIds = this.books.map(book => book.id).join(", ");

        // Return a formatted string
        return `${this.borrower.displayInfo()} borrows [${bookNames}] (IDs: ${bookIds}) on ${this.borrowedDate}, expected return by ${this.returnDate}, status: ${this.status}.`;
    }
}

//create references to HTML elements
const recordForm = document.getElementById("recordForm");           //to get the inputs from the form
const table = document.getElementById("record_table");
const tableHead = document.querySelector("#record_table thead");    //to create the table header
const tableBody = document.querySelector("#record_table tbody");    //to create the table body
const totalReports = document.getElementById("totalsTableBody");    //to create the totals and reports table body
const dataHead = document.querySelector("#dataTable thead");        //to create the table header
const dataBody = document.querySelector("#dataTable tbody");    //to create the table body
const dataReports = document.getElementById("dataTableBody");      //to create the data and reports table body
const search = document.getElementById("search");                   //to get the search input
const createRecord = document.getElementById("createOrEdit");       //to change the legend text from create to edit and vice versa
const displaySection = document.getElementById("displaySectionLegend"); //to change the legend text from display books or borrowers and vice versa
const cardContainer = document.getElementById("cardContainer");

//inilialize some books and borrowers
record_books.push(new Book("The Barometz", "TB-1482", "Jean Pessante", "1428"));
record_books.push(new Book("The Canterbury Tales", "TC-1387", "Geoffrey Chaucer", "1387"));
record_books.push(new Book("The Prince", "TP-1532", "Niccolò Machiavelli", "1532"));
record_books.push(new Book("Utopia", "UT-1516", "Thomas More", "1516"));
record_books.push(new Book("Gargantua and Pantagruel", "GP-1532", "François Rabelais", "1532"));

record_borrowers.push(new Borrower("Alice Johnson", "STU-001"));
record_borrowers.push(new Borrower("Bob Smith", "STU-002"));
record_borrowers.push(new Borrower("Charlie Brown", "STU-003"));

//function to run to print tables and initial datas
displayRecords();
updateBorrowerList();
updateBookList();
updateTotalsAndReports();
displayAllBooks();



/* Functions handling creation and storage of books and borrowers */
//create ids for books and borrowers
function generateTwoLetterString(title) {
    // Trim and split title into words
    const words = title.trim().split(/\s+/);

    let idPart = "";

    if (words.length === 1) {
        // If one word → take first two letters
        idPart = words[0].substring(0, 2).toUpperCase();
    } else {
        // If multiple words → take first letter of first two words
        idPart = (words[0][0] + words[1][0]).toUpperCase();
    }

    return idPart;
}
function generateBookId(title) {
    //increment bookIdCounter before putting it to count
    const count = ++bookIdCounter;

    //pad using leading zeroes to make the number a 4 digit one
    const padded = String(count).padStart(4, "0");

    //return the id with the 2 Letter String based on the title
    const newID = `${generateTwoLetterString(title)}-${padded}`
    console.log(`Generated Book's ID: ${newID}`);
    return newID;
}
function generateBorrowerId() {
    //create a list of used ids(only the number part)
    const usedIds = record_borrowers
        .map(b => parseInt(b.serial.split("-")[1]))
        .filter(num => !isNaN(num))
        .sort((a, b) => a - b);

    // Find the smallest missing number
    let newIdNum = 1;
    for (let i = 0; i < usedIds.length; i++) {
        if (usedIds[i] !== newIdNum) break; // Found a gap
        newIdNum++;
    }

    // Pad with leading zeros (e.g., 1 → 001, 12 → 012)
    const padded = String(newIdNum).padStart(3, "0");

    // Return formatted ID
    console.log(`Generated Borrower's ID: STU-${padded}`);
    return `STU-${padded}`;
}
//creates a book for the records
document.getElementById("addNewBookButton").addEventListener("click", createNewBook);
function createNewBook() {
    console.log("Adding New Book");

    //take the inputs
    const bookName = document.getElementById("newBookName").value.trim();
    const bookAuthor = document.getElementById("newBookAuthor").value.trim();
    const bookYear = document.getElementById("newBookYear").value.trim();

    // Validate input
    if (!bookName || !bookAuthor || !bookYear) {
        alert("Please fill in all book fields.");
        console.log("Adding Failed: Invalid Inputs");
        return;
    }

    // Check for duplicate book names
    const duplicate = record_books.some(b => b.name.toLowerCase() === bookName.toLowerCase());
    if (duplicate) {
        alert("This book already exists in the records.");
        console.log("Adding Failed: Book Name Already Exists");
        return;
    }

    // Validate if year is a number
    if (isNaN(bookYear) || bookYear < 0) {
        alert("Please enter a valid year.");
        console.log("Adding Failed: Invalid Year");
        return;
    }

    // Create book and add to list
    const newBook = new Book(bookName, generateBookId(bookName), bookAuthor, bookYear);
    record_books.push(newBook);
    alert(`Book "${bookName}" added successfully!`);
    console.log(`Book Added Successfully: ${newBook.displayInfo()}`);

    // clear input fields for next use
    document.getElementById("newBookName").value = "";
    document.getElementById("newBookAuthor").value = "";
    document.getElementById("newBookYear").value = "";

    //update bookdisplay and totals and reports
    displayAllBooks();
    updateTotalsAndReports();
    updateBookList();
}
//creates a borrower for the records
document.getElementById("addNewBorrowerButton").addEventListener("click", createNewBorrower);
function createNewBorrower() {
    console.log(`Signing Up a New Borrower`);

    //get the borrower name
    const borrowerName = document.getElementById("newBorrowerName").value.trim();

    // Validate input
    if (!borrowerName) {
        alert("Please enter the borrower's name.");
        console.log(`Sign Up Failed: Invalid Input`);
        return;
    }

    // Check for duplicate borrower names
    const duplicate = record_borrowers.some(b => b.name.toLowerCase() === borrowerName.toLowerCase());
    if (duplicate) {
        alert("This borrower already exists.");
        console.log(`Sign Up Failed: Borrower Name already exists`);
        return;
    }

    //create borrower and add to borrower list
    const newBorrower = new Borrower(borrowerName, generateBorrowerId());
    record_borrowers.push(newBorrower);
    alert(`Borrower "${borrowerName}" added successfully!`);
    console.log(`Sign Up Success: ${newBorrower.displayInfo()}`);

    // Clear input field
    document.getElementById("newBorrowerName").value = "";

    // Update Borrower display and totals and reports
    displayAllBorrowers();
    updateTotalsAndReports();
    updateBorrowerList();
}
//displays all books and borrowers in the data section
document.getElementById("displayBooks").addEventListener("click", displayAllBooks);
function displayAllBooks() {
    console.log(`Displaying All Books`);

    //reset data in the data table and change legend to Display Books
    dataHead.innerHTML = "";
    dataBody.innerHTML = "";
    displaySection.innerHTML = "<h2>Display Books</h2>";

    //create and display the table header
    const header_row = `
    <tr>
        <th style="width:5%;">#</th>
        <th style="width:12%;">Book Title</th>
        <th style="width:15%;">Book ID</th>
        <th style="width:20%;">Author</th>
        <th style="width:12%;">Year</th>
        <th style="width:10%;">Status</th>
        <th style="width:12%;">Actions</th>
    </tr>`;
    dataHead.insertAdjacentHTML("beforeend", header_row);

    // Sort books alphabetically by name
    record_books.sort((a, b) => a.name.localeCompare(b.name));

    //create the table body
    record_books.forEach((book, i) => {
        //make status green if the book is available
        let statusColor = "";
        if (!book.isAvailable) { statusColor = ' style="color: green; font-weight: bold;"' };

        //create row for each book
        const row = `
            <tr>
                <td>${i + 1}</td>
                <td>${book.name}</td>
                <td>${book.id}</td>
                <td>${book.author}</td>
                <td>${book.year}</td>
                <td${statusColor}>${book.isAvailable ? "Available" : "Borrowed"}</td>
                <td>
                    <button onclick="deleteBookRecord(${i})">Delete</button>
                </td>
            </tr>`;

        //insert in the table
        dataBody.insertAdjacentHTML("beforeend", row);

        console.log(`${i + 1}: ${book.displayInfo()}`);
    });

    //make sure atleast there are 5 rows -> empty rows are filled with >— Empty —<
    const minRows = 5;
    const emptyRows = minRows - record_books.length;
    for (let i = 0; i < emptyRows; i++) {
        const row = `
            <tr>
                <td>${record_books.length + i + 1}</td>
                <td colspan="8" style="height: 40px; text-align: center; color: #aaa;">— Empty —</td>
            </tr>`;
        dataBody.insertAdjacentHTML("beforeend", row);
    }
}
document.getElementById("displayBorrowers").addEventListener("click", displayAllBorrowers);
function displayAllBorrowers() {
    console.log(`Display all Borrowers`);

    //remove old data from the table
    dataHead.innerHTML = "";
    dataBody.innerHTML = "";
    //change the legend to Display borrowers
    displaySection.innerHTML = "<h2>Display Borrowers</h2>";

    //create the table header
    const header_row = `
    <tr>
        <th style="width:5%;">#</th>
        <th style="width:15%;">Borrower Serial ID</th>
        <th style="width:12%;">Borrower Name</th>
        <th style="width:10%;">Status</th>
        <th style="width:12%;">Actions</th>
    </tr>`;
    //insert the table header
    dataHead.insertAdjacentHTML("beforeend", header_row);

    //sort the borrowers by their serial
    record_borrowers.sort((a, b) => {
        // Extract the numeric part from IDs like "STUDENT-001"
        const numA = parseInt(a.serial.split("-")[1]);
        const numB = parseInt(b.serial.split("-")[1]);
        return numA - numB;
    });

    //create the table body
    record_borrowers.forEach((borrower, i) => {
        // Check if the borrower has any books that are NOT available
        const isBorrowing = borrowerHasActiveRecord(borrower);


        // Set color and text based on borrowing status
        let statusColor = "";
        if (isBorrowing) {
            statusColor = ' style="color: red; font-weight: bold;"';
        } else {
            statusColor = ' style="color: green; font-weight: bold;"';
        }

        //create each row
        const row = `
        <tr>
            <td>${i + 1}</td>
            <td>${borrower.serial}</td>
            <td>${borrower.name}</td>
            <td${statusColor}>${isBorrowing ? "Borrowing" : "Available"}</td>
            <td>
                <button onclick="deleteBorrowerRecord(${i})">Delete</button>
            </td>
        </tr>`;

        //insert these rows to the table
        dataBody.insertAdjacentHTML("beforeend", row);

        console.log(`${i + 1}: ${borrower.displayInfo()}`);
    });

    //make sure atleast there are 5 rows -> empty ones are filled with empty
    const minRows = 5;
    const emptyRows = minRows - record_borrowers.length;
    for (let i = 0; i < emptyRows; i++) {
        const row = `
            <tr>
                <td>${record_borrowers.length + i + 1}</td>
                <td colspan="8" style="height: 40px; text-align: center; color: #aaa;">— Empty —</td>
            </tr>`;
        dataBody.insertAdjacentHTML("beforeend", row);
    }
}
//delete functions for books and borrowers
function deleteBookRecord(index) {
    console.log(`Deleting a Book from Records: ${record_books[index].displayInfo()}`);

    //checks if the book to be deleted is still being borrowed
    if (record_books[index].isAvailable === false) {
        alert("This book is currently borrowed and cannot be deleted.");
        console.log(`Deletion Failed: Book is currently borrowed`);
        return;
    }

    //confirm deletin of book
    if (confirm("Are you sure you want to delete this book?")) {
        record_books.splice(index, 1);

        //update records and displays
        console.log(`Deletion Success`);
        displayAllBooks();
        updateTotalsAndReports();
        updateBookList();
        alert("Book deleted successfully.");
        return;
    }
    console.log(`Deletion Cancelled`);
}
function deleteBorrowerRecord(index) {
    console.log(`Deleting Borrower from Records: ${record_borrowers[index].displayInfo()}`);

    //checks if borrower is currently borrowing books
    if (borrowerHasActiveRecord(record_borrowers[index])) {
        alert("This borrower currently has borrowed books and cannot be deleted.");
        console.log(`Deletion Failed: Borrower is currently borrowing a book`);
        return;
    }

    //confirm borrower deletion
    if (confirm("Are you sure you want to delete this borrower?")) {
        record_borrowers.splice(index, 1);

        //update total and displays
        console.log(`Deletion Success`);
        displayAllBorrowers();
        updateTotalsAndReports();
        updateBorrowerList();
        alert("Borrower deleted successfully.");
        return;
    }
    console.log(`Deletion Cancelled`);
}
//checks if borrower is on records, return the reference if it does
function borrowerOnRecord(borrower) {
    return records.find(r => r.borrower.serial === borrower.serial);
}
//checks if borrower had borrowed books and hasn't returned it
function borrowerHasActiveRecord(borrower) {
    return records.some(r =>
        r.borrower.serial === borrower.serial &&
        r.status !== "returned"
    );
}



/* Functions handling adding books to be submitted in the forms */
//functions for book addition and removal in the create record form
document.getElementById("addBookButton").addEventListener("click", addBook);
function addBook() {
    console.log(`Adding Book to the temporary lists`);
    //take the book input and trim it
    const inputValue = document.getElementById("bookInput").value.trim();

    // Find the book object by name or ID
    const foundBook = record_books.find(b => b.id === inputValue || b.name.toLowerCase() === inputValue.toLowerCase());

    //if book not found, return
    if (!foundBook) {
        alert("Book not found in the records!");
        document.getElementById("bookInput").value = "";
        console.log(`Adding Failed: book not found`);
        return;
    }

    //if book is currently being borrowed, return
    if (!foundBook.isAvailable) {
        alert("This book is currently unavailable.");
        document.getElementById("bookInput").value = "";
        console.log(`Adding Failed: Book is being borrowed`);
        return;
    }

    //add book to the temporary list
    booksToAdd.push(foundBook);
    console.log(`Adding Success: ${foundBook.displayInfo()}`);
    displayAddedBooks();

    // Mark the book as unavailable
    foundBook.isAvailable = false;

    // Clear the input field after adding the book
    document.getElementById("bookInput").value = "";
}
//delete book from the temporary list
function deleteAddedBook(index) {
    console.log(`Delete Book to the temporary lists: ${booksToAdd[index].displayInfo()}`);

    // Mark the book as available again
    booksToAdd[index].isAvailable = true;

    //delete it to the list
    booksToAdd.splice(index, 1);
    displayAddedBooks();
}
//reset the temporary list
function resetSelectedBooks(istrue = true) {
    if (istrue === true) {
        // Mark all books as available again
        booksToAdd.forEach(book => book.isAvailable = true);
    }

    //clear temporary list and display
    booksToAdd = [];
    displayAddedBooks();
}
//display the temporary list in the form
function displayAddedBooks() {
    console.log(`Displaying the temporary lists`);

    //get the table where the list is to be displayed
    const bookTitles = document.getElementById("selectedBooksList");
    bookTitles.innerHTML = ""; // Clear previous entries

    //display each book
    booksToAdd.forEach((r, i) => {
        const row = `
            <tr>
                <td>${i + 1}</td>
                <td>${r.id}</td>
                <td>${r.name}</td>
                <td>${r.author}</td>
                <td>${r.year}</td>
                <td>
                    <button onclick="deleteAddedBook(${i})">Delete</button>
                </td>
            </tr>`;
        bookTitles.insertAdjacentHTML("beforeend", row);
        console.log(`${i + 1}: ${r.displayInfo()}`);
    });
}



/*functions that handles display,  creation and edition of records*/
//for toggle view
function toggleRecordView() {
    if (recordViewMode === "table") {
        recordViewMode = "card";
        document.getElementById("toggleViewBtn").textContent = "Switch to Table View";
        console.log("Toggle view to Card mode");
    } else {
        recordViewMode = "table";
        document.getElementById("toggleViewBtn").textContent = "Switch to Card View";
        console.log("Toggle view to Table mode");
    }
    displayRecords(); // re-render based on mode
}
//displays the records in the table
function displayRecords(group = records) {
    console.log(`Displaying Record list`);

    //clear the table
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";
    cardContainer.innerHTML = "";

    //TABLE MODE
    if (recordViewMode === "table") {
        // Show table, hide cards
        table.style.display = "table";
        cardContainer.style.display = "none";

        // Table header
        const header_row = `
        <tr>
            <th>#</th>
            <th>Serial Number</th>
            <th>Name</th>
            <th>Book/s Borrowed</th>
            <th>Book/s ID</th>
            <th>Borrowed Date</th>
            <th>Return Date</th>
            <th>Status</th>
            <th>Actions</th>
        </tr>`;
        tableHead.insertAdjacentHTML("beforeend", header_row);

        // Table rows
        group.forEach((r, i) => {
            const bookTitles = r.books.map(b => b.name).join(", ");
            const bookIds = r.books.map(b => b.id).join(", ");
            let statusColor = "";
            if (r.status.toLowerCase() === "overdue") statusColor = ' style="color: red; font-weight: bold;"';
            else if (r.status.toLowerCase() === "returned") statusColor = ' style="color: green; font-weight: bold;"';

            const row = `
                <tr>
                    <td>${i + 1}</td>
                    <td>${r.borrower.serial}</td>
                    <td>${r.borrower.name}</td>
                    <td>${bookTitles}</td>
                    <td>${bookIds}</td>
                    <td>${r.borrowedDate}</td>
                    <td>${r.returnDate}</td>
                    <td${statusColor}>${r.status}</td>
                    <td>
                        <button onclick="editRecord(${i})">Edit</button>
                        <button onclick="deleteRecord(${i})">Delete</button>
                    </td>
                </tr>`;
            tableBody.insertAdjacentHTML("beforeend", row);
        });

        //make sure theres atleast 5 rows
        const minRows = 5;
        const emptyRows = minRows - group.length;
        for (let i = 0; i < emptyRows; i++) {
            const row = `
                <tr>
                    <td>${group.length + i + 1}</td>
                    <td colspan="8" style="height: 40px; text-align: center; color: #aaa;">— Empty —</td> 
                </tr>`;
            tableBody.insertAdjacentHTML("beforeend", row);
        }
    }

    //CARD VIEW MODE
    else {
        //add styles for card view and put none to the table
        table.style.display = "none";
        cardContainer.style.display = "grid";
        cardContainer.style.gridTemplateColumns = "repeat(auto-fill, minmax(250px, 1fr))";
        cardContainer.style.gap = "1rem";

        //if there's no records yet
        if (group.length === 0) {
            const emptyCard = `
                <div class="record-card" style="
                    border: 1px dashed #ccc; 
                    border-radius: 8px; 
                    padding: 20px; 
                    text-align: center;
                    color: #aaa;
                    font-style: italic;
                ">
                    — No Records Found —
                </div>`;
            cardContainer.insertAdjacentHTML("beforeend", emptyCard);

        } else {
            group.forEach((r, i) => {
                const bookTitles = r.books.map(b => b.name).join(", ");
                const bookIds = r.books.map(b => b.id).join(", ");

                //what to add to the div for every record
                const card = `
            <div class="record-card" style="
                border: 1px solid #ccc; 
                border-radius: 8px; 
                padding: 12px; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">
                <h3>${r.borrower.name}</h3>
                <p><b>Serial:</b> ${r.borrower.serial}</p>
                <p><b>Books:</b> ${bookTitles}</p>
                <p><b>Book IDs:</b> ${bookIds}</p>
                <p><b>Borrowed:</b> ${r.borrowedDate}</p>
                <p><b>Return:</b> ${r.returnDate}</p>
                <p><b>Status:</b> <span style="font-weight:bold; color:${r.status.toLowerCase() === "overdue"
                        ? "red"
                        : r.status.toLowerCase() === "returned"
                            ? "green"
                            : "black"
                    }">${r.status}</span></p>
                <div style="margin-top:10px;">
                    <button onclick="editRecord(${i})">Edit</button>
                    <button onclick="deleteRecord(${i})">Delete</button>
                </div>
            </div>`;
                cardContainer.insertAdjacentHTML("beforeend", card);
            });
        }
    }
}
//handle form submission
document.getElementById("recordForm").addEventListener("submit", function (event) {
    event.preventDefault();
    submitForm();
});
function submitForm() {
    console.log("Form submitted...");

    //create date variables
    const borrowed = new Date(document.getElementById("borrowedDate").value);
    const returned = new Date(document.getElementById("returnDate").value);

    //to handle wrong inputs
    if (booksToAdd.length === 0) {
        console.log("Submition Failed: No books selected");
        alert("Please add at least one book to borrow.");
        return;
    }
    if (returned <= borrowed) {
        console.log("Submition Failed: Invalid date range");
        alert("Expected return date must be after the borrowed date!");
        return;
    }

    //add a new record, or update an old one
    if (editIndex === -1) {
        if (addRecord() === -1) {
            resetSelectedBooks();
            return;
        } //if addRecord fails, do not proceed
    } else {
        if (updateRecord() === -1) {
            return;
        }
    }

    //update live search list
    updateLiveSearchList();
    recordForm.reset();   //reset bar for next use
}
//adds a new record to the records array
function addRecord() {
    console.log("Adding new record...");

    //change legend to create a record
    createRecord.innerHTML = "<h2>Create a Record</h2>";

    //take name for the borrower and find them in the borrowers list
    const inputValue = document.getElementById("borrowerInput").value.trim();
    let foundBorrower = record_borrowers.find(
        b => b.serial === inputValue || b.name.toLowerCase() === inputValue.toLowerCase()
    );

    // If borrower not found
    if (!foundBorrower) {
        console.log("Adding Halted...")

        //create one if needed
        if (confirm("Borrower not found in the records! Do you want to add a new borrower?")) {
            console.log("Adding... Signing Up a new Borrower")
            const borrowerName = document.getElementById("borrowerInput").value;

            //if borrower name given is empty
            if (!borrowerName) {
                console.log("Sign Up Failed: Invalid Name")
                console.log("Adding Failed: Borrower Invalid")
                alert("Borrower name cannot be empty!");
                return -1;
            }

            const newBorrower = new Borrower(borrowerName, generateBorrowerId());
            record_borrowers.push(newBorrower);
            console.log(`Sign Up Success: ${newBorrower.displayInfo()}`)
            foundBorrower = newBorrower;
            alert(`New borrower added: ${borrowerName}`);
            displayAllBorrowers();
            updateTotalsAndReports();
            updateBorrowerList();
        }

        //restart if not
        else {
            alert("Please enter a valid borrower.");
            console.log("Adding Failed: Borrower Invalid")
            return -1;
        }
    }

    //check if the borrower has some books overdue, dont let them borrow if they have one
    const hasOverdue = records.some(r =>
        r.borrower.serial === foundBorrower.serial && r.status.toLowerCase() === "overdue"
    );
    if (hasOverdue) {
        alert("This borrower has overdue books and cannot borrow new ones until they are returned.");
        console.log("Adding Failed: Borrower has some Overdue books")
        return;
    }

    // If no books selected
    if (booksToAdd.length === 0) {
        alert("Please add at least one book to the record!");
        console.log("Adding Failed: Invalid number of Books to Borrow")
        return -1;
    }

    // Create the record
    const record = new Record(
        foundBorrower,      // borrower object
        booksToAdd,         // list of books
        document.getElementById("borrowedDate").value,  // borrowed date
        document.getElementById("returnDate").value,    // expected return date
        document.querySelector('input[name="status"]:checked').value
    );

    console.log(`Record Created: ${record.displayInfo()}`);
    records.push(record);
    displayRecords();
    resetSelectedBooks(false);
    updateTotalsAndReports();
    displayAllBooks();
    return 1;
}
//gets the values from the selected record and fills the form for editing
function editRecord(index) {

    //change legend to edit a record
    createRecord.innerHTML = "<h2>Edit a Record</h2>";

    // Copy existing books to the temporary list
    resetSelectedBooks();
    booksToAdd = [...records[index].books];
    console.log("Getting values to be put in forms for editing...");

    //put values from that record into the inputs within the form
    const r = records[index];
    document.getElementById("borrowerInput").value = r.borrower.name;
    document.getElementById("borrowedDate").value = r.borrowedDate;
    document.getElementById("returnDate").value = r.returnDate;
    const statusRadios = document.querySelectorAll('input[name="status"]');
    statusRadios.forEach(radio => {
        radio.checked = (radio.value === r.status);
    });

    //place index to editIndex so we can differentiate if we are editing or adding
    editIndex = index;
    displayAddedBooks();
    console.log("...Values set, you can now edit the record.");
}
//updates a record from the edited one
function updateRecord() {
    console.log("Updating a record...");
    const r = records[editIndex];

    // If no books selected
    if (booksToAdd.length === 0) {
        alert("Please add at least one book to the record!");
        return -1;
    }

    //if changing borrower
    if (r.borrower !== document.getElementById("borrowerInput").value) {
        const inputValue = document.getElementById("borrowerInput").value.trim();
        let foundBorrower = record_borrowers.find(
            b => b.serial === inputValue || b.name.toLowerCase() === inputValue.toLowerCase()
        );

        // If borrower not found create a new borrower object
        if (!foundBorrower) {
            console.log(`Editing halted...`);
            if (confirm("Borrower not found in the records! Do you want to add a new borrower?")) {
                const borrowerName = document.getElementById("borrowerInput").value;
                console.log(`Signing Up a new Borrower`);

                if (!borrowerName) {
                    alert("Borrower name cannot be empty!");
                    console.log("Sign Up Failed: Invalid Name")
                    console.log("Editing Failed: Borrower Invalid")
                    return -1;
                }

                const newBorrower = new Borrower(borrowerName, generateBorrowerId());
                record_borrowers.push(newBorrower);
                console.log(`Sign Up Success: ${newBorrower.displayInfo()}`)
                foundBorrower = newBorrower;
                alert(`New borrower added: ${borrowerName}`);
                displayAllBorrowers();
                updateTotalsAndReports();
                updateBorrowerList();
            } else {
                alert("Please enter a valid borrower.");
                console.log("Editing Failed: Borrower Invalid")
                return -1;
            }
        }
        r.borrower = foundBorrower; // Change to the new borrower
    }

    //place values back to the record
    r.books = [...booksToAdd];
    r.borrowedDate = document.getElementById("borrowedDate").value;
    r.returnDate = document.getElementById("returnDate").value;
    if (document.querySelector('input[name="status"]:checked').value === "returned") {
        r.books.forEach(book => book.isAvailable = true);
    }
    else {
        r.books.forEach(book => book.isAvailable = false);
    }
    r.status = document.querySelector('input[name="status"]:checked').value;

    //bring editIndex to -1
    editIndex = -1;
    console.log(`Edit Success: ${r.displayInfo()}`);
    displayRecords();
    resetSelectedBooks(false);
    displayAddedBooks();
    updateTotalsAndReports();
    displayAllBooks();
}
//deletes a record from the records array
function deleteRecord(index) {
    console.log(`Deleting Index...`);

    //to avoid deleting currently edited record so they dont get stuck
    if (editIndex !== -1) {
        alert("Please finish editing the current record before deleting another.");
        console.log(`Deleting Failed: Editing in Progress`);
        return;
    }

    if (confirm("Are you sure you want to delete this record?")) {
        console.log(`Delete Success: ${records[index].displayInfo()} deleted`);
        // Mark all books in the record as available again
        records[index].books.forEach(book => book.isAvailable = true);
        records.splice(index, 1);
        displayRecords();
        displayAllBorrowers();
        updateTotalsAndReports();
    }
}



/* Functions handling searching and sorting of records*/
//for autocomplete search functionality
function updateLiveSearchList() {
    console.log("Update Live Search list");

    //clear previous options
    const searchList = document.getElementById("searchList");
    searchList.innerHTML = "";

    const seen = new Set();

    records.forEach((r, i) => {
        // Pick the fields you want to include in autocomplete
        const fields = [r.borrower.serial, r.borrower.name, ...r.books.map(b => b.name), ...r.books.map(b => b.id), r.status];

        fields.forEach(field => {
            if (field && !seen.has(field)) {
                const option = document.createElement("option");
                option.value = field;
                searchList.appendChild(option);
                seen.add(field);
            }
        });
        console.log(`${i + 1}: ${fields}`);
    });
}
//functions for updating borrower and book datalists for autocomplete
function updateBorrowerList() {
    console.log("Update Borrower list");

    //clear previous options
    const borrowerList = document.getElementById("borrowerList");
    borrowerList.innerHTML = ""; // Clear previous options

    const seen = new Set();

    record_borrowers.forEach((r, i) => {
        // Pick the fields you want to include in autocomplete
        const fields = [r.serial, r.name];

        fields.forEach(field => {
            if (field && !seen.has(field)) {
                const option = document.createElement("option");
                option.value = field;
                borrowerList.appendChild(option);
                seen.add(field);
            }
        });
        console.log(`${i + 1}: ${r.displayInfo()}`);

    });
}
function updateBookList() {
    console.log("Update Book list");

    //clear previous options
    const bookList = document.getElementById("bookList");
    bookList.innerHTML = ""; // Clear previous options

    const seen = new Set();

    record_books.forEach((r, i) => {
        // Pick the fields you want to include in autocomplete
        const fields = [r.id, r.name];

        fields.forEach(field => {
            if (field && !seen.has(field)) {
                const option = document.createElement("option");
                option.value = field;
                bookList.appendChild(option);
                seen.add(field);
            }
        });
        console.log(`${i + 1}: ${fields}`);
    });
}
//filters the records based on search input and selected category and order
document.getElementById("searchInput").addEventListener("input", filterRecords);
function filterRecords() {
    console.log("Filtering records...");

    //get inputs from search inputs
    const query = document.getElementById("searchInput").value.toLowerCase();
    const field = document.getElementById("searchCategory").value;
    const order = document.getElementById("dataOrder").value;

    // Filter by name, book, or bookId
    const filtered = records.filter(r =>
        r.borrower.serial.toLowerCase().includes(query) ||
        r.borrower.name.toLowerCase().includes(query) ||
        r.status.toLowerCase().includes(query) ||
        r.books.some(book =>
            book.name.toLowerCase().includes(query) ||
            book.id.toLowerCase().includes(query)
        )

    );

    //sort items based on field given 
    filtered.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];

        //sort based on borrowers
        if (field === "name" || field === "serial") {
            valA = a.borrower[field];
            valB = b.borrower[field];
        }

        //sort based on date
        else if (field === "borrowedDate" || field === "returneDate") {
            valA = new Date(valA);
            valB = new Date(valB);
        }

        //sort based on status
        else if (field === "status") {
            const statusOrder = { "overdue": 1, "borrowed": 2, "returned": 3 };
            valA = statusOrder[valA] || 0;
            valB = statusOrder[valB] || 0;
        }

        else {
            // Convert to string for consistent comparison
            valA = valA.toString().toLowerCase();
            valB = valB.toString().toLowerCase();
        }

        //sort ascending or descending
        if (valA < valB) return order === "asc" ? -1 : 1;
        if (valA > valB) return order === "asc" ? 1 : -1;
        return 0;
    });

    console.log("Sorting record by", field, "in", order, "order...");
    console.log(`Filter Success`);
    displayFilteredRecords(filtered);
}
//displays the filtered records in the table
function displayFilteredRecords(filtered) {
    console.log("Displaying filtered records...");

    displayRecords(filtered);
}
//reset search and sorts, and also display all records
function resetSearch() {
    console.log("Resetting search");
    document.getElementById("searchInput").value = "";

    //sort originally using borrower serial
    records.sort((a, b) => {
        let valA = a.borrower.serial;
        let valB = b.borrower.serial;

        if (valA < valB) return -1;
        if (valA > valB) return 1;
    });

    displayRecords();
}



/* Handles quick action buttons */
//handles quick action
function deleteAllRecordsButton() {
    console.log(`Deleting All Records...`);
    if (confirm("Are you sure you want to delete ALL records? This action cannot be undone.")) {
        // Mark all books as available again
        records.forEach(r => {
            r.books.forEach(book => book.isAvailable = true);
        });

        // Clear all records
        records = [];
        displayRecords();
        console.log("All records deleted.");
        updateTotalsAndReports();
        return;
    }
    console.log(`Deletion Cancelled`);
}
function updateOverdue() {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    let updatedCount = 0;

    //change status if the date today > the expected return date AND if the status is still borrowed
    records.forEach(r => {
        if (r.status.toLowerCase() === "borrowed" && r.returnDate < today) {
            r.status = "overdue";
            updatedCount++;
        }
    });
    displayRecords();
    console.log("All overdue records updated. Total updated:", updatedCount);
    updateTotalsAndReports();

    console.log(`Records Updated today: status changes accordingly`);
}



/* Functions handling totals and reports */
//computes and displays totals and reports
function updateTotalsAndReports() {
    // Compute totals
    const totalRecords = records.length;
    let totalBooks = 0;
    let totalReturned = 0;
    let totalOverdue = 0;

    //count total books borrowed, and overdue
    records.forEach(r => {
        totalBooks += r.books.length; // count total books borrowed
        if (r.status.toLowerCase() === "returned") totalReturned++;
        if (r.status.toLowerCase() === "overdue") totalOverdue++;
    });

    // Build the summary row
    const total = `
        <tr>
            <td>${totalRecords}</td>
            <td>${totalBooks}</td>
            <td>${totalReturned}</td>
            <td>${totalOverdue}</td>
        </tr>`;

    // Insert into datatable tbody
    const totalReports = document.getElementById("totalsTableBody");
    totalReports.innerHTML = total;

    const data = `
        <tr>
            <td>${record_borrowers.length}</td>
            <td>${record_borrowers.filter(b => borrowerHasActiveRecord(b)).length}</td>
            <td>${record_books.length}</td>
            <td>${record_books.filter(b => b.isAvailable).length}</td>
        </tr>`;
    const dataReports = document.getElementById("dataTableBody");
    dataReports.innerHTML = data;
}

