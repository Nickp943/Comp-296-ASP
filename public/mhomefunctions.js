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

async function loadAvailabilty() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const table = document.querySelector('.htable')
    if (!table) return

    let thead = table.querySelector('thead')
    if (!thead) {
        thead = document.createElement('thead')
        const tr = document.createElement('tr')
        tr.innerHTML = '<th>Shift</th>'
        thead.appendChild(tr)
        table.insertBefore(thead, table.firstChild)
    }
    const headerRow = thead.querySelector('tr')
    headerRow.innerHTML = '<th>Shift</th>'

    days.forEach(day => {
        const th = document.createElement('th')
        th.textContent = day
        headerRow.appendChild(th)
    })

    const tbody = document.getElementById('schedule-body')
    if (!tbody) return
    tbody.innerHTML = ''

    const morningRow = document.createElement('tr')
    const morningLabel = document.createElement('td')
    morningLabel.textContent = 'Morning'
    morningLabel.style.fontWeight = 'bold'
    morningRow.appendChild(morningLabel)

    const nightRow = document.createElement('tr')
    const nightLabel = document.createElement('td')
    nightLabel.textContent = 'Night'
    nightLabel.style.fontWeight = 'bold'
    nightRow.appendChild(nightLabel)
    for (const day of days) {
        try {
            const res = await fetch(`/api/availability/${encodeURIComponent(day)}`)
            if (!res.ok) throw new Error('Failed to fetch schedule for ' + day)
            const employees = await res.json()

            const morningCell = document.createElement('td')
            morningCell.innerHTML = (employees || [])
                .filter(e => Number(e.morn_aval) === 1)
                .map(e => e.name)
                .join('<br>')
            morningRow.appendChild(morningCell)

            const nightCell = document.createElement('td')
            nightCell.innerHTML = (employees || [])
                .filter(e => Number(e.night_aval) === 1)
                .map(e => e.name)
                .join('<br>')
            nightRow.appendChild(nightCell)
        } catch (err) {
            console.error('Error loading schedule for ' + day, err)

            morningRow.appendChild(document.createElement('td'))
            nightRow.appendChild(document.createElement('td'))
        }
    }
    
    tbody.appendChild(morningRow)
    tbody.appendChild(nightRow)
}

window.addEventListener('DOMContentLoaded', () => {
    loadUserName()
    loadAvailabilty()
});