const mysql = require("mysql");
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Youssef1234",
  database: "real_estate_finder",
});
connection.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});
//     connection.query(x

module.exports = connection;
