const express = require("express");
const mongoose = require("mongoose");
const rootRouter = require("./routes/index");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT;
mongoose.connect(process.env.MONGO_URL);
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/v1", rootRouter);

app.listen(port, () => {
  console.log(`server started at ${port}`);
});
