const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const app = express()


let initialPath = path.join(__dirname, "public")
app.use(express.static(initialPath))

app.get('/', (req, res) => {
  res.sendFile(path.join(initialPath, "login.html"))
})

const port = 3000
app.listen(port, (req, res) => {
  console.log(`Running on port ${port}`)
})





