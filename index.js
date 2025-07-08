const express = require("express");
const app = express();
const { PrismaClient } = require("@prisma/client");
const port = 3000;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const JWT_SECRET = "jsgfhsvcjhvshcvsghj";

const prisma = new PrismaClient();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/admin/signup", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.admin.findUnique({ where: { username } });
    if (user) {
      return res.json("user already exits");
    }
    const hased_pass = await bcrypt.hash(password, 2);
    await prisma.admin.create({ data: { username, password: hased_pass } });
    res.json("user Created");
  } catch (e) {
    console.log(e);
  }
});

app.post("/admin/signin", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.admin.findUnique({ where: { username } });
    if (!user) {
      return res.json("user not found");
    }
    await bcrypt.compare(password, user.password);

    const token = jwt.sign({ username }, JWT_SECRET);
    res.json({ token: token });
  } catch (e) {
    res.json(e);
  }
});

function jwtVerify(req, res, next) {
  const token = req.headers.token;

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.json({ error: "invalid or expired token" });
    console.log("the decoded token is:", decoded);
    req.username = decoded.username;
    next();
  });
}

app.use(jwtVerify);

app.post("/admin/create", async (req, res) => {
  const { questions } = req.body;
  const username = req.username;

  try {
    const user = await prisma.admin.findUnique({ where: { username } });
    if (!user) {
      return res.json("Not authorized");
    }
    console.log(user);
    const quiz = await prisma.quiz.create({ data: { adminId: user.id } });
    console.log(quiz);

    const questionWithId = questions.map((q) => ({
      ...q,
      quizId: quiz.id,
    }));

    const question = await prisma.question.createMany({ data: questionWithId });
    console.log(question);
    res.json("quiz created");
  } catch (e) {
    res.json(e);
  }
});

app.patch("/admin/update", async (req, res) => {
  const { questions } = req.body;
  const username = req.username;

  try {
    const user = await prisma.admin.findUnique({ where: { username } });
    if (!user) {
      return res.json("Not authorized");
    }
    console.log(user);
    const quiz = await prisma.quiz.findFirst({ where: { adminId: user.id } });
    console.log(quiz);

    const updates = questions.map((q) =>
      prisma.question.update({
        where: { id: q.id },
        data: {
          text: q.text,
          option1: q.option1,
          option2: q.option2,
          option3: q.option3,
          option4: q.option4,
          answer: q.answer,
        },
      })
    );

    await Promise.all(updates);

    res.json("quiz created");
  } catch (e) {
    res.json(e);
  }
});

app.post("/user/test", async (req, res) => {
  const { questions } = req.body;
  const username = req.username;

  try {
    const user = await prisma.admin.findUnique({ where: { username } });
    if (!user) {
      return res.json("Not authorized");
    }

    const quiz = await prisma.quiz.findFirst({ where: { adminId: user.id } });
    console.log(quiz);

    const question = await prisma.question.findMany({
      where: { quizId: quiz.id },
    });

    const answerMap = {};
    question.forEach((q) => {
      answerMap[q.id] = q.answer;
    });

    console.log("The answers is" + answerMap);

    const result = questions.map((q) => ({
      id: q.id,
      answer: q.answer,
      result: q.answer == answerMap[q.id],
    }));

    console.log(result);

    res.json(result);
  } catch (e) {
    res.json(e);
  }
});

app.post("/user/signup", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (user) {
      return res.json("user already exits");
    }
    const hased_pass = await bcrypt.hash(password, 2);
    await prisma.user.create({ data: { username, password: hased_pass } });
    res.json("user Created");
  } catch (e) {
    console.log(e);
  }
});

app.post("/user/signin", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.json("user not found");
    }
    await bcrypt.compare(password, user.password);

    const token = jwt.sign({ username }, JWT_SECRET);
    res.json({ token: token });
  } catch (e) {
    res.json(e);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
