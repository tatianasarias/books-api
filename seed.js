require("dotenv").config();

const { MongoClient } = require("mongodb");

const books = [
    { name: "The Hobbit", author: "J.R.R. Tolkien", year: 1937, price: 12.99 },
    { name: "The Hunger Games", author: "Suzanne Collins", year: 2008, price: 10.99 },
    { name: "Wonder", author: "R.J. Palacio", year: 2012, price: 9.99 },
    { name: "Coraline", author: "Neil Gaiman", year: 2002, price: 8.99 },
    { name: "Dune", author: "Frank Herbert", year: 1965, price: 14.99 }
];

async function seed() {
    const client = new MongoClient(process.env.MONGODB_URI);

    await client.connect();

    const db = client.db(process.env.DB_NAME);
    const collection = db.collection(process.env.COLLECTION_NAME);

    await collection.deleteMany({});
    await collection.insertMany(books);

    console.log("Books test data added.");

    await client.close();
}

seed();