const mysql = require("mysql");
const express = require("express");

const router = new express.Router();

router.post("/user", (req, res) => {
  const connection = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "Youssef1234",
    database: "Real-Estate Finder",
  });

  connection.connect();

  const {
    email: email,
    username: username,
    gender: gender,
    birthday: birthday,
    password: password,
  } = req.body;

  connection.query(
    `INSERT INTO siteuser VALUES ('${email}',${username},${gender},${birthday},${password})`,
    function (err, result, fields) {
      if (err) throw err;
      res.send(result);
      connection.end();
    }
  );
});

module.exports = router;
