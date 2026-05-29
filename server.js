require("dotenv").config();

const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME;

let db;
let collection;

function isValidBook(book) {
    if (!book.name) return "name is required.";
    if (!book.author) return "author is required.";
    if (book.year === undefined) return "year is required.";
    if (book.price === undefined) return "price is required.";

    if (typeof book.name !== "string") return "name must be a string.";
    if (typeof book.author !== "string") return "author must be a string.";
    if (typeof book.year !== "number") return "year must be a number.";
    if (typeof book.price !== "number") return "price must be a number.";

    return null;
}

app.get("/api/health", async (req, res) => {
    try {
        await db.command({ ping: 1 });
        res.json({ status: "OK", database: "connected" });
    } catch (error) {
        res.status(500).json({ error: "Database connection failed." });
    }
});

app.get("/api/books", async (req, res) => {
    const query = req.query;
    const filter = {};

    if (query.author) {
        filter.author = query.author;
    }

    if (query.minPrice || query.maxPrice) {
        filter.price = {};

        if (query.minPrice) {
            filter.price.$gte = Number(query.minPrice);
        }

        if (query.maxPrice) {
            filter.price.$lte = Number(query.maxPrice);
        }
    }

    if (query.minYear || query.maxYear) {
        filter.year = {};

        if (query.minYear) {
            filter.year.$gte = Number(query.minYear);
        }

        if (query.maxYear) {
            filter.year.$lte = Number(query.maxYear);
        }
    }

    const books = await collection.find(filter).toArray();
    res.json(books);
});

app.get("/api/books/:id", async (req, res) => {
    try {
        const book = await collection.findOne({
            _id: new ObjectId(req.params.id)
        });

        if (!book) {
            return res.status(404).json({ error: "Book not found." });
        }

        res.json(book);
    } catch (error) {
        res.status(400).json({ error: "Invalid book id." });
    }
});

app.post("/api/books", async (req, res) => {
    const error = isValidBook(req.body);

    if (error) {
        return res.status(400).json({ error });
    }

    const result = await collection.insertOne(req.body);

    res.status(201).json({
        message: "Book created.",
        id: result.insertedId
    });
});

app.put("/api/books/:id", async (req, res) => {
    const error = isValidBook(req.body);

    if (error) {
        return res.status(400).json({ error });
    }

    try {
        const result = await collection.replaceOne(
            { _id: new ObjectId(req.params.id) },
            req.body
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Book not found." });
        }

        res.json({ message: "Book replaced." });
    } catch (error) {
        res.status(400).json({ error: "Invalid book id." });
    }
});

app.patch("/api/books/:id", async (req, res) => {
    try {
        const result = await collection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: req.body }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Book not found." });
        }

        res.json({ message: "Book updated." });
    } catch (error) {
        res.status(400).json({ error: "Invalid book id." });
    }
});

app.delete("/api/books/:id", async (req, res) => {
    try {
        const result = await collection.deleteOne({
            _id: new ObjectId(req.params.id)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Book not found." });
        }

        res.json({ message: "Book deleted." });
    } catch (error) {
        res.status(400).json({ error: "Invalid book id." });
    }
});

async function start() {
    const client = new MongoClient(MONGODB_URI);

    await client.connect();

    db = client.db(DB_NAME);
    collection = db.collection(COLLECTION_NAME);

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

start();