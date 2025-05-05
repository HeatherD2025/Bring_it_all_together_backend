const { router, bcrypt, prisma, jwt } = require("../common/common");
require("dotenv").config();
const { isLoggedIn } = require("../middleware/isLoggedIn");

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
      process.env.SECRET,
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

const getAllUsers = async (req, res) => {
  try {
    const allUsers = await prisma.user.findMany();
    if (allUsers.length > 0) {
      res.send(allUsers);
    } else {
      !user;
      return res.status(404).json({
        statusCode: 404,
        message: "No users found.",
      });
    }
  } catch (error) {
    console.error(error);
  }
};

const getUserById = async (req, res) => {
  const userId = req.params.userid;
  try {
    const getUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!getUser) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found. Check userId",
      });
    }
    res.status(200).json(getUser);
  } catch (error) {
    console.error(error);
  }
};

const deleteUserById = async (req, res) => {
  const userId = req.params.userid;
  try {
    const deleteUser = await prisma.user.delete({
      where: {
        id: userId,
      },
    });
    res.status(204).json(deleteUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      statusCode: 500,
      message: "An error occurred while deleting the user",
    });
  }
};

// const updateUserProfile = async (req, res, next) => {
//   const { userId } = req.params;
//   const { firstName, lastName, email, password  } = req.body;
//   try {
//     const token = req.headers.authorization?.replace("Bearer ", "");
//     if (!token)
//       return res.status(401).json({ message: "Authorization token required" });
//     const decoded = jwt.verify(token, SECRET);
//     const authenticatedUserId = decoded.id;
//     if (authenticatedUserId !== userId) {
//       return res
//         .status(403)
//         .json({ message: "You do not have permission to update this review." });
//     }
//     const review = await prisma.review.findUnique({
//       where: { id: userId },
//     });
//     if (!review) {
//       return res.status(404).json({ message: "Review not found" });
//     }
//     if (review.userId !== userId) {
//       return res.status(403).json({ message: "You do not own this review." });
//     }
//     const updatedReview = await prisma.review.update({
//       where: { id: reviewId },
//       data: {
//         rating,
//         comments: comments
//           ? {
//               create: [
//                 {
//                   text: comments,
//                   user: {
//                     connect: { id: authenticatedUserId },
//                   },
//                 },
//               ],
//             }
//           : undefined,
//       },
//       include: {
//         comments: true,
//       },
//     });

const updateUserProfile = async (req, res, next) => {
  const objUserId = req.params;
  const { firstName, lastName, email, password } = req.body;
  const userId = objUserId.userid;
  try {
    if (!userId) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
      });
    }
    if (password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          statusCode: 4401,
          message: "Login denied",
        });
      }

      // Generate new hashed password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          email: email,
          password: hashedPassword,
          firstName: firstName,
          lastName: lastName,
        },
      });

      const token = jwt.sign(
        // { id: user.id, username: user.email },
        { id: updatedUser.id, username: updatedUser.email },
        process.env.WEB_TOKEN
      );
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;

      res.status(200).json({
        user: userWithoutPassword,
        token,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      statusCode: 500,
      message: "Server error",
    });
  }
};

// try {
// const token = req.headers.authorization?.replace("Bearer ", "");
//     if (!token)
//       return res.status(401).json({ message: "Authorization token required" });

//     const decoded = jwt.verify(token, SECRET);
//     const authenticatedUserId = decoded.id;

//     if (authenticatedUserId !== userId) {
//       return res
//         .status(403)
//         .json({ message: "You do not have permission to update this profile" });
//     }
//     const review = await prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!user) {
//       return res.status(404).json({ message: "U not found" });
//     }
//     if (review.userId !== userId) {
//       return res.status(403).json({ message: "You do not own this review." });
//     }

//     const updatedReview = await prisma.review.update({
//        where: { id: reviewId },
//        data: {
//         rating,
//         comments: {
//         create: [{ text: comments }],
//         },
//       },
//     });
//     res.status(200).json(updatedReview);
//   } catch (error) {
//     console.error("Error updating review", error);
//     res.status(500).json({ message: "Server error fetching your reviews" });
//   }
// };

module.exports = {
  login,
  register,
  getMe,
  getAllUsers,
  getUserById,
  deleteUserById,
  updateUserProfile,
};
