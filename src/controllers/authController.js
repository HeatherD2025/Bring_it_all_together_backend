const { router, bcrypt, prisma, jwt } = require("../common/common");
require("dotenv").config();

const getMe = async (req, res) => {
  try {
    const tokenWithBearer = req.headers.authorization || "";
    const token = tokenWithBearer.split(" ")[1];
    console.log(token);
    if (!token) {
      return res.status(401).json({
        statusCode: 401,
        message: "Authentication required",
      });
    }

    const loggedIn = jwt.verify(token, process.env.WEB_TOKEN);
    const user = await prisma.user.findUnique({
      where: { id: loggedIn.id },
    });

    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
      });
    }

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({
      message: "invalid token",
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  console.log("email", email); // Log the email
  console.log("password", password); // Log the password

  try {
    const user = await prisma.user.findFirst({
      where: { email },
    });

    console.log("User from DB", user); // Log the user object

    if (!user) {
      console.log("User not found"); // Log if user is not found
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    console.log("isPasswordValid", isPasswordValid); // Log the password validation result

    if (!isPasswordValid) {
      console.log("Invalid password"); // Log if password is invalid
      return res.status(401).json({
        statusCode: 401,
        message: "Login denied",
      });
    }

    console.log("Creating JWT token with secret:", process.env.WEB_TOKEN); // Log the secret used for JWT

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.WEB_TOKEN
    );

    console.log("Token created successfully");

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      statusCode: 500,
      message: "Server error",
    });
  }
};

const register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const registerUser = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
    },
  });
  console.log(registerUser);
  if (registerUser) {
    const token = jwt.sign(
      {
        email,
      },
      process.env.WEB_TOKEN,
      { expiresIn: "24h" }
    );
    const obj = {
      registerUser,
      token,
    };
    res.json(obj);
  } else {
    res.send("Something didn't work");
  }
};

module.exports = {
  login,
  register,
  getMe,
};
