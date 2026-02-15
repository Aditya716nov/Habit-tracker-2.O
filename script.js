// ==================== DATA STORAGE ====================
const HABITS_KEY = 'habit-tracker-habits';
const ENTRIES_KEY = 'habit-tracker-entries';

const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
];

let habits = [];
let entries = [];
let currentDate = new Date();
let currentWeekStart = getWeekStart(new Date());

// ==================== INITIALIZATION ====================
function init() {
    loadData();
    render();
}

function loadData() {
    const savedHabits = localStorage.getItem(HABITS_KEY);
    const savedEntries = localStorage.getItem(ENTRIES_KEY);
    
    if (savedHabits) {
        habits = JSON.parse(savedHabits);
    } else {
        // Default habits
        habits = [
            { id: '1', name: 'Exercise', color: colors[0] },
            { id: '2', name: 'Read', color: colors[1] },
            { id: '3', name: 'Meditate', color: colors[2] },
            { id: '4', name: 'Drink Water', color: colors[3] },
        ];
    }
    
    if (savedEntries) {
        entries = JSON.parse(savedEntries);
    }
}

function saveData() {
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

// ==================== DATE FUNCTIONS ====================
function formatDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getWeekDays(weekStart) {
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        days.push(d);
    }
    return days;
}

function getMonthName(date) {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getShortMonthName(date) {
    return date.toLocaleDateString('en-US', { month: 'short' });
}

function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    render();
}

function goToCurrentMonth() {
    currentDate = new Date();
    currentWeekStart = getWeekStart(new Date());
    render();
}

function changeWeek(direction) {
    currentWeekStart.setDate(currentWeekStart.getDate() + (direction * 7));
    render();
}

// ==================== HABIT FUNCTIONS ====================
function addHabit() {
    const input = document.getElementById('newHabitInput');
    const name = input.value.trim();
    
    if (name) {
        const newHabit = {
            id: Date.now().toString(),
            name: name,
            color: colors[habits.length % colors.length]
        };
        habits.push(newHabit);
        saveData();
        input.value = '';
        toggleAddForm();
        render();
    }
}

function deleteHabit(id, event) {
    event.stopPropagation();
    if (confirm('Delete this habit?')) {
        habits = habits.filter(h => h.id !== id);
        entries = entries.filter(e => e.habitId !== id);
        saveData();
        render();
    }
}

function toggleHabit(habitId, date) {
    const dateKey = formatDateKey(date);
    const existingIndex = entries.findIndex(e => e.habitId === habitId && e.date === dateKey);
    
    if (existingIndex >= 0) {
        entries[existingIndex].completed = !entries[existingIndex].completed;
    } else {
        entries.push({ habitId, date: dateKey, completed: true });
    }
    
    saveData();
    render();
}

function isCompleted(habitId, date) {
    const dateKey = formatDateKey(date);
    return entries.some(e => e.habitId === habitId && e.date === dateKey && e.completed);
}

function getHabitTotal(habitId, weekDays) {
    return weekDays.filter(day => isCompleted(habitId, day)).length;
}

function toggleAddForm() {
    const form = document.getElementById('addHabitForm');
    const btn = document.getElementById('showAddBtn');
    
    if (form.classList.contains('hidden')) {
        form.classList.remove('hidden');
        btn.classList.add('hidden');
        document.getElementById('newHabitInput').focus();
    } else {
        form.classList.add('hidden');
        btn.classList.remove('hidden');
    }
}

function handleEnter(event) {
    if (event.key === 'Enter') {
        addHabit();
    }
}

