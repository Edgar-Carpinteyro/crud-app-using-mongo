const express = require("express");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const app = express();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const PORT = 3000;
require("dotenv").config({ path: ".env" });

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.post("/users", (req, res) => {
  const { username, password, title, body } = req.body;

  prisma.user
    .create({
      data: {
        username,
        password,
        posts: {
          create: {
            title,
            body,
          },
        },
      },
    })

    .then((result) => {
      res.redirect("/");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    });
});

MongoClient.connect(process.env.MONGO_URI)
  .then((client) => {
    const db = client.db("practice");
    const usersCollection = db.collection("users");

    app.get("/", async (req, res) => {
      const body = { users: null, posts: null };

      const users = await prisma.user
        .findMany()
        .then((results) => {
          body.users = results;
        })
        .catch((error) => console.error(error));

      const posts = await prisma.post
        .findMany()
        .then((results) => {
          body.posts = results;
        })
        .catch((error) => console.error(error));

      res.render("index.ejs", { body: body });
    });

    app.put("/users", (req, res) => {
      usersCollection
        .findOneAndUpdate(
          { username: req.body.username },
          {
            $set: {
              username: req.body.username,
              password: req.body.password,
            },
          },
          {
            upsert: false,
          },
          {
            returnNewDocument: true,
          }
        )
        .then((result) => {
          res.json("Success");
          return res;
        })
        .catch((error) => console.error(error));
    });

    app.delete("/users", (req, res) => {
      usersCollection
        .deleteOne({ username: req.body.username })
        .then((result) => {
          console.log(`Deleted ${req.body.username}`);
          console.log(result);
          res.json("Deleted user");
        })
        .catch((error) => console.error(error));
    });
  })

  .catch((error) => console.error(error));

app.listen(PORT, function () {
  console.log(`Server is live! Listening at port ${PORT}`);
  // if this does not work, remember to save your file aft
});
