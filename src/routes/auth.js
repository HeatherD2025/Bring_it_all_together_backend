const express = require("express");
const { isLoggedIn } = require("../middleware/isLoggedIn");
const router = express.Router();
const { bcrypt, prisma, jwt } = require("../common/common");
const {
  register,
  login,
  getMe,
  getAllUsers,
} = require("../controllers/authController");

function middleware(req, res, next) {
  if (req.headers?.authorization?.split(" ")[1]) {
    next();
  } else {
    res.status(401).send("Please log in again");
  }
}

router.post("/login", login);
router.post("/register", register);
router.get("/me", middleware, getMe);
router.get("/getAllUsers", isLoggedIn, getAllUsers);

module.exports = router;
