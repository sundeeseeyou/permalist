import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const pool = new pg.Pool({
  user: "postgres",
  host: "localhost",
  database: "permalist",
  password: "123",
  port: 5432,
});

const client = await pool.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let items = [];

app.get("/", async (req, res) => {
  const result = await client.query('SELECT * FROM items ORDER BY id ASC');
  items = result.rows;
  res.render("index.ejs", {
    listTitle: "Today",
    listItems: items,
  });
});

app.post("/add", async (req, res) => {
  const item = req.body.newItem;
  try {
    await client.query('INSERT INTO items (title) VALUES ($1)',[item]);
    items.push({ title: item });
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }

});

app.post("/edit", async (req, res) => {
  const id = req.body.updatedItemId;
  const item = req.body.updatedItemTitle;

  try {
    await client.query('UPDATE items SET title = $1 WHERE id = $2',[item,id]);
    items.push({ title: item });
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }

});
  

app.post("/delete", async (req, res) => {
  const id = req.body.deleteItemId;
  
  try {
    const client = await pool.connect();
    await client.query('DELETE FROM items WHERE id = $1',[id]);
    // Update the items array by removing the deleted item
    items = items.filter(item => item.id !== parseInt(id));
    res.redirect("/");
    
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  } finally {
    if (client) client.release();
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
   // Close the pool when the server is stopped
   process.on("SIGINT", async () => {
    console.log("Closing database connection pool on application shutdown...");
    await pool.end();
    process.exit();
  });
});
