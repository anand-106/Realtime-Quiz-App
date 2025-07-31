const express = require("express");
const app = express();
const { PrismaClient } = require("@prisma/client");
const { jwtVerify } = require("./jwt.js");
const port = 3000;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cors = require("cors");

const JWT_SECRET = "jsgfhsvcjhvshcvsghj";

const prisma = new PrismaClient();
app.use(express.json());
app.use(cors());

const WebSocket = require("ws");
const wss = new WebSocket.Server({ server: app.listen(port) });

let clients = [];

wss.on("connection", (ws) => {
  console.log("Client connected");
  clients.push(ws);

  ws.on("close", () => {
    clients = clients.filter((client) => client !== ws);
    console.log("Client disconnected");
  });
});

let currentIndex = 0;
let allQuestions = [];

app.post("/admin/next", async (req, res) => {
  const { quizId, next } = req.body;

  if (currentIndex === 0) {
    allQuestions = await prisma.question.findMany({
      where: { quizId: quizId },
      orderBy: { position: "asc" },
    });
  }

  if (!next) {
    currentIndex -= 2;
  }

  if (currentIndex >= allQuestions.length) {
    clients.forEach((ws) => {
      ws.send(JSON.stringify({ TYPE: "END" }));
    });
  }

  const question = allQuestions[currentIndex];
  const options = await prisma.option.findMany({ where: { qId: question.id } });

  clients.forEach((ws) => {
    ws.send(
      JSON.stringify({
        TYPE: "NEXT_QUESTION",
        question: question,
        options: options,
      })
    );
  });

  currentIndex++;
  res.json({
    TYPE: "NEXT_QUESTION",
    question: question,
    options: options,
  });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;
  console.log(req.body);
  try {
    const user = await prisma.user.findUnique({ where: { email: email } });

    if (user) {
      return res.json({
        message: "user already exits",
      });
    }
    const hased_pass = await bcrypt.hash(password, 2);
    await prisma.user.create({
      data: { name, password: hased_pass, email, role },
    });
    res.json({
      message: "Signup successful",
    });
  } catch (e) {
    console.log(e);
  }
});

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json("user not found");
    }
    await bcrypt.compare(password, user.password);

    const token = jwt.sign({ email, role: user.role }, JWT_SECRET);
    res.json({
      token: token,
      message: "Signin successful",
    });
  } catch (e) {
    res.json(e);
  }
});

app.use(jwtVerify);

app.get("/profile", async (req, res) => {
  const { email, role } = req;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.json({
      message: "user not found",
    });
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});

app.get("/user/quiz", async (req, res) => {
  const username = req.username;

  const quiz = await prisma.quiz.findMany({ where: { isLive: true } });

  console.log("returning data :", quiz);

  res.json(quiz);
});

app.post("/quiz", async (req, res) => {
  const { questions, title } = req.body;
  const { email, role } = req;

  if (role != "ADMIN") {
    res.json({
      message: "not authorized",
    });
  }
  console.log("user authorized");
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({
        message: "User not found",
      });
    }
    console.log(user);
    const quiz = await prisma.quiz.create({
      data: { adminId: user.id, quizName: title },
    });
    console.log(quiz);

    for (const q of questions) {
      const createdData = await prisma.question.create({
        data: {
          id: q.id,
          text: q.title,
          quizId: quiz.id,
          answer: q.answer,
        },
      });

      console.log("questions created");
      const optionsData = [];

      for (const [key, value] of Object.entries(q)) {
        if (key.startsWith("option")) {
          optionsData.push({
            qId: createdData.id,
            text: value,
          });
        }
      }

      await prisma.option.createMany({ data: optionsData });
    }

    res.json({
      quizId: quiz.id,
      message: "Quiz created successfully",
    });
  } catch (e) {
    res.json(e);
  }
});

