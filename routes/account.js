const express = require("express");
const { authMiddleware } = require("../middleware");
const { Account } = require("../db");
const { mongoose } = require("mongoose");
const router = express.Router();

router.get("/balance", authMiddleware, async (req, res) => {
  const account = await Account.findOne({
    user: req.userId,
  });

  if (!account) {
    return res.status(404).json({
      message: "unable fetch the balance",
    });
  }
  res.json({
    balance: account.balance,
  });
});

router.post("/transfer", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const to = req.body.to;
  const amount = req.body.amount;
  const account = await Account.findOne({
    user: req.userId,
  }).session(session);

  if (account.balance < amount || !account) {
    await session.abortTransaction();
    return res.json({
      message: "invalid transaction or insufficient balance",
    });
  }

  const toAccount = await Account.findOne({
    user: to,
  }).session(session);

  if (!toAccount) {
    await session.abortTransaction();
    return res.status(411).json({
      message: "invalid account",
    });
  }

  await Account.updateOne(
    {
      user: req.userId,
    },
    {
      $inc: {
        balance: -amount,
      },
    }
  ).session(session);

  await Account.updateOne(
    {
      user: to,
    },
    {
      $inc: {
        balance: amount,
      },
    }
  ).session(session);

  await session.commitTransaction();
  session.endSession();
  res.json({
    message: "transaction successful",
  });
});
module.exports = router;
