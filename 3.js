// Elementos de la página (DOM)
const habitList      = document.getElementById("habitList");
const activityList   = document.getElementById("activityList");
const addHabitBtn    = document.getElementById("addHabitBtn");
const habitName      = document.getElementById("habitName");
const habitTime      = document.getElementById("habitTime");
const habitRepeat    = document.getElementById("habitRepeat"); // 🔁
const clock          = document.getElementById("clock");
const manualClock    = document.getElementById("manualClock");
const setClockBtn    = document.getElementById("setClockBtn");
const alarmSound     = document.getElementById("alarmSound");
const filterHistory  = document.getElementById("filterHistory"); // 📊

// Datos guardados
let habits      = JSON.parse(localStorage.getItem("habits")) || [];
let activities  = JSON.parse(localStorage.getItem("activities")) || [];
let currentHabit = null;

// Control de reloj y alarmas
let manualTime       = null;
let usingManualClock = false;
let alarmTimeout     = null;


/* ==================== FUNCIONES DE APOYO ==================== */

/** Devuelve la fecha y hora actual. Si el usuario configuró hora manual, devuelve esa. */

function getNow() {
  return usingManualClock && manualTime ? manualTime : new Date();
}

/** Convierte una fecha en formato HH:MM */
function formatHM(date) {
  return `${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`;
}

/** Guarda datos en el navegador */
function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}


/* ==================== INICIO ==================== */

// Activar sonido (algunos navegadores bloquean el audio hasta un clic)
document.addEventListener("click", () => {
  alarmSound.play().then(() => {
    alarmSound.pause();
    alarmSound.currentTime = 0;
  }).catch(()=>{});
}, { once:true });

// Actualizar reloj cada segundo
setInterval(() => {
  if (usingManualClock && manualTime) manualTime.setSeconds(manualTime.getSeconds() + 1);

  let now = getNow();
  let hours   = String(now.getHours()).padStart(2,"0");
  let minutes = String(now.getMinutes()).padStart(2,"0");
  let seconds = String(now.getSeconds()).padStart(2,"0");

  clock.textContent = `${hours}:${minutes}:${seconds}`;

  checkAlarms(formatHM(now));
}, 1000);


/* ==================== CAMBIAR HORA MANUAL ==================== */
setClockBtn.onclick = () => {
  try {
    if (!manualClock.value) {
      throw new Error("⚠️ Debes seleccionar una hora para cambiar el reloj.");
    }

    const today = new Date();
    const [h, m] = manualClock.value.split(":");

    manualTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m, 0);
    usingManualClock = true;

  } catch (err) {
    showModal(err.message);
  }
};


/* ==================== ALARMAS ==================== */

/** Verifica si algún hábito debe sonar en la hora actual */
function checkAlarms(currentTime) {
  const today = new Date().toLocaleDateString("es-PE");

  habits.forEach(habit => {
    const alreadyRegistered = activities.find(a =>
      a.name === habit.name &&
      a.time === habit.time &&
      a.date === today
    );

    if (habit.time === currentTime && !alreadyRegistered) {
      startAlarm(habit);
    }
  });
}

/** Inicia la alarma de un hábito */
function startAlarm(habit) {
  currentHabit = habit;

  showMessage(`⏰ ¡Es hora de: ${habit.name}!`);
  showStopButton();
  playAlarm();

  // Si no se detiene en 10s → se marca como no cumplido
  alarmTimeout = setTimeout(autoFailHabit, 10000);
}

function playAlarm() {
  alarmSound.currentTime = 0;
  alarmSound.play().catch(()=>{});
}

/** Marca hábito como no cumplido automáticamente */
function autoFailHabit() {
  if (currentHabit) {
    saveActivity(currentHabit, false);
    if (!currentHabit.repeat) deleteHabitByName(currentHabit.name);
    stopAlarm(false);
  }
}

/**  Detiene la alarma */
function stopAlarm(done = true) {
  alarmSound.pause();
  alarmSound.currentTime = 0;

  if (alarmTimeout) {
    clearTimeout(alarmTimeout);
    alarmTimeout = null;
  }

  if (currentHabit) {
    if (done) {
      saveActivity(currentHabit, true);
      if (!currentHabit.repeat) deleteHabitByName(currentHabit.name); // 🔁
    }
    currentHabit = null;
  }

  removeMessage();
  removeStopButton();
}


/* ==================== ACTIVIDADES (HISTORIAL) ==================== */

/** Guarda el estado de un hábito en el historial */
function saveActivity(habit, completed) {
  const today = new Date().toLocaleDateString("es-PE");

  // Evitar duplicados (eliminar registros previos de hoy)
  activities = activities.filter(a => !(a.name === habit.name && a.date === today));

  activities.push({
    name: habit.name,
    time: habit.time,
    repeat: habit.repeat, // 🔁
    status: completed ? "✅ Cumplido" : "❌ No cumplido",
    statusClass: completed ? "done" : "fail",
    date: today
  });

  saveToStorage("activities", activities);
  renderActivities();
}


/* ==================== RENDER DE HÁBITOS ==================== */

