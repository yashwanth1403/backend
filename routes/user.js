const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const zod = require("zod");
const { JWT_secret } = require("../config");
const { User, Account } = require("../db");
const { authMiddleware } = require("../middleware");

const userSchema = zod.object({
  username: zod.string(),
  firstname: zod.string(),
  lastname: zod.string(),
  password: zod.string(),
});

const signSchema = zod.object({
  username: zod.string(),
  password: zod.string(),
});

const updateSchema = zod.object({
  password: zod.string().min(8).optional(),
  firstname: zod.string().optional(),
  lastname: zod.string().optional(),
});

router.post("/signup", async (req, res) => {
  const { success } = userSchema.safeParse(req.body);
  if (!success) {
    return res.status(411).json({
      msg: "invalid inputs",
    });
  }
  const existing_user = await User.findOne({
    username: req.body.username,
  });

  if (existing_user) {
    return res.status(411).json({
      msg: "user already exists",
    });
  }

  const user = await User.create({
    username: req.body.username,
    password: req.body.password,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
  });
  const userid = user._id;

  const account = await Account.create({
    user: userid,
    balance: 1 + Math.random() * 1000,
  });
  const token = jwt.sign(
    {
      userid,
    },
    JWT_secret
  );

  res.json({
    message: "User successfully created",
    token: token,
  });
});

router.post("/signin", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const { success } = signSchema.safeParse(req.body);
  if (!success) {
    return res.status(411).json({
      message: "invalid username or password1",
    });
  }
  const user = await User.findOne({ username, password });
  if (user) {
    const token = jwt.sign(
      {
        userid: user._id,
      },
      JWT_secret
    );
    return res.json({
      token,
    });
  } else {
    res.status(411).json({
      message: "invalid username or password",
    });
  }
});

router.put("/", authMiddleware, async (req, res) => {
  const { success } = updateSchema.safeParse(req.body);
  if (!success) {
    return res.status(411).json({ message: "error in inputs" });
  }
  const id = req.userId;
  console.log(req);
  const user = await User.updateOne(
    {
      _id: id,
    },
    {
      password: "yashu",
    }
  );
  console.log(req.body);
  res.json({
    message: "Updated successfully",
  });
});

router.get("/bulk", async (req, res) => {
  const filter = req.query.filter || "";
  const users = await User.find({
    $or: [
      {
        firstname: {
          $regex: filter,
        },
      },
      {
        lastname: {
          $regex: filter,
        },
      },
    ],
  });

  res.json({
    user: users.map((user) => ({
      userName: user.username,
      firstName: user.firstname,
      lastName: user.lastname,
      _id: user.id,
    })),
  });
});

router.post("/userdetails", async (req, res) => {
  const token = req.body.token;
  const decode = jwt.decode(token);
  if (decode) {
    try {
      const user = await User.findById(decode.userid);
      return res.json({
        name: user.firstname,
        user,
      });
    } catch (e) {
      res.status(411).json({
        message: "invalid token",
      });
    }
  } else {
    res.status(411).json({
      message: "invalid token",
    });
  }
});
module.exports = router;
