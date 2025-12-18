const path = require('path');
const db = require('./database');

let initialPath = path.join(__dirname, "/../public/")

const router = function(app){

    app.get('/', (req, res) => {
      res.sendFile(path.join(initialPath + "login.html"))
    })

     app.get('/home', (req, res) => {
      res.sendFile(path.join(initialPath + "home.html"))
    })

    app.get('/account', (req, res) => {
      res.sendFile(path.join(initialPath + "account.html"))
    })

    app.get('/managerhome', requireManager, (req, res) => {
        res.sendFile(path.join(initialPath, 'managerhome.html'))
    })

    app.get('/manageraccount', requireManager, (req, res) => {
        res.sendFile(path.join(initialPath, 'manageraccount.html'))
    })

};

function requireManager(req, res, next) {
  if (!req.session || !req.session.userid || !req.session.isManager) return res.redirect('/')
  next()
}


module.exports = router;
