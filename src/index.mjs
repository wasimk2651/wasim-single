/* Import dependencies */
import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import DatabaseService from "./services/database.service.mjs";
import session from "express-session";
import Country from "./models/country.mjs";

/* Create express instance */
const app = express();
const port = 3000;

/* Add form data middleware */
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "verysecretkey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Integrate Pug with Express
app.set("view engine", "pug");

// Serve assets from 'static' folder
app.use(express.static("static"));

const db = await DatabaseService.connect();
const { conn } = db;

/* Landing route */
app.get("/", (req, res) => {
  res.render("index");
});



// Landing route
app.get("/", (req, res) => {
  res.render("index");
});



// About route
app.get("/about", (req, res) => {
  res.render("about", { title: "About Page" });
});

app.get("/cities", async (req, res) => {
  const [rows, fields] = await db.getCities();
  /* Render cities.pug with data passed as plain object */
  return res.render("cities", { rows, fields });
});

app.get("/cities/:id", async (req, res) => {
  const cityId = req.params.id;
  const city = await db.getCity(cityId);
  return res.render("city", { city });
});

/* Update a city by ID */
// Search for cities
app.get("/cities", async (req, res) => {
  const query = req.query.q;
  let [rows, fields] = [[], []];

  if (query) {
    // Search cities by name
    [rows, fields] = await db.searchCities(query);
  } else {
    // Get all cities
    [rows, fields] = await db.getCities();
  }

  // Render cities.pug with data passed as plain object
  return res.render("cities", { rows, fields, query });
});

// Update a city by ID
app.post("/cities/:id", async (req, res) => {
  const cityId = req.params.id;
  const { name } = req.body;
  const sql = `
    UPDATE city
    SET Name = '${name}'
    WHERE ID = '${cityId}';
  `;
  await pool.execute(sql);
  return res.redirect(`/cities/${cityId}?updated=true`);
});
// City search route
app.get("/search", async (req, res) => {
  const city = req.query.city;
  if (!city) {
    // If no city name is provided, return an empty page
    return res.render("search");
  }
  try {
    const [rows, fields] = await conn.execute(
      `SELECT * FROM city WHERE Name LIKE '%${city}%'`
    );
    // Render the search results in a table
    return res.render("search-results", { rows, fields });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal server error");
  }
}); 
app.get("/country-search", async (req, res) => {
  const Country = req.query.Country;
  if (!Country) {
    // If no city name is provided, return an empty page
    return res.render("country-search");
  }
  try {
    const [rows, fields] = await conn.execute(
      `SELECT * FROM country WHERE Name LIKE '%${Country}%'`
    );
    // Render the search results in a table
    return res.render("country-results", { rows, fields });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal server error");
  }
}); 

// Returns JSON array of cities
app.get("/api/cities", async (req, res) => {
  const [rows, fields] = await db.getCities();
  return res.send(rows);
});

app.get("/api/countries", async (req, res) => {
  const countries = await db.getCountries();
  res.send(countries);
});

/* Authentication */

// Register
app.get("/register", (req, res) => {
  res.render("register");
});

// Login
app.get("/login", (req, res) => {
  res.render("login");
});

// Account
app.get("/account", async (req, res) => {
  const { auth, userId } = req.session;

  if (!auth) {
    return res.redirect("/login");
  }

  const sql = `SELECT id, email FROM user WHERE user.id = ${userId}`;
  const [results, cols] = await conn.execute(sql);
  const user = results[0];

  res.render("account", { user });
});

app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const sql = `INSERT INTO user (email, password) VALUES ('${email}', '${hashed}')`;
    const [result, _] = await conn.execute(sql);
    const id = result.insertId;
    req.session.auth = true;
    req.session.userId = id;
    return res.redirect("/account");
  } catch (err) {
    console.error(err);
    return res.status(400).send(err.sqlMessage);
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(401).send("Missing credentials");
  }

  const sql = `SELECT id, password FROM user WHERE email = '${email}'`;
  const [results, cols] = await conn.execute(sql);

  const user = results[0];

  if (!user) {
    return res.status(401).send("User does not exist");
  }

  const { id } = user;
  const hash = user?.password;
  const match = await bcrypt.compare(password, hash);

  if (!match) {
    return res.status(401).send("Invalid password");
  }

  req.session.auth = true;
  req.session.userId = id;

  return res.redirect("/account");
});
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/login');
    } 
  });
});

// Run server!
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
