import mysql from 'mysql2'
import dotenv, { config } from 'dotenv'
dotenv.config()

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()

async function getEmployees() {
    const [rows] =  await pool.query("SELCET * FROM employee")
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



