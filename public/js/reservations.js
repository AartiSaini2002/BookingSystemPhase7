import { initAuthUI, requireAuthOrBlockPage, logout } from "./auth-ui.js";

initAuthUI();

// 🔐 block page if not logged in
if (!requireAuthOrBlockPage()) {
  throw new Error("Not authenticated");
}

window.logout = logout;

const API = "/api/reservations";

const form = document.getElementById("reservationForm");
const listEl = document.getElementById("reservationList");

let selectedId = null;

// ==========================
// GET TOKEN
// ==========================
function getToken() {
  return localStorage.getItem("token");
}

// ==========================
// HEADERS (JWT)
// ==========================
function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + getToken()
  };
}

// ==========================
// GET FORM DATA
// ==========================
function getFormData() {
  return {
    resourceId: Number(document.getElementById("resourceId").value),
    userId: Number(document.getElementById("userId").value),
    startTime: document.getElementById("startTime").value,
    endTime: document.getElementById("endTime").value,
    note: document.getElementById("note").value,
    status: document.getElementById("status").value
  };
}


// ==========================
// CLEAR FORM
// ==========================
function clearForm() {
  form.reset();
  selectedId = null;

  // optional UX improvement
  document.getElementById("resourceId").focus();
}

// ==========================
// CREATE
// ==========================
async function createReservation() {
  if (selectedId) {
    alert("⚠️  Reservation already selected. Clear form first before creating new reservation");
    return;
  }

  const newRes = getFormData();

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(newRes)
    });

    const data = await res.json().catch(() => ({}));

    // ❌ ERROR HANDLING
    if (!res.ok) {
      alert(data.error || "❌ Create failed");
      return;
    }

    // ✅ SUCCESS MESSAGE (IMPORTANT)
    alert("✅ Reservation created successfully!");

    // 🔥 CLEAR FORM PROPERLY
    clearForm();

    // 🔄 reload list
    loadReservations();

  } catch (err) {
    console.error(err);
    alert("❌ Server error. Try again.");
  }
}

// ==========================
// UPDATE
// ==========================
async function updateReservation() {
  if (!selectedId) {
    alert("Select reservation first");
    return;
  }

  const res = await fetch(`${API}/${selectedId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(getFormData())
  });

  const data = await res.json().catch(() => ({}));

  if (res.ok) {
    alert("Reservation updated");
    loadReservations();
  } else {
    alert(data.error || "Update failed");
  }
}

// ==========================
// DELETE
// ==========================
async function deleteReservation() {
  if (!selectedId) {
    alert("Select reservation first");
    return;
  }

  const res = await fetch(`${API}/${selectedId}`, {
    method: "DELETE",
    headers: authHeaders()
  });

  if (res.status === 204) {
    alert("Reservation deleted");
    clearForm();
    loadReservations();
  } else {
    const data = await res.json().catch(() => ({}));
    alert(data.error || "Delete failed");
  }
}

// ==========================
// LOAD ALL
// ==========================
async function loadReservations() {
  const res = await fetch(API, {
    headers: authHeaders()
  });

  const body = await res.json();

  if (!body.ok) {
    alert("Failed to load reservations");
    return;
  }

  const data = body.data;

  listEl.innerHTML = "";

  data.forEach((r) => {
    const item = document.createElement("button");

    item.className =
      "w-full text-left p-3 border rounded-xl hover:bg-black/5";

    item.innerHTML = `
      <div class="font-semibold">ID: ${r.id}</div>
      <div class="text-xs text-black/60">
        ${r.resource_name || "Resource"} → ${r.user_email || "User"}
      </div>
      <div class="text-xs text-black/40">
        ${new Date(r.start_time).toLocaleString()} → ${new Date(r.end_time).toLocaleString()}
      </div>
    `;

    item.onclick = () => selectReservation(r);

    listEl.appendChild(item);
  });
}

// ==========================
// SELECT ITEM
// ==========================
function selectReservation(r) {
  selectedId = r.id;

  document.getElementById("resourceId").value = r.resource_id;
  document.getElementById("userId").value = r.user_id;

  document.getElementById("startTime").value =
    r.start_time ? r.start_time.slice(0, 16) : "";

  document.getElementById("endTime").value =
    r.end_time ? r.end_time.slice(0, 16) : "";

  document.getElementById("note").value = r.note || "";
  document.getElementById("status").value = r.status;
}

// ==========================
// BUTTON EVENTS
// ==========================
document.getElementById("createBtn").onclick = createReservation;
document.getElementById("updateBtn").onclick = updateReservation;
document.getElementById("deleteBtn").onclick = deleteReservation;
document.getElementById("clearBtn").onclick = clearForm;

// ==========================
// INIT
// ==========================
loadReservations();