app.get("/quiz/:quizId", async (req, res) => {
  const { quizId } = req.params;

  const quiz = await prisma.quiz.findFirst({ where: { id: quizId } });
  const questions = await prisma.question.findMany({
    where: { quizId: quizId },
  });

  const questionsdata = [];
  for (const q of questions) {
    const options = await prisma.option.findMany({ where: { qId: q.id } });
    let counter = 0;
    let temp = {
      id: q.id,
      title: q.text,
    };
    const optKeys = ["option1", "option2", "option3", "option4"];
    for (let i = 0; i < options.length; i++) {
      Object.assign(temp, { [optKeys[i]]: options[i].text });
    }
    questionsdata.push(temp);
  }

  const resData = {
    id: quiz.id,
    title: quiz.quizName,
    questions: questionsdata,
  };
  res.json(resData);
});

app.post("/quiz/:quizId/submit", async (req, res) => {
  const { email } = req;
  const { quizId } = req.params;

  let score = 0;
  let total = 0;
  let isCorrect = false;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.json({
      message: "User not found",
    });
  }

  const { answers } = req.body;
  for (const ans of answers) {
    const question = await prisma.question.findUnique({
      where: { id: ans.questionId },
    });
    if (ans.selectedOption == question.answer) {
      score++;
      total++;
      isCorrect = true;
    } else {
      total++;
      isCorrect = false;
    }
    const result = await prisma.result.create({
      data: {
        userId: user.id,
        qid: question.id,
        answer: ans.selectedOption,
        isCorrect: isCorrect,
      },
    });
  }
  const leaderBoard = await prisma.leaderBoard.create({
    data: { quizId: quizId, userId: user.id, score, total, name: user.name },
  });
  res.json({
    score,
    total,
    message: "Submission evaluated",
  });
});

app.get("/result/:quizId", async (req, res) => {
  const { email } = req;
  const { quizId } = req.params;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.json({
      message: "User not found",
    });
  }

  const leaderBoard = await prisma.leaderBoard.findMany({
    where: {
      quizId: quizId,
    },
  });

  const leaderboardData = leaderBoard.map((lb) => {
    return {
      userId: lb.userId,
      name: lb.name,
      score: lb.score,
      totalQuestions: lb.total,
    };
  });

  res.json({
    results: leaderboardData,
  });
});

app.post("/user/test", async (req, res) => {
  const { quizId, questionId, answer } = req.body;
  // console.log(req.body);
  const username = req.username;
  // console.log(username);
  // console.log(quizId);

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.json("Not authorized");
    }

    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    console.log("================quiz-===============");
    console.log(quiz);

    const question = await prisma.question.findMany({
      where: { quizId: quiz.id },
    });
    console.log("============question==========");

    question.map(async (q) => {
      if (q.id == questionId) {
        await prisma.result.create({
          data: {
            userId: user.id,
            qid: q.id,
            answer: q.answer,
            quizId: quiz.id,
            isCorrect: q.answer == answer ? true : false,
          },
        });
      }
    });
    res.json("Answer submitted");
  } catch (e) {
    res.json(e);
  }
});

app.post("/quiz/result", async (req, res) => {
  const { quizId } = req.body;

  try {
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    console.log("================quiz-===============");
    console.log(quiz);
    const users = await prisma.user.findMany();

    for (const user of users) {
      const question = await prisma.question.findMany({
        where: { quizId: quiz.id },
      });
      console.log("============question===========");

      const result = await prisma.result.findMany();

      let marks = 0;

      result.map((resu) => {
        if (resu.userId == user.id && resu.isCorrect) {
          marks++;
        }
      });

      const final = await prisma.leaderBoard.create({
        data: {
          quizId: quiz.id,
          userId: user.id,
          marks: marks,
        },
      });
    }

    res.json("result generated");
  } catch (e) {
    res.json(e);
  }
});

app.post("/quiz/leaderboard", async (req, res) => {
  const { quizId } = req.body;

  try {
    const leaderBoard = await prisma.leaderBoard.findMany({
      where: {
        quizId: quizId,
      },
    });

    res.json(leaderBoard);
  } catch (e) {
    console.log(e);
  }
});
