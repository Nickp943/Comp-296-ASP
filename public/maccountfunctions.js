async function loadUserName() {
    try {
        console.log('Fetching user data');
        const res = await fetch('/api/user');
        console.log('Response:', res);
        if (!res.ok) throw new Error('Failed to fetch user');
        const user = await res.json();
        document.getElementById('username').textContent = user.first_name;
    } catch (err) {
        console.error('Error loading username:', err);
        document.getElementById('username').textContent = 'User';
    }
}

async function loadEmployees() {
    try {
        const res = await fetch('/api/employees')
        const rows = await res.json()
        const tbody = document.querySelector('#employeetable tbody')
        tbody.innerHTML = ''
        rows.forEach(emp => {
            const tr = document.createElement('tr')
            tr.innerHTML =`
                <td class="maemployeetable">${emp.employee_id}</td>
                <td class="maemployeetable">${emp.first_name || ''} ${emp.last_name || ''}</td>
                <td class="maemployeetable">${emp.username || ''}</td>
                <td class="maemployeetable">${emp.email || ''}</td>
                <td class="maemployeetable">${emp.phonenumber || ''}</td>
            `
            tbody.appendChild(tr)
        });
    } catch (err) {
        console.error('load Employees Error', err)
    }
}

async function createEmployee(e) {
    e.preventDefault()
    const status = document.getElementById('createstatus')
    status.textContent = 'Creating'
    const payload = {
        username: document.getElementById('newusername').value.trim(),
        password: document.getElementById('newpassword').value,
        first_name: document.getElementById('newfirst').value.trim(),
        last_name: document.getElementById('newlast').value.trim(),
        email: document.getElementById('newemail').value.trim(),
        phonenumber: document.getElementById('newphone').value.trim(),
        manager: document.getElementById('newmanager').checked ? 1 : 0
    }

    try {
        const res = await fetch('/api/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const json = await res.json().catch(()=>({error:'unknown'}))
            throw new Error(json.error)
        }
        const created = await res.json()
        status.textContent = 'Created'
        document.getElementById('createemployeeform').reset()
        await loadEmployees()
        setTimeout(()=> status.textContent = '', 2000)
        
    } catch (err) {
        console.error('createEmployee error', err)
        status.textContent = 'Error: ' + (err.message || 'failed')
    }
}

window.addEventListener('DOMContentLoaded', () => {
    loadUserName()
    loadEmployees()
    const form = document.getElementById('createemployeeform')
    if (form) form.addEventListener('submit', createEmployee)
    
})