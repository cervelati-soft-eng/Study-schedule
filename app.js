// 1. Importações dos módulos do Firebase via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 2. Configurações do Firebase (COLE AS CHAVES DO SEU CONSOLE AQUI)
const firebaseConfig = {
  apiKey: "AIzaSyAq3Aa2x3XJp6I5MuNMfY5ebeTPAQv0tQg",
  authDomain: "study-schedule-46ba6.firebaseapp.com",
  projectId: "study-schedule-46ba6",
  storageBucket: "study-schedule-46ba6.firebasestorage.app",
  messagingSenderId: "33593254807",
  appId: "1:33593254807:web:eb43e7f5b9e45124595ad2"
};

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Variáveis globais de controle de Estado do Usuário
let currentUser = null;

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

// Carrega dados locais caso o usuário não esteja logado
function loadLocalSchedule() {
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

// Salva localmente e também no Firestore (caso esteja logado)
async function saveSchedule(scheduleData) {
    // Sempre salva no localStorage como fallback
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scheduleData));
    
    // Se logado, atualiza na nuvem
    if (currentUser) {
        try {
            await setDoc(doc(db, "cronogramas", currentUser.uid), scheduleData);
        } catch (error) {
            console.error("Erro ao sincronizar com o Firebase:", error);
        }
    }
}

// Sincroniza dados da Nuvem para o App
async function loadFirebaseSchedule(userId) {
    try {
        const docRef = doc(db, "cronogramas", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            // Se o usuário logou pela 1ª vez e não tem dados na nuvem, envia o que ele tem localmente
            const currentLocal = loadLocalSchedule();
            await setDoc(docRef, currentLocal);
            return currentLocal;
        }
    } catch (error) {
        console.error("Erro ao buscar dados do Firebase:", error);
        return loadLocalSchedule();
    }
}

let schedule = loadLocalSchedule();
let activeDayId = DAYS[0].id;

// Elementos DOM existentes
const dayTabsEl = document.getElementById("day-tabs");
const titleEl = document.getElementById("current-day-title");
const metaEl = document.getElementById("current-day-meta");
const listEl = document.getElementById("slot-list");
const formEl = document.getElementById("add-form");
const inputTime = document.getElementById("input-time");
const inputTopic = document.getElementById("input-topic");
const btnReset = document.getElementById("btn-reset");

// Novos Elementos DOM da Autenticação
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const userInfo = document.getElementById("user-info");

function timeToMinutes(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

function sortDaySlots(dayId) {
    if (schedule[dayId]) {
        schedule[dayId].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    }
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
    for (const slot of items) {
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
        btn.addEventListener("click", async () => {
            const id = btn.getAttribute("data-remove");
            schedule[activeDayId] = schedule[activeDayId].filter((s) => s.id !== id);
            await saveSchedule(schedule);
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

formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const time = inputTime.value;
    const topic = inputTopic.value.trim();
    if (!time || !topic) return;
    
    if (!schedule[activeDayId]) schedule[activeDayId] = [];
    
    schedule[activeDayId].push({ id: uid(), time, topic });
    await saveSchedule(schedule);
    inputTopic.value = "";
    inputTopic.focus();
    renderPanel();
});

btnReset.addEventListener("click", async () => {
    if (!confirm("Substituir o cronograma pelo exemplo inicial? Seus dados atuais serão perdidos.")) return;
    schedule = cloneDefault();
    await saveSchedule(schedule);
    renderPanel();
    renderTabs();
});

// Eventos de Autenticação do Usuário
btnLogin.addEventListener("click", async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Erro ao autenticar:", error);
    }
});

btnLogout.addEventListener("click", async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Erro ao deslogar:", error);
    }
});

// Observador de Mudança de Estado de Login (Firebase Auth Observer)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        userInfo.textContent = `Olá, ${user.displayName || user.email}`;
        userInfo.style.display = "inline";
        btnLogin.style.display = "none";
        btnLogout.style.display = "inline";
        
        // Carrega dados sincronizados da conta dele
        schedule = await loadFirebaseSchedule(user.uid);
    } else {
        currentUser = null;
        userInfo.style.display = "none";
        btnLogin.style.display = "inline";
        btnLogout.style.display = "none";
        
        // Retorna para o localStorage local padrão
        schedule = loadLocalSchedule();
    }
    renderTabs();
    renderPanel();
});