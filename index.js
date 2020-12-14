const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const port = 4242;

const db = require('./queries');

app.use(bodyParser.json());
app.options("*",cors());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use((req,res,next)=>{
  res.header('Access-Control-Allow-Origin','*');
  next();
})

app.get("/", (request, response) => {
  response.json({ info: "Node.js, Express, and Postgres API" });
});

app.post('/add-visitor-entry', db.addVisitorEntry);

app.get('/get-visitors/:srchParam', db.getvisitors);

app.get('/get-logs/:startTs/:endTs/:phno', db.getLogs);

app.post('/set-visitor-exit', db.setVisitorExit);

app.listen(port, () => {
  console.log(`App running on port ${port}.`)
});