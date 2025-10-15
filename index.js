const express = require('express')

const app = express()

const port = 3000

const path = require('path')

app.use(express.static(path.join(__dirname , 'static')))


app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
