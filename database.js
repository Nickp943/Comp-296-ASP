
const mysql = require('mysql2')
require('dotenv').config()

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()

pool.getConnection()
    .then(conn => {conn.release(); console.log('MySQL Connected') })
    .catch(err => {console.error('MySQL Connection Error:', err)})


async function getEmployees() {
    const [rows] =  await pool.query(`
        SELECT * 
        FROM employee
        WHERE NOT manager = '1'`)
    return rows
}
async function getEmployee(id) {
    const [rows] = await pool.query(`
        SELECT *
        From employee
        WHERE id = ?
        `, [id])
        return rows [0]
}

async function validateUser(username, password) {
    const [rows] = await pool.query(`
        SELECT *
        FROM employee
        WHERE username = ?
        limit 1
        `, [username])   

    if (!rows || rows.length ===0) return null
    const user = rows[0]
    if (user.password === password) return user
    return null
}

module.exports = { getEmployees, getEmployee, validateUser}
