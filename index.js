const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const app = express()
const db = require('./database')


let initialPath = path.join(__dirname, "public")
app.use(express.static(initialPath))

app.use(express.json({limit:'10mb'}))
app.use(express.urlencoded({ extended: false }))


app.get('/', (req, res) => {
  res.sendFile(path.join(initialPath, "login.html"))
})

app.post('/login', async (req, res) => {
  const { username, password } = req.body
  if(!username || !password) return res.status(400).send('Username and Password are required')
  try {
    const user = await db.validateUser (username, password)
    if (!user) return res.status(401).send('Invalid Username or Password')
    return res.redirect('/home.html')
  } catch (error) {
    console.error('login Error:', error)
    return res.status(500).send('Internal Server Error')
  }
})

app.get('/employees', async (req, res) => {
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