// ==================== RENDER FUNCTIONS ====================
function render() {
    document.getElementById('currentMonth').textContent = getMonthName(currentDate);
    document.getElementById('monthDisplay').textContent = getMonthName(currentDate);
    document.getElementById('totalHabits').textContent = `${habits.length} habits tracked`;
    
    const weekDays = getWeekDays(currentWeekStart);
    const weekEnd = weekDays[6];
    document.getElementById('weekRange').textContent = 
        `${getShortMonthName(currentWeekStart)} ${currentWeekStart.getDate()} - ${getShortMonthName(weekEnd)} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
    
    renderHabitGrid(weekDays);
    renderMonthlyGrid();
    renderWeeklyChart(weekDays);
    renderStats();
    renderTopHabits();
}

function renderHabitGrid(weekDays) {
    const daysHeader = document.getElementById('daysHeader');
    const habitGrid = document.getElementById('habitGrid');
    const today = new Date();
    
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    daysHeader.innerHTML = weekDays.map((day, i) => {
        const isToday = isSameDay(day, today);
        return `
            <div class="day-header ${isToday ? 'today' : ''}">
                <span class="day-name">${dayNames[i]}</span>
                <span class="day-num">${day.getDate()}</span>
            </div>
        `;
    }).join('');
    
    habitGrid.innerHTML = habits.map(habit => {
        const total = getHabitTotal(habit.id, weekDays);
        return `
            <div class="habit-row">
                <div class="habit-info">
                    <div class="habit-color" style="background-color: ${habit.color}"></div>
                    <span class="habit-name">${habit.name}</span>
                    <button class="delete-habit" onclick="deleteHabit('${habit.id}', event)">✕</button>
                </div>
                <div class="habit-days">
                    ${weekDays.map(day => {
                        const completed = isCompleted(habit.id, day);
                        return `
                            <div class="day-checkbox">
                                <div class="checkbox ${completed ? 'checked' : ''}" 
                                     onclick="toggleHabit('${habit.id}', new Date('${day.toISOString()}'))">
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="habit-total ${total === 7 ? 'perfect' : ''}">${total}/7</div>
            </div>
        `;
    }).join('');
}

function renderMonthlyGrid() {
    const monthGrid = document.getElementById('monthGrid');
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;
    
    const dayHeaders = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    let html = dayHeaders.map(d => `<div class="month-header">${d}</div>`).join('');
    
    for (let i = 0; i < startDay; i++) {
        html += `<div class="month-day other-month"><span class="day-num"></span></div>`;
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = isSameDay(date, today);
        
        const completed = habits.filter(h => isCompleted(h.id, date)).length;
        const percentage = habits.length > 0 ? (completed / habits.length) * 100 : 0;
        
        let className = 'month-day';
        if (isToday) className += ' today';
        if (percentage === 100) className += ' completed';
        else if (percentage > 0) className += ' partial';
        
        html += `
            <div class="${className}">
                <span class="day-num">${day}</span>
                ${habits.length > 0 ? `<span class="day-progress">${completed}/${habits.length}</span>` : ''}
            </div>
        `;
    }
    
    monthGrid.innerHTML = html;
}

function renderWeeklyChart(weekDays) {
    const chartContainer = document.getElementById('weeklyChart');
    const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    
    chartContainer.innerHTML = weekDays.map((day, i) => {
        const completed = habits.filter(h => isCompleted(h.id, day)).length;
        const percentage = habits.length > 0 ? (completed / habits.length) * 100 : 0;
        
        let color = '#ef4444';
        if (percentage === 100) color = '#10b981';
        else if (percentage >= 75) color = '#34d399';
        else if (percentage >= 50) color = '#fbbf24';
        else if (percentage >= 25) color = '#f97316';
        
        return `
            <div class="chart-bar-wrapper">
                <div class="chart-bar" style="height: ${Math.max(percentage, 10)}%; background-color: ${color};"></div>
                <span class="chart-label">${dayNames[i]}</span>
            </div>
        `;
    }).join('');
}

function renderStats() {
    const today = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const currentDay = today.getMonth() === month ? today.getDate() : daysInMonth;
    
    let totalCompletions = 0;
    let possibleCompletions = 0;
    let daysWithAllCompleted = 0;
    
    for (let day = 1; day <= currentDay; day++) {
        const date = new Date(year, month, day);
        const completed = habits.filter(h => isCompleted(h.id, date)).length;
        totalCompletions += completed;
        possibleCompletions += habits.length;
        
        if (completed === habits.length && habits.length > 0) {
            daysWithAllCompleted++;
        }
    }
    
    const completionRate = possibleCompletions > 0 
        ? Math.round((totalCompletions / possibleCompletions) * 100) 
        : 0;
    
    let currentStreak = 0;
    for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const allCompleted = habits.length > 0 && habits.every(h => isCompleted(h.id, date));
        
        if (allCompleted) {
            currentStreak++;
        } else if (i > 0) {
            break;
        }
    }
    
    let bestStreak = 0;
    let currentStreakCount = 0;
    
    for (let day = 1; day <= currentDay; day++) {
        const date = new Date(year, month, day);
        const allCompleted = habits.length > 0 && habits.every(h => isCompleted(h.id, date));
        
        if (allCompleted) {
            currentStreakCount++;
            bestStreak = Math.max(bestStreak, currentStreakCount);
        } else {
            currentStreakCount = 0;
        }
    }
    
    document.getElementById('completionRate').textContent = `${completionRate}%`;
    document.getElementById('daysCompleted').textContent = `${daysWithAllCompleted}/${currentDay}`;
    document.getElementById('bestStreak').textContent = `${bestStreak} days`;
    document document.getElementById('currentStreak').textContent = `${currentStreak} days`;
}

function renderTopHabits() {
    const container = document.getElementById('topHabitsList');
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    const currentDay = today.getMonth() === month ? today.getDate() : new Date(year, month + 1, 0).getDate();
    
    const habitStats = habits.map(habit => {
        let count = 0;
        for (let day = 1; day <= currentDay; day++) {
            const date = new Date(year, month, day);
            if (isCompleted(habit.id, date)) count++;
        }
        return { ...habit, count, percentage: Math.round((count / currentDay) * 100) };
    }).sort((a, b) => b.count - a.count);
    
    container.innerHTML = habitStats.slice(0, 5).map(habit => `
        <div class="top-habit-item">
            <div class="top-habit-color" style="background-color: ${habit.color}"></div>
            <span class="top-habit-name">${habit.name}</span>
            <div class="top-habit-bar">
                <div class="top-habit-fill" style="width: ${habit.percentage}%; background-color: ${habit.color}"></div>
            </div>
            <span class="top-habit-count">${habit.count}</span>
        </div>
    `).join('');
}

// ==================== START ====================
init();
