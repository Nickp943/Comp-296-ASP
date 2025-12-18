
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
        WHERE NOT manager = '1'
        ORDER BY last_name, first_name
        `)
    return rows
}

async function getEmployee(id) {
    const [rows] = await pool.query(`
        SELECT *
        From employee
        WHERE employee_id = ?
        `, [id])
        return rows [0]
}

async function getAvailability(id) {
    const [rows] = await pool.query(`
        SELECT * 
        FROM availability 
        WHERE employee_id = ?
    `, [id])
    return rows 
}

async function getName(id) {
    const [rows] = await pool.query(`
        SELECT first_name
        FROM employee
        WHERE employee_id = ?
        `, [id])
        return rows [0]
}

async function getEmployeeByDay(day) {
    const [rows] = await pool.query(`
        SELECT  
            e.employee_id, 
	        CONCAT(e.last_name, ", ", e.first_name) as full_name, 
            s.week, 
            s.day, 
	        CONCAT(s.start_time, "-", s.end_time) as shift_time, 
            s.shift
        FROM employee as e
        JOIN employee_schedule as es ON e.employee_id = es.employee_id 
        JOIN schedule_info as s ON es.schedule_id = s.schedule_id
        WHERE s.day = ?
        `,[day])
        if (!rows || rows.length === 0) return null
        return rows
}

async function getScheduledEmployee(date) {
    const [rows] = await pool.query(`
        SELECT  
            e.employee_id, 
	        CONCAT(e.last_name, ", ", e.first_name) as full_name, 
            s.week, 
            s.day, 
	        CONCAT(s.start_time, "-", s.end_time) as shift_time, 
            s.shift
        FROM employee as e
        JOIN employee_schedule as es ON e.employee_id = es.employee_id 
        JOIN schedule_info as s ON es.schedule_id = s.schedule_id
        WHERE s.week = ?
        `, [date])
        if (!rows || rows.length === 0) return null
        return rows
}

async function getAvailabilityByDay(day) {
    const [rows] = await pool.query(`
        SELECT 
            e.employee_id,
            CONCAT(e.first_name, ' ', e.last_name) as name,
            a.weekday,
            a.morn_aval,
            a.night_aval
        FROM availability a
        JOIN employee e ON a.employee_id = e.employee_id
        WHERE a.weekday = ?
        ORDER BY e.last_name, e.first_name
    `, [day])
    return rows
}

async function validateUser(username, password, req) {
    const [rows] = await pool.query(`
        SELECT *
        FROM employee
        WHERE username = ?
        limit 1
        `, [username])   

    if (!rows || rows.length === 0) return null
    const user = rows[0]
    if (user.password === password){
        req.session.userid = user.employee_id
         return user   
    }
    return null
}

async function createEmployee(data) {
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()

        const { first_name = null, last_name = null, email = null, phonenumber = null, username = null, password = null, manager = 0} = data
        
        const [result] = await conn.query(`
            INSERT INTO employee (first_name, last_name, email, phonenumber, username, password, manager)
            VALUES (?, ? , ? , ? , ? , ? , ?)
            `, [first_name, last_name, email, phonenumber, username, password, manager]
        )

        if (!result || !result.insertId) {
            await conn.rollback();
            conn.release();
            return null;
        }

        const employeeId = result.insertId;

        const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
        const values = days.map(d => [employeeId, d, 0, 0])

        await conn.query(`
            INSERT INTO availability (employeeid, weekday, morn_aval, night_aval)
            VALUES ?
            `, [values]
        )

        await conn.commit()
        conn.release()

        return getEmployee(employeeId)

    } catch (err) {
        try { await conn.rollback() } catch (_) {}
        conn.release()
        console.error('Error Creating Employee', err)
        throw err    
    }

}

async function updateUser(id, fields) {
    const allowed = ['username','email','phonenumber','password','first_name','last_name']
    const keys = Object.keys(fields).filter(k => allowed.includes(k))
    if (keys.length === 0) return null

    const assignments = keys.map(k => `${k} = ?`).join(', ')
    const values = keys.map(k => fields[k])
    values.push(id)

    const sql = `UPDATE employee SET ${assignments} WHERE employee_id = ?`
    const [result] = await pool.query(sql, values)
    return result.affectedRows > 0
}

async function updateAvailability(id, availability = []) {
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const values = []
        
        days.forEach(day => {
            const av = availability[day] || { morn_aval: 0, night_aval: 0 }
            values.push([id, day, av.morn_aval || 0, av.night_aval || 0])
        })
        
        if (values.length > 0) {
            await conn.query(`
                INSERT INTO availability (employee_id, weekday, morn_aval, night_aval) 
                VALUES ?`,[values]
            )
        }
        
        await conn.commit()
        return true
    } catch (err) {
        await conn.rollback()
        throw err
    } finally {
        conn.release()
    }
}

module.exports = {
    getEmployees,
    getEmployee,
    validateUser,
    getScheduledEmployee,
    getEmployeeByDay, 
    getName, 
    updateUser, 
    updateAvailability, 
    getAvailability, 
    createEmployee,
    getAvailabilityByDay
}
