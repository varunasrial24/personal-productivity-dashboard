document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const authContainer = document.getElementById('auth-container');
    const dashboard = document.getElementById('dashboard');
    const authForm = document.getElementById('auth-form');
    const authBtn = document.getElementById('auth-btn');
    const toggleAuth = document.getElementById('toggle-auth');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const userNameSpan = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');
    const profileImg = document.getElementById('profile-img');
    const profileUpload = document.getElementById('profile-upload');

    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');

    const noteInput = document.getElementById('note-input');
    const saveNoteBtn = document.getElementById('save-note-btn');
    const notesDisplay = document.getElementById('notes-display');

    const weatherInfo = document.getElementById('weather-info');
    const locationInfo = document.getElementById('location-info');
    const quoteText = document.getElementById('quote-text');

    const timerMinutes = document.getElementById('timer-minutes');
    const startTimerBtn = document.getElementById('start-timer-btn');
    const timerDisplay = document.getElementById('timer-display');

    let isLogin = true;
    let currentUser = null;
    let timerInterval = null;

    // localStorage helpers
    const getUsers = () => JSON.parse(localStorage.getItem('users')) || {};
    const saveUsers = (users) => localStorage.setItem('users', JSON.stringify(users));

    const getUserData = (key) => {
        const users = getUsers();
        const defaultValue = key === 'tasks' ? [] :
                             key === 'notes' ? '' :
                             'https://via.placeholder.com/50';
        return users[currentUser]?.[key] ?? defaultValue;
    };

    const saveUserData = (key, data) => {
        const users = getUsers();
        if (!users[currentUser]) users[currentUser] = {};
        users[currentUser][key] = data;
        saveUsers(users);
    };

    // Authentication
    toggleAuth.addEventListener('click', () => {
        isLogin = !isLogin;
        authBtn.textContent = isLogin ? 'Login' : 'Signup';
        toggleAuth.textContent = isLogin ? 'Switch to Signup' : 'Switch to Login';
    });

    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            alert('Please fill in both fields');
            return;
        }

        const users = getUsers();

        if (isLogin) {
            if (users[username] && users[username].password === password) {
                currentUser = username;
                loadDashboard();
            } else {
                alert('Invalid username or password');
            }
        } else {
            if (users[username]) {
                alert('Username already exists');
            } else {
                users[username] = {
                    password,
                    tasks: [],
                    notes: '',
                    profileImg: 'https://via.placeholder.com/50'
                };
                saveUsers(users);
                currentUser = username;
                loadDashboard();
            }
        }

        usernameInput.value = '';
        passwordInput.value = '';
    });

    logoutBtn.addEventListener('click', () => {
        currentUser = null;
        dashboard.classList.add('hidden');
        authContainer.classList.remove('hidden');
    });

    function loadDashboard() {
        authContainer.classList.add('hidden');
        dashboard.classList.remove('hidden');

        userNameSpan.textContent = currentUser;
        profileImg.src = getUserData('profileImg');

        loadTasks();
        loadNotes();
        fetchWeather();
        fetchQuote();
    }

    // Tasks
    addTaskBtn.addEventListener('click', addNewTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addNewTask();
    });

    function addNewTask() {
        const taskText = taskInput.value.trim();
        if (!taskText) return;

        const tasks = getUserData('tasks');
        tasks.push({ text: taskText, done: false });
        saveUserData('tasks', tasks);
        loadTasks();
        taskInput.value = '';
    }

    function loadTasks() {
        taskList.innerHTML = '';
        const tasks = getUserData('tasks');

        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span style="${task.done ? 'text-decoration: line-through; opacity:0.7;' : ''}">
                    ${task.text}
                </span>
                <div>
                    <button onclick="toggleTask(${index})">${task.done ? 'Undo' : 'Done'}</button>
                    <button onclick="deleteTask(${index})">Delete</button>
                </div>
            `;
            taskList.appendChild(li);
        });
    }

    window.toggleTask = (index) => {
        const tasks = getUserData('tasks');
        tasks[index].done = !tasks[index].done;
        saveUserData('tasks', tasks);
        loadTasks();
    };

    window.deleteTask = (index) => {
        const tasks = getUserData('tasks');
        tasks.splice(index, 1);
        saveUserData('tasks', tasks);
        loadTasks();
    };

    // Notes
    saveNoteBtn.addEventListener('click', () => {
        const notes = noteInput.value;
        saveUserData('notes', notes);
        notesDisplay.textContent = notes;
    });

    function loadNotes() {
        const notes = getUserData('notes');
        noteInput.value = notes;
        notesDisplay.textContent = notes;
    }

    // Weather & Location
    async function fetchWeather() {
        if (!navigator.geolocation) {
            weatherInfo.textContent = 'Geolocation not supported';
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            locationInfo.textContent = `Lat: ${latitude.toFixed(2)}° | Long: ${longitude.toFixed(2)}°`;

            // Replace with your own free API key from https://openweathermap.org/api
            const apiKey = 'YOUR_API_KEY_HERE';
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

            try {
                const res = await fetch(url);
                const data = await res.json();
                const desc = data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);
                weatherInfo.innerHTML = `<strong>${desc}</strong><br>${data.main.temp}°C • Feels like ${data.main.feels_like}°C`;
            } catch {
                weatherInfo.textContent = 'Weather unavailable (add API key)';
            }
        }, () => {
            locationInfo.textContent = 'Location access denied';
            weatherInfo.textContent = 'Enable location to see weather';
        });
    }

    // Quote of the Day
    async function fetchQuote() {
        try {
            const res = await fetch('https://api.quotable.io/random');
            const data = await res.json();
            quoteText.textContent = `"${data.content}" — ${data.author}`;
        } catch {
            quoteText.textContent = 'Unable to load quote';
        }
    }

    // Focus Timer (Pomodoro)
    startTimerBtn.addEventListener('click', startTimer);

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);

        let seconds = parseInt(timerMinutes.value) * 60 || 1500; // default 25 min
        updateTimerDisplay(seconds);

        timerInterval = setInterval(() => {
            seconds--;
            if (seconds < 0) {
                clearInterval(timerInterval);
                timerDisplay.textContent = '00:00';
                alert('Time\'s up! Great focus session 🎉');
                return;
            }
            updateTimerDisplay(seconds);
        }, 1000);
    }

    function updateTimerDisplay(totalSeconds) {
        const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const secs = (totalSeconds % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${mins}:${secs}`;
    }

    // Profile Image Upload
    profileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const imgData = event.target.result;
            profileImg.src = imgData;
            saveUserData('profileImg', imgData);
        };
        reader.readAsDataURL(file);
    });
});