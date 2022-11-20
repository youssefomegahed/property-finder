const express = require("express");
var bodyParser = require("body-parser");
const app = express();
const connection = require("./db");
const fs = require("fs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const port = 8080;

app.post("/userAvailable", (req, res) => {
  var email = req.body.email;
  var username = req.body.username;
  connection.query(
    "SELECT * FROM siteuser where Username=? or Email=?",
    [username, email],
    (err, result) => {
      if (err) throw err;
      if (result.length > 0) {
        res.send("User already exists");
      } else {
        res.send("Username and email are available");
      }
    }
  );
});

app.post("/registerUser", (req, res) => {
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;
  var gender = req.body.gender;
  var birthday = req.body.birthday;

  connection.query(
    "INSERT INTO siteuser (Email, Username, Gender, Birthdate, UserPassword) VALUES (?,?,?,?,?)",
    [email, username, gender, birthday, password],
    (err, result) => {
      if (err) {
        throw err;
      }
      res.send("You have registered successfully!");
    }
  );
});

app.post("/getAgent", (req, res) => {
  var agentName = req.body.agentName;
  var agentPhoneNumber = req.body.agentPhoneNumber;
  connection.query(
    "SELECT AgentName, BrokerCompanyPhoneNumber, ContactNumber FROM agent where AgentName=? or BrokerCompanyPhoneNumber=?",
    [agentName, agentPhoneNumber],
    (err, result) => {
      if (err) throw err;
      res.send(result);
    }
  );
});

app.post("/reviewAgent", (req, res) => {
  var agentPhoneNumber = req.body.agentPhoneNumber;
  var reviewText = req.body.reviewText;
  var rating = req.body.rating;
  var email = req.body.email;
  connection.query(
    "SELECT * FROM reviews where AgentContactNumber=? and UserEmail=?",
    [agentPhoneNumber, email],
    (err, result) => {
      if (err) throw err;
      if (result.length > 0) {
        res.send("You have already reviewed this agent");
      } else {
        connection.query(
          "INSERT INTO reviews (UserEmail, AgentContactNumber, ReviewText, ReviewScore) VALUES (?,?,?,?)",
          [email, agentPhoneNumber, reviewText, rating],
          (err, result) => {
            if (err) throw err;
            res.send("Success");
          }
        );
      }
    }
  );
});

app.post("/getReviews", (req, res) => {
  var agentPhoneNumber = req.body.agentPhoneNumber;
  connection.query(
    "SELECT ReviewText, ReviewScore FROM reviews where AgentContactNumber=?",
    [agentPhoneNumber],
    (err, result) => {
      if (err) throw err;
      console.log(result);
      console.log(result.length);
      res.send(result);
    }
  );
});

app.post("/getAgentProperties", (req, res) => {
  var agentPhoneNumber = req.body.agentPhoneNumber;
  connection.query(
    "SELECT PropertyID, Price, NumberOfBedrooms, NumberOfBathrooms, PropertyType, PaymentMethod, ListingDate, Size FROM property where AgentContactNumber=?",
    [agentPhoneNumber],
    (err, result) => {
      if (err) throw err;
      res.send(result);
    }
  );
});

app.post("/getAllCities", (req, res) => {
  connection.query("SELECT Distinct City FROM location", (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

app.post("/getAllAmenities", (req, res) => {
  connection.query(
    "SELECT Distinct amenity FROM propertyamenities",
    (err, result) => {
      if (err) throw err;
      res.send(result);
    }
  );
});

app.post("/getFilteredProperties", (req, res) => {
  var amenities = req.body.amenities;
  var city = req.body.city;
  var minPrice = req.body.minPrice;
  var maxPrice = req.body.maxPrice;

  minPrice = parseInt(minPrice);
  maxPrice = parseInt(maxPrice);

  amenities = [
    ...new Set(
      amenities.replace("[", "").replace("]", "").replaceAll('"', "").split(",")
    ),
  ];
  if (amenities.length == 1 && amenities[0] == "") {
    connection.query(
      "SELECT PropertyID, Price, NumberOfBedrooms, NumberOfBathrooms, PropertyType, PaymentMethod, ListingDate, Size, PropertyDescription FROM property P inner join location L on P.locationName = L.locationName where Price between ? and ? and L.city = ?",
      [minPrice, maxPrice, city],
      (err, result) => {
        if (err) throw err;
        res.send(result);
      }
    );
  } else {
    connection.query(
      "SELECT distinct P.PropertyID, Price, NumberOfBedrooms, NumberOfBathrooms, PropertyType, PaymentMethod, ListingDate, Size, PropertyDescription FROM property P inner join propertyamenities PA on P.PropertyID = PA.PropertyID inner join location L on P.locationName = L.locationName where Price between ? and ? and amenity in (?) and L.city = ?",
      [minPrice, maxPrice, amenities, city],
      (err, result) => {
        if (err) throw err;
        var new_result = [];
        for (var i = 0; i < result.length; i++) {
          if (
            result[i].PropertyDescription.toLowerCase().includes(
              city.toLowerCase()
            )
          ) {
            new_result.push(result[i]);
          }
        }
        console.log(new_result.length);
        res.send(new_result);
      }
    );
  }
});

app.post("/getUnitTypes", (req, res) => {
  connection.query(
    "SELECT Distinct PropertyType FROM property",
    (err, result) => {
      if (err) throw err;
      res.send(result);
    }
  );
});

app.post("/getBrokerPhone", (req, res) => {
  let brokerName = req.body.brokerName;

  connection.query(
    "SELECT PhoneNumber FROM brokercompany where CompanyName=?",
    [brokerName],
    (err, result) => {
      if (err) throw err;

      res.send(result);
    }
  );
});

app.post("/getBroker", (req, res) => {
  let brokerPhoneNumber = req.body.brokerPhoneNumber;
  connection.query(
    `select avg(R.ReviewScore) as avg from reviews R inner join agent A on A.ContactNumber = R.AgentContactNumber where BrokerCompanyPhoneNumber=${brokerPhoneNumber}`,
    (err, result) => {
      if (err) throw err;
      res.send(result);
    }
  );
});

app.post("/getTopBrokers", (req, res) => {
  connection.query(
    `select B.CompanyName, sum(P.Price) as total_price, sum(P.Size) as total_size, count(distinct ContactNumber) 
    as numOfAgents, count(P.PropertyID) as Listings 
    from brokercompany B inner join agent A on B.PhoneNumber+"\r" = A.BrokerCompanyPhoneNumber 
    inner join Property P on P.AgentContactNumber=A.ContactNumber 
    group by B.CompanyName 
    order by Listings desc 
    limit 5`,
    (err, result) => {
      if (err) throw err;
      res.send(result);
    }
  );
});

app.post("/getDevelopment", (req, res) => {
  let developmentName = req.body.developmentName + "\r";
  connection.query(
    `select AreaName, PropertyID, Price, PropertyType, Size, PropertyType
    from location L inner join property P on L.locationName = P.locationName 
    inner join developmentproject D on D.LocationName = L.locationName 
    where D.Developer='${developmentName}'`,
    (err, result) => {
      if (err) throw err;
      res.send(result);
    }
  );
});

app.post("/getAllPropertyTypes", (req, res) => {
  connection.query(
    "SELECT Distinct PropertyType FROM property",
    (err, result) => {
      if (err) throw err;
      res.send(result);
    }
  );
});

app.post("/getTopAreas", (req, res) => {
  let propertyType = req.body.propertyType;
  connection.query(
    `select AreaName, sum(Price) as total_price, sum(Size) as total_size, count(PropertyID) as listings from Location L
    inner join Property P on L.LocationName = P.LocationName
    where PropertyType='${propertyType}'
    group by 1
    order by listings desc
    limit 10`,
    (err, result) => {
      if (err) throw err;
      res.send(result);
    }
  );
});

app.listen(port, () => {
  console.log(`server started on port ${port}`);
});
