var mysql = require('mysql');
var client = require('./bamazonCustomer.js');
var app = require('./app.js');
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "bamazon"
});
connection.connect(function () {
})

// Created array to hold products
let getProducts = (function () {
    let products = [];
    connection.query('SELECT * FROM products', function (err, result) {
        result.map((x) => {
            products.push({
                Item_Id: x.item_id,
                Product_Name: x.product_name,
                Department: x.department_name,
                Price: x.price,
                Stock_Quantity: x.stock_quantity,
                Product_Sales: x.product_sales
            });
        });
    });
    return products;
})()

// Created variable to hold users
let getUsers = (function () {
    let users = [];
    connection.query('SELECT * FROM users WHERE user_access_level = "customer"', function (err, result) {
        result.map((x) => {
            users.push({
                user_id: x.user_id,
                user_name: x.user_name,
                access: x.user_access_level
            });
        });
    });
    return users;
})()

let allusers = (function () {
    let users = [];
    connection.query('SELECT * FROM users', function (err, result) {
        result.map((x) => {
            users.push({
                user_id: x.user_id,
                user_name: x.user_name,
                access: x.user_access_level
            });
        });
    });
    return users;
})()
// Gets all products
app.get("/viewProducts", function (err, res) {
    let products = getProducts;
    res.end(JSON.stringify(products));
})

// Gets all users
app.get("/viewAllUsers", function (err, res) {
    let users = allusers;
    res.end(JSON.stringify(users))
});

// Gets all users with customer access level
app.get("/viewUsers", function (err, res) {
    let users = getUsers;
    res.end(JSON.stringify(users))
});

// Gets customer/user details
app.post("/getCustomerDetails/:userId", function (req, res) {
    const user = parseInt(req.params.userId);
    connection.query(`SELECT * FROM purchases 
        INNER JOIN products 
        ON purchases.item_id = products.item_id 
        WHERE user_id = ${user}`, function (err, result) {
            if (result.length > 0) {
                console.log(result)
                res.end(JSON.stringify(result))
            } else {

                res.end("false")
            }

        });

})

// Updates product 
app.post("/updateProductDetails", function (req, res) {
    let body = req.body;
    let price = parseFloat(body.price);
    price = price.toFixed(2);
    let stock = parseInt(body.stock)
    console.log(body);
    connection.query(`UPDATE products SET ? WHERE item_id = ${body.id} `,
        {
            product_name: body.product_name,
            department_name: body.department_name,
            price: price,
            stock_quantity: stock
        })
    res.send("updated")
})

// Updates customer
app.post("/updateChosenCustomer", function (req, res) {
    let body = req.body;
    connection.query(`UPDATE users SET ? WHERE user_id = ${body.id} `,
        {
            user_name: body.customerName,
            user_access_level: body.access
        })
    res.send(req.body)
})
