const express = require("express");
const router = new express.Router();
const auth = require('../middleware/auth');

//SignIn, SignUp, Authentication
router.get("/login", async (req, res) => {
  res.render("login",{title:'Login'});
});

router.get("/signup", async (req, res) => {
    res.render("signup",{title:'Signup'});
});

router.get("/logout", async (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.redirect("/");
});


//Dashboard
router.get("/dashboard", auth, async (req, res) => {
    res.render("dashboard",{title:'Dashboard'});
});

router.get("/tasks/create", auth, async (req, res) => {
  res.render("createtask",{title:'Create', layout: './layouts/sidebar'});
});


module.exports = router;
