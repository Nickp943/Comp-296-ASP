const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const app = express()
const db = require('./database')
const session = require('express-session')


let initialPath = path.join(__dirname, "/../public")
app.use("/public", express.static(initialPath))


//app.use(express.static(initialPath))

app.use(express.json({limit:'10mb'}))
app.use(express.urlencoded({ extended: false }))

app.use(session({
  secret: 'userSecret',
  resave: false,
  saveUninitialized: false,
  cookie: {secure: false, maxAge: 60000},
}))

var router = require('./router.js')
router(app)

function requireLogin(req, res, next) {
  if (!req.session || !req.session.userid) return res.redirect('/')
  next()
}

function requireManager(req, res, next) {
  if (!req.session || !req.session.userid || !req.session.isManager) return res.redirect('/')
  next()
}

app.post('/login', async (req, res) => {
  const { username, password } = req.body
  if(!username || !password) return res.status(400).send('Username and Password are required')
  try {
    const user = await db.validateUser(username, password, req)
    if (!user) return res.status(401).send('Invalid Username or Password')

    req.session.userid = user.employee_id
    req.session.isManager = user.manager === 1
    console.log('user id', req.session.userid)
    console.log('manager', req.session.isManager)

    if (req.session.isManager) return res.redirect('/managerhome')
    return res.redirect('/home')
  } catch (error) {
    console.error('login Error:', error)
    return res.status(500).send('Internal Server Error')
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error logging out', err)
      return res.redirect('/')
    }
    return res.redirect('/')
  })   
})

app.get('/api/user', (req, res) => {
  if (!req.session.userid) return res.status(401).json({ error: 'Not logged in' })
  db.getName(req.session.userid)
    .then(user => res.json(user))
    .catch(err => {
      console.error('Error fetching user:', err)
      res.status(500).json({ error: 'Server error' })
    })
})

app.get('/api/user/full', async (req, res) => {
  if (!req.session.userid) return res.status(401).json({ error: 'Not logged in' })
  try {
    const user = await db.getEmployee(req.session.userid)
    res.json(user || {})
  } catch (err) {
    console.error('Error fetching full user:', err)
    res.status(500).json({ error: 'Server error' })
  }
})


app.get('/api/user/availability', async (req, res) => {
  if (!req.session.userid) return res.status(401).json({ error: 'Not logged in' })
  try {
    const availability = await db.getAvailability(req.session.userid)
    res.json({ availability })
  } catch (err) {
    console.error('Error fetching availability:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.put('/api/user', async (req, res) => {
  if (!req.session.userid) return res.status(401).json({ error: 'Not logged in' })
  const fields = {}
  const { username, email, phonenumber, password, first_name, last_name } = req.body
  if (username) fields.username = username
  if (email) fields.email = email
  if (phonenumber) fields.phonenumber = phonenumber
  if (password) fields.password = password
  if (first_name) fields.first_name = first_name
  if (last_name) fields.last_name = last_name

  try {
    const ok = await db.updateUser(req.session.userid, fields)
    if (!ok) return res.status(400).json({ error: 'Nothing updated' })
    res.json({ success: true })
  } catch (err) {
    console.error('Error updating user:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.put('/api/user/availability', async (req, res) => {
  if (!req.session.userid) return res.status(401).json({ error: 'Not logged in' })
  const { availability } = req.body
  try {
    await db.updateAvailability(req.session.userid, availability)
    res.json({ success: true })
  } catch (err) {
    console.error('Error updating availability:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/employees', requireManager, async (req, res) => {
  const { username, password, first_name, last_name, email, phonenumber, manager } = req.body
  if (!username || !password) return res.status(400).json({ error: 'username and password are required' })
  
  try {
    const newEmp = await db.createEmployee({
      username, password, first_name, last_name, email, phonenumber, manager
    })
    if (!newEmp) return res.status(500).json({ error: 'Could not create employee' })
    res.status(201).json(newEmp)
  } catch (err) {
    console.error('Error creating employee:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/availability/:day', async (req, res) => {
  const day = req.params.day
  try {
    const employees = await db.getAvailabilityByDay(day)
    res.json(employees || [])
  } catch (err) {
    console.error('error fetch schedule:', err)
    res.status(500).json({ error: 'Server Error' })
  }
})

app.get('/user/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const user = await db.getName(id);
    if (!user) return res.status(404).send('User Not Found');
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).send('Internal Server Error');
    }
});

app.get('/test', async (req, res) => {
  console.log("Testting session, ", req.session.userid)
})

app.get('/schedule/:day', async (req, res) => {
  const day = req.params.day
  try {
    const rows = await db.getEmployeeByDay(day)
    res.json(rows || [])
  } catch (err) {
    console.error('error fetch schedule:',err)
    res.status(500).send('Server Error')
  }
})

app.get('/api/employees', async (req, res) => {
  try {
    const employees = await db.getEmployees()
    res.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    res.status(500).send('Server Error')
  }
})

app.get('/employee/:id', async (req, res) => {
  const id = req.params.id
  try {
    const employee = await db.getEmployee(id)
    if (!employee) return res.status(404).send('Employee Not Found')
    res.json(employee)
  } catch (error) {
    console.error('Error fetching employee:', error)
    res.status(500).send('Internal Server Error')
  }
})



const port =  process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Running on port ${port}`)
})


