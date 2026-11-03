let config = {};
let currentEditId = null;

async function init() {
    try {
        const response = await fetch('config.json');
        config = await response.json();
        await loadTasks();
    } catch (error) {
        showStatus('Error loading configuration', true);
    }
}

function showStatus(message, isError = false) {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = message;
    statusEl.style.color = isError ? '#ff6b6b' : '#51cf66';
    setTimeout(() => statusEl.textContent = '', 3000);
}

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'apikey': config.supabasePublishableKey,
        'Authorization': `Bearer ${config.supabasePublishableKey}`
    };
}

async function loadTasks() {
    try {
        const res = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}?select=*&order=id.asc`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch tasks');
        const tasks = await res.json();
        renderTasks(tasks);
    } catch (error) {
        showStatus('Error loading tasks', true);
    }
}

function renderTasks(tasks) {
    const list = document.getElementById('task-list');
    list.innerHTML = '';
    
    tasks.forEach(task => {
        const item = document.createElement('div');
        item.className = 'task-item';
        item.setAttribute('data-id', task.id);
        
        item.innerHTML = `
            <div class="task-title">${task.title}</div>
            <div class="task-description">${task.description || ''}</div>
            <div class="task-status">Status: ${task.completed ? 'Completed' : 'Incomplete'}</div>
            <div class="task-actions">
                <button class="toggle-task" onclick="toggleTask(${task.id}, ${task.completed})">${task.completed ? 'Undo' : 'Complete'}</button>
                <button class="edit-task" onclick="editTask(${task.id}, '${task.title}', '${task.description || ''}')">Edit</button>
                <button class="delete-task" onclick="deleteTask(${task.id})">Delete</button>
            </div>
        `;
        list.appendChild(item);
    });
}

document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;

    const taskData = { title, description };

    try {
        let url = `${config.supabaseUrl}/rest/v1/${config.tableName}`;
        let method = 'POST';

        if (currentEditId) {
            url += `?id=eq.${currentEditId}`;
            method = 'PATCH';
        }

        const res = await fetch(url, {
            method: method,
            headers: getHeaders(),
            body: JSON.stringify(taskData)
        });

        if (!res.ok) throw new Error('Failed to save task');
        
        showStatus(currentEditId ? 'Task updated!' : 'Task added!');
        document.getElementById('task-form').reset();
        currentEditId = null;
        document.getElementById('task-submit').textContent = 'Add Task';
        await loadTasks();
    } catch (error) {
        showStatus('Error saving task', true);
    }
});

async function toggleTask(id, currentStatus) {
    try {
        const res = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}?id=eq.${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ completed: !currentStatus })
        });
        if (!res.ok) throw new Error('Failed to update status');
        await loadTasks();
    } catch (error) {
        showStatus('Error updating task status', true);
    }
}

async function deleteTask(id) {
    try {
        const res = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}?id=eq.${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete task');
        showStatus('Task deleted!');
        await loadTasks();
    } catch (error) {
        showStatus('Error deleting task', true);
    }
}

function editTask(id, title, description) {
    currentEditId = id;
    document.getElementById('task-title').value = title;
    document.getElementById('task-description').value = description;
    document.getElementById('task-submit').textContent = 'Update Task';
}

init();