
async function loadUserName() {
    try {
        console.log('Fetching user data')
        const res = await fetch('/api/user')
        console.log('Response:', res)
        if (!res.ok) throw new Error('Failed to fetch user')
        const user = await res.json()
        document.getElementById('username').textContent = user.first_name
    } catch (err) {
        console.error('Error loading username:', err)
        document.getElementById('username').textContent = 'User'
    }
}

async function loadAccount() {
    try {
        const info = await fetch('/api/user/full') 
        const avail = await fetch('/api/user/availability')
        
        if (!info) throw new Error('User fetch failed')

        const user = await info.json()
        document.getElementById('first_name').value = user.first_name || ''
        document.getElementById('last_name').value = user.last_name || ''
        document.getElementById('username').value = user.username || ''
        document.getElementById('email').value = user.email || ''
        document.getElementById('phonenumber').value = user.phonenumber || ''

        if (avail.ok) {
            const availData = await avail.json()
            const availability = availData.availability || []
            const availMap = {}

            availability.forEach(av => {
                availMap[av.weekday]=av
            })

            document.querySelectorAll('#availabilityform input[type=checkbox]').forEach(cb => {
                const value = cb.value;
                const day = value.replace('Day', '').replace('Night', '')
                const shift = value.includes('Day') ? 'morn_aval' : 'night_aval'
                
                const av = availMap[day]
                if (shift === 'morn_aval') {
                    cb.checked = av && Number(av.morn_aval) === 1
                } else {
                    cb.checked = av && Number(av.night_aval) === 1
                }
            })
        }
    } catch (err) {
        console.error('Account load error', err)
    }
}

async function saveAccountInfo(e) {
    e.preventDefault()
    const status = document.getElementById('user-status')
    status.textContent = 'Saving'
    const fields = {
        first_name: document.getElementById('first_name').value.trim(),
        last_name: document.getElementById('last_name').value.trim(),
        username: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phonenumber').value.trim(),
    }
    const pwd = document.getElementById('password').value
    if (pwd) fields.password = pwd

    try {
        const info = await fetch('/api/user', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fields)
        })

        if (!info.ok) throw new Error('Profile save failed')

        status.textContent = 'Saved'
        setTimeout(()=> status.textContent = '', 2000)
        document.getElementById('password').value = ''

    } catch (err) {
        console.error('Account Save Error', err)
        status.textContent = 'Error saving'
    }
}

async function saveAccountAvailability(e) {
    e.preventDefault();
    const status = document.getElementById('availability-status')
    status.textContent = 'Saving'
    
    const availability = {}
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    days.forEach(day => {
        availability[day] = {
            morn_aval: 0,
            night_aval: 0
        };
    });

    document.querySelectorAll('#availabilityform input[type=checkbox]:checked').forEach(cb => {
        const value = cb.value
        const day = value.replace('Day', '').replace('Night', '')
        const shift = value.includes('Day') ? 'morn_aval' : 'night_aval'
        
        if (availability[day]) {
            availability[day][shift] = 1
        }
    })

    try {
        const res = await fetch('/api/user/availability', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ availability })
        })

        if (!res.ok) throw new Error('Availability save failed')

        status.textContent = 'Saved'
        setTimeout(() => status.textContent = '', 2000)
    } catch (err) {
        console.error('Availability Save Error', err)
        status.textContent = 'Error saving'
    }

}

window.addEventListener('DOMContentLoaded', () => {
    loadUserName()
    loadAccount()
    
    const accountForm = document.getElementById('accountform')
    if (accountForm) accountForm.addEventListener('submit', saveAccountInfo)
    
    const availForm = document.getElementById('availabilityform')
    if (availForm) availForm.addEventListener('submit', saveAccountAvailability)
})