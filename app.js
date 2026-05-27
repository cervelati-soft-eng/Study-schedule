const STORAGE_KEY = "estudos-cronograma-v1";

const DAYS = [
    { id: "seg", label: "Seg", full: "Segunda-feira" },
    { id: "ter", label: "Ter", full: "Terça-feira" },
    { id: "qua", label: "Qua", full: "Quarta-feira" },
    { id: "qui", label: "Qui", full: "Quinta-feira" },
    { id: "sex", label: "Sex", full: "Sexta-feira" },
    { id: "sab", label: "Sáb", full: "Sábado" },
    { id: "dom", label: "Dom", full: "Domingo" },
];

/** @type {Record<string, { id: string, time: string, topic: string }[]>} */
const DEFAULT_SCHEDULE = {
    seg: [
        { id: "d1", time: "08:00", topic: "Revisão da semana anterior" },
        { id: "d2", time: "19:00", topic: "Matemática — exercícios" },
    ],
    ter: [{ id: "d3", time: "19:00", topic: "Programação — projeto prático" }],
    qua: [{ id: "d4", time: "07:30", topic: "Leitura / inglês" }],
    qui: [{ id: "d5", time: "20:00", topic: "Teoria + anotações" }],
    sex: [{ id: "d6", time: "18:00", topic: "Simulado ou prova antiga" }],
    sab: [{ id: "d7", time: "10:00", topic: "Estudo leve / dúvidas" }],
    dom: [],
};

function uid() {
    return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function loadSchedule() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return cloneDefault();
        const parsed = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) return cloneDefault();
        const out = {};
        for (const { id } of DAYS) {
            out[id] = Array.isArray(parsed[id]) ? parsed[id] : [];
        }
        return out;
    } catch {
        return cloneDefault();
    }
}

function cloneDefault() {
    return JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
}

function saveSchedule(schedule) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
}

/** @type {Record<string, { id: string, time: string, topic: string }[]>} */
let schedule = loadSchedule();
let activeDayId = DAYS[0].id;

const dayTabsEl = document.getElementById("day-tabs");
const titleEl = document.getElementById("current-day-title");
const metaEl = document.getElementById("current-day-meta");
const listEl = document.getElementById("slot-list");
const formEl = document.getElementById("add-form");
const inputTime = document.getElementById("input-time");
const inputTopic = document.getElementById("input-topic");
const btnReset = document.getElementById("btn-reset");

function timeToMinutes(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

function sortDaySlots(dayId) {
    schedule[dayId].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
}

function renderTabs() {
    dayTabsEl.innerHTML = "";
    for (const day of DAYS) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "day-tab";
        btn.textContent = day.label;
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", day.id === activeDayId ? "true" : "false");
        btn.dataset.dayId = day.id;
        btn.addEventListener("click", () => {
            activeDayId = day.id;
            renderTabs();
            renderPanel();
        });
        dayTabsEl.appendChild(btn);
    }
}

function renderPanel() {
    const day = DAYS.find((d) => d.id === activeDayId) || DAYS[0];
    titleEl.textContent = day.full;
    const items = schedule[activeDayId] || [];
    const n = items.length;
    metaEl.textContent = n === 0 ? "Nenhum bloco" : n === 1 ? "1 bloco" : `${n} blocos`;

    listEl.innerHTML = "";
    if (n === 0) {
        const empty = document.createElement("li");
        empty.className = "slots-empty";
        empty.textContent = "Nada agendado neste dia. Adicione um horário e um tópico abaixo.";
        listEl.appendChild(empty);
        return;
    }

    sortDaySlots(activeDayId);
    for (const slot of schedule[activeDayId]) {
        const li = document.createElement("li");
        li.className = "slot";
        li.innerHTML = `
            <span class="slot-time">${escapeHtml(slot.time)}</span>
            <span class="slot-topic">${escapeHtml(slot.topic)}</span>
            <button type="button" class="btn-icon" data-remove="${escapeAttr(slot.id)}" aria-label="Remover bloco">×</button>
        `;
        listEl.appendChild(li);
    }

    listEl.querySelectorAll("[data-remove]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-remove");
            schedule[activeDayId] = schedule[activeDayId].filter((s) => s.id !== id);
            saveSchedule(schedule);
            renderPanel();
        });
    });
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
    return String(s).replace(/"/g, "&quot;");
}

formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const time = inputTime.value;
    const topic = inputTopic.value.trim();
    if (!time || !topic) return;
    schedule[activeDayId].push({ id: uid(), time, topic });
    saveSchedule(schedule);
    inputTopic.value = "";
    inputTopic.focus();
    renderPanel();
});

btnReset.addEventListener("click", () => {
    if (!confirm("Substituir o cronograma pelo exemplo inicial? Seus dados atuais serão perdidos.")) return;
    schedule = cloneDefault();
    saveSchedule(schedule);
    renderPanel();
    renderTabs();
});

renderTabs();
renderPanel();
