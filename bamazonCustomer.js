var mysql = require('mysql');
var app = require('./app');

class Database {
    constructor(config) {
        this.connection = mysql.createConnection(config);
    }
    query(sql, args) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, args, (err, rows) => {
                if (err)
                    return reject(err);
                resolve(rows);
            });
        });
    }
    close() {
        return new Promise((resolve, reject) => {
            this.connection.end(err => {
                if (err)
                    return reject(err);
                resolve();
            });
        });
    }
}
let bamazon = new Database({
    host: "localhost",
    user: "root",
    password: "root",
    database: "bamazon"
});
let client = {
    userName: "",
    password: "",
    access: "",
    id: 0
}

// Creates a new user/customer
app.post('/createAccount/:user/:password', function (req, res) {
    password = req.params.password;
    user = req.params.user;
    client.userName = req.params.user;
    client.password = req.params.password;

    bamazon.query('INSERT INTO users SET ?', [
        {
            user_name: user,
            user_password: password,
            user_access_level: "customer"
        }
    ]).then(response => {
        if (response.affectedRows > 0) {
            res.end("OK")
        } else {
            res.end("error")
        }
    })
})

// log in
app.post('/admin/:user/:password', function (req, res) {
    password = req.params.password;
    user = req.params.user;
    client.userName = req.params.user;
    client.password = req.params.password;
    bamazon.query(`SELECT * FROM users WHERE user_name = '${user}' AND user_password = '${password}'`)
        .then(function (response) {
            if (response.length > 0) {
                let access = response[0].user_access_level;
                client.id = parseInt(response[0].user_id);
                res.end(access);
            } else {
                res.end("No access")
            }

        }

        );
})

// Gets all products
app.get('/customer/products', function (req, res) {
    bamazon.query('SELECT * FROM products').then(rows => {
        res.send(rows);
    });
});

// Takes in id and quantity for purchase
app.post('/product/:id.:quantity', function (req, res) {
    choice = parseInt(req.params.id);
    quantity = parseInt(req.params.quantity);

    bamazon.query(`SELECT * FROM products WHERE item_id = ${choice}`).then(rows => {
        if (rows[0].stock_quantity >= quantity) {
            let stockLeft = (rows[0].stock_quantity - quantity);
            let cost = (rows[0].price * quantity)
            calculateTransaction(rows[0].product_name, choice, stockLeft, cost, quantity, res);
            //res.end(`You just purchased ${quantity} ${rows[0].product_name}(s)`);
        } else {
            res.end("Im sorry, there is not enough left in stock, please try again!");
        }
    })
})

// Calculates purchase, updates item sales and stock as well as calls updatePurchaseTable
function calculateTransaction(item, choice, stockLeft, cost, quantity, res) {
    bamazon.query(`Update products SET ? WHERE item_id = ${choice}`,
        {
            stock_quantity: stockLeft,
            product_sales: cost
        }

    ).then(rows => {
        console.log(client.userName + " " + client.password)
        bamazon.query(`SELECT user_id FROM users WHERE user_name = '${client.userName}' AND user_password = '${client.password}'`)
            .then(function (response) {
                client.id = parseInt(response[0].user_id);
                updatePurchaseTable(item, choice, cost, res, client.id, quantity);
            }

            );

    });
}

// Updates purchase table
function updatePurchaseTable(item, choice, cost, res, id, quantity) {
    console.log(item + " " + choice + " " + cost + " " + id)
    bamazon.query(`INSERT INTO purchases SET ? `,
        {
            item_id: choice,
            user_id: id,
            amount: cost
        }).then(rows => {

            const total = cost.toFixed(2);
            res.end(`You successfully purchased ${quantity} ${item}(s) for a total of $${total}`);
        });
}


module.exports = { client }