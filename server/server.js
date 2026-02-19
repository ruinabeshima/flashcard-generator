const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173"
}))

require("dotenv").config();

app.use("/", (req, res) => {
  res.send("Hello World");
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
