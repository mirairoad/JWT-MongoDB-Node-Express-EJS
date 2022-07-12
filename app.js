require('dotenv').config()
const express = require("express");
const expressLayouts = require('express-ejs-layouts')
const morgan = require("morgan");
require("./config/dbConn");
const port = process.env.PORT || 3001;
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const { logger } = require("./middleware/logEvents");
const errorHandler = require("./middleware/errorHandler");
const cookieParser = require("cookie-parser");
const credentials = require("./middleware/credentials");
const { checkUser } = require("./middleware/frontendAuth");

const userRouter = require("./routers/user");
const frontendRouter = require("./routers/frontend");
const taskRouter = require("./routers/task");

// Express declaration
const app = express();

// Logger Declaration
app.use(logger);

// Handle options credentials check - before CORS!
app.use(credentials);
app.use(cors(corsOptions));

// Built-in middleware to handle urlencoded form data
app.use(express.urlencoded({ extended: true }));

// Middleware
app.use(express.static("public"));
app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

// Viewengine (optional), with Templating Engine
app.use(expressLayouts)
app.set('layout', './layouts/full-width')
app.set("view engine", "ejs");

// FrontEndRoutes
app.get("*", checkUser);
app.get("/", (req, res) => res.render("index", {title: 'Landing'}));

// API Routes
app.use(userRouter);
app.use(frontendRouter);
app.use(taskRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log("Server is up on port " + port);
});
