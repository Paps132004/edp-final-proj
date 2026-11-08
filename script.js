
const STORAGE_KEY = "smashBurgerReservations";

const allowedDays = [1, 3, 5, 6];


const timeSlots = [
    { value: "10:00", label: "10:00 AM – 12:00 PM" },
    { value: "12:00", label: "12:00 PM – 2:00 PM" },
    { value: "14:00", label: "2:00 PM – 4:00 PM" },
    { value: "16:00", label: "4:00 PM – 6:00 PM" },
    { value: "18:00", label: "6:00 PM – 7:00 PM" }
];


const MAX_GROUPS = 2;
const MAX_GUESTS = 4;

const form = document.getElementById("reservationForm");
const customerName = document.getElementById("customerName");
const contact = document.getElementById("contact");
const bookingDate = document.getElementById("bookingDate");
const bookingTime = document.getElementById("bookingTime");
const guestCount = document.getElementById("guestCount");
const availability = document.getElementById("availability");
const message = document.getElementById("message");
const reserveButton = document.getElementById("reserveButton");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const reservationList = document.getElementById("reservationList");
const count = document.getElementById("count");
const clearSearch = document.getElementById("clearSearch");

let reservations = loadReservations();

function loadReservations() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

function saveReservations() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
}

function setMinimumDate() {
    const today = new Date();
    const localToday = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
    ).toISOString().split("T")[0];

    bookingDate.min = localToday;
}

setMinimumDate();

function isAllowedDay(dateString) {
    if (!dateString) return false;

    const date = new Date(dateString + "T12:00:00");
    return allowedDays.includes(date.getDay());
}

function getSlotCount(date, time) {
    return reservations.filter(reservation =>
        reservation.date === date &&
        reservation.time === time
    ).length;
}

function findSlot(time) {
    return timeSlots.find(slot => slot.value === time);
}

function updateTimeSlots() {
    const selectedDate = bookingDate.value;

    bookingTime.innerHTML = '<option value="">Select a time slot</option>';

    message.textContent = "";
    message.className = "";

    if (!selectedDate) {
        availability.textContent = "Select a date to check available slots.";
        availability.className = "availability";
        return;
    }

    if (!isAllowedDay(selectedDate)) {
        availability.textContent =
            "Reservations are only available on Monday, Wednesday, Friday, and Saturday.";

        availability.className = "availability full";
        return;
    }

    let availableSlots = 0;

    timeSlots.forEach(slot => {
        const bookedGroups = getSlotCount(selectedDate, slot.value);
        const remainingGroups = MAX_GROUPS - bookedGroups;

        const option = document.createElement("option");
        option.value = slot.value;

        if (remainingGroups <= 0) {
            option.textContent = slot.label + " - FULL";
            option.disabled = true;
        } else {
            option.textContent =
                slot.label + " - " + remainingGroups + " group(s) left";

            availableSlots++;
        }

        bookingTime.appendChild(option);
    });

    if (availableSlots === 0) {
        availability.textContent = "All time slots are fully booked.";
        availability.className = "availability full";
    } else {
        availability.textContent =
            availableSlots + " time slot(s) available. Maximum 2 groups per slot.";

        availability.className = "availability available";
    }
}

function isSlotAvailable(date, time) {
    return getSlotCount(date, time) < MAX_GROUPS;
}

function validateForm() {
    const name = customerName.value.trim();
    const phone = contact.value.trim();
    const date = bookingDate.value;
    const time = bookingTime.value;
    const guests = Number(guestCount.value);

    if (!name || !phone || !date || !time) {
        return "Please complete all reservation fields.";
    }

    if (!isAllowedDay(date)) {
        return "Please select an allowed reservation day.";
    }

    if (date < bookingDate.min) {
        return "You cannot reserve a past date.";
    }

    if (!findSlot(time)) {
        return "Please select a valid time slot.";
    }

    if (!/^[0-9+()\- ]{7,20}$/.test(phone)) {
        return "Please enter a valid contact number.";
    }

    if (!Number.isInteger(guests) || guests < 1 || guests > MAX_GUESTS) {
        return "A reservation must have between 1 and 4 guests.";
    }

    if (!isSlotAvailable(date, time)) {
        updateTimeSlots();
        return "Sorry! This time slot is already fully booked. Please choose another slot.";
    }

    return null;
}

function addReservation(event) {
    event.preventDefault();

    const error = validateForm();

    if (error) {
        message.textContent = error;
        message.className = "error";
        return;
    }

    const date = bookingDate.value;
    const time = bookingTime.value;

    if (!isSlotAvailable(date, time)) {
        updateTimeSlots();
        message.textContent = "This time slot is full. Please select another.";
        message.className = "error";
        return;
    }

    const reservation = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        code: "SB-" + Math.floor(100000 + Math.random() * 900000),
        name: customerName.value.trim(),
        contact: contact.value.trim(),
        date: date,
        time: time,
        guests: Number(guestCount.value)
    };

    reservations.push(reservation);
    saveReservations();

    message.textContent =
        "Reservation successful! Your booking code is " + reservation.code;

    message.className = "success";

    form.reset();
    guestCount.value = 1;

    updateTimeSlots();
    displayReservations();
}

function displayReservations() {
    reservationList.innerHTML = "";

    const search = searchInput.value.toLowerCase().trim();
    const filter = statusFilter.value;

    const filteredReservations = reservations.filter(reservation => {
        const matchesSearch =
            reservation.name.toLowerCase().includes(search) ||
            reservation.code.toLowerCase().includes(search);

        const matchesFilter = filter === "all" || filter === "active";

        return matchesSearch && matchesFilter;
    });

    count.textContent = filteredReservations.length;

    if (filteredReservations.length === 0) {
        reservationList.innerHTML = "<p>No reservations found.</p>";
        return;
    }

    filteredReservations.forEach(reservation => {
        const slot = findSlot(reservation.time);

        const card = document.createElement("div");
        card.className = "reservation-card";

        const details = document.createElement("div");

        const title = document.createElement("strong");
        title.textContent = reservation.name;

        const lines = [
            "Booking Code: " + reservation.code,
            "Contact: " + reservation.contact,
            "Date: " + reservation.date,
            "Time: " + (slot ? slot.label : reservation.time),
            "Guests: " + reservation.guests
        ];

        details.appendChild(title);

        lines.forEach(line => {
            const paragraph = document.createElement("p");
            paragraph.textContent = line;
            details.appendChild(paragraph);
        });

        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.className = "cancel";
        cancelButton.textContent = "Cancel Reservation";

        cancelButton.addEventListener("click", () => {
            cancelReservation(reservation.id);
        });

        card.appendChild(details);
        card.appendChild(cancelButton);

        reservationList.appendChild(card);
    });
}

function cancelReservation(id) {
    const confirmed = confirm("Are you sure you want to cancel this reservation?");

    if (!confirmed) return;

    reservations = reservations.filter(reservation => reservation.id !== id);

    saveReservations();
    displayReservations();
    updateTimeSlots();
}

form.addEventListener("submit", addReservation);

bookingDate.addEventListener("change", updateTimeSlots);

bookingTime.addEventListener("change", () => {
    const date = bookingDate.value;
    const time = bookingTime.value;

    if (date && time && !isSlotAvailable(date, time)) {
        updateTimeSlots();
        message.textContent = "This time slot is full. Please choose another.";
        message.className = "error";
    }
});

searchInput.addEventListener("input", displayReservations);
statusFilter.addEventListener("change", displayReservations);

clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    statusFilter.value = "all";
    displayReservations();
});

updateTimeSlots();
displayReservations();