function renderHabits() {
  habitList.innerHTML = "";

  habits.forEach((habit, index) => {
    habitList.innerHTML += `
      <div class="item">
        <span><strong>${habit.name}</strong></span>
        <input type="time" value="${habit.time}" onchange="updateTime(${index}, this.value)">
        <label>
          <input type="checkbox" ${habit.repeat ? "checked" : ""} onchange="toggleRepeat(${index}, this.checked)">
          🔁
        </label>
        <button onclick="deleteHabit(${index})">❌</button>
      </div>`;
  });
}


/* ==================== RENDER DE HISTORIAL 📊 ==================== */

function renderActivities() {
  activityList.innerHTML = "";

  const filter = filterHistory.value;

  activities.forEach(a => {
    if (filter === "done" && a.statusClass !== "done") return;
    if (filter === "fail" && a.statusClass !== "fail") return;

    activityList.innerHTML += `
      <div class="item">
        <span>${a.name}</span>
        <span>${a.time}</span>
        <span class="status ${a.statusClass}">${a.status}</span>
        <span>${a.date}</span>
      </div>`;
  });
}

filterHistory.onchange = renderActivities;


/* ==================== AGREGAR HÁBITOS (4 VALIDACIONES) ==================== */

addHabitBtn.onclick = () => {
  try {
    const name   = habitName.value.trim();
    const time   = habitTime.value;
    const repeat = habitRepeat.checked;

    // 1) Validar campos vacíos
    if (!name || !time) {
      throw new Error("⚠️ Debes completar el nombre y la hora del hábito.");
    }
    // 2) Validar hora duplicada
    if (habits.some(h => h.time === time)) {
      throw new Error("⚠️ Ya existe un hábito en esa misma hora.");
    }
    // 3) Validar hora anterior
    const nowHM = formatHM(getNow());
    if (time < nowHM) {
      throw new Error(`⏰ La hora elegida (${time}) es anterior al reloj (${nowHM}). La alarma sonará mañana.`);
    }

    saveHabit(name, time, repeat);

  } catch (err) {
    // Si el error es por hora anterior, mostramos confirmación
    if (err.message.includes("anterior al reloj")) {
      showModal(err.message, true, (ok) => {
        if (ok) saveHabit(habitName.value, habitTime.value, habitRepeat.checked);
        else habitTime.focus();
      });
    } else {
      showModal(err.message);
    }
  }
};


/* ==================== CRUD DE HÁBITOS ==================== */

function saveHabit(name, time, repeat) {
  habits.push({ name, time, repeat });
  saveToStorage("habits", habits);

  habitName.value = "";
  habitTime.value = "";
  habitRepeat.checked = false;

  renderHabits();
}

function updateTime(index, newTime) {
  try {
    if (habits.some((h, i) => i !== index && h.time === newTime)) {
      throw new Error("⚠️ Ya existe un hábito en esa misma hora.");
    }
    habits[index].time = newTime;
    saveToStorage("habits", habits);
    renderHabits();
  } catch (err) {
    showModal(err.message);
    renderHabits();
  }
}

function toggleRepeat(index, value) {
  habits[index].repeat = value;
  saveToStorage("habits", habits);
}

function deleteHabit(index) {
  habits.splice(index, 1);
  saveToStorage("habits", habits);
  renderHabits();
}

function deleteHabitByName(name) {
  habits = habits.filter(h => h.name !== name);
  saveToStorage("habits", habits);
  renderHabits();
}


/* ==================== UI DE ALARMA ==================== */

function showMessage(msg) {
  let box = document.getElementById("alarmBox");
  if (!box) {
    box = document.createElement("div");
    box.id = "alarmBox";
    document.body.appendChild(box);
  }
  box.textContent = msg;
}

function removeMessage() {
  const b = document.getElementById("alarmBox");
  if (b) b.remove();
}

function showStopButton() {
  if (!document.getElementById("stopAlarmBtn")) {
    const b = document.createElement("button");
    b.id = "stopAlarmBtn";
    b.textContent = "Detener alarma";
    b.onclick = () => stopAlarm(true);
    document.body.appendChild(b);
  }
}

function removeStopButton() {
  const b = document.getElementById("stopAlarmBtn");
  if (b) b.remove();
}


/* ==================== MODAL DE MENSAJES ==================== */

function showModal(message, withCancel = false, callback = null) {
  const modal = document.getElementById("modal");
  const msg   = document.getElementById("modalMessage");
  const btns  = document.getElementById("modalButtons");

  msg.textContent = message;
  btns.innerHTML  = "";

  // Botón aceptar
  const okBtn = document.createElement("button");
  okBtn.textContent = "Aceptar";
  okBtn.onclick = () => { closeModal(); if (callback) callback(true); };
  btns.appendChild(okBtn);

  // Botón cancelar (si corresponde)
  if (withCancel) {
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancelar";
    cancelBtn.onclick = () => { closeModal(); if (callback) callback(false); };
    btns.appendChild(cancelBtn);
  }

  modal.style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}


/* ==================== INICIALIZACIÓN ==================== */

renderHabits();
renderActivities();

// Exponer funciones que se usan en el HTML
window.updateTime   = updateTime;
window.toggleRepeat = toggleRepeat;
window.deleteHabit  = deleteHabit;
