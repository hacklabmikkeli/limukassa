const readline = require('readline');
const sqlite3 = require('sqlite3').verbose();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let memberId;
let transaction;
let amount;
let db;

function askCardNumber() {
  console.clear();
  rl.question('Read card: ', (cardId) => {
    if (!cardId) {
      askCardNumber();
      return;
    }

    db.get("SELECT * FROM users WHERE cardId  = ?", [cardId], (err, row) => {
      if (err) {
        console.error(err.message);
        askCardNumber();
        return;
      }
      if (!row) {
        console.error("User not found");
        askCardNumber();
        return;
      }
      memberId = row.id;
      let balance = 0;
      db.each("SELECT * FROM transactions where userId = ?", [memberId], (err, row2) => {
        if (err) {
          console.error(err.message);
          askCardNumber();
          return;
        }
        let rowValue = row2.type == "purchase" ? row2.amount : -row2.amount;
        balance += rowValue;
      }, (err, count) => {
        if (err) {
          console.error(err.message);
          askCardNumber();
          return;
        }

        console.log(`Hello ${row.name} you currently owe ${balance} €.`);
        chooseTransaction();
      });
    });
  });
}

function chooseTransaction() {
  rl.question("Input 1 for purchase, 2 for payment or 0 to quit: ", (functionCode) => {
    switch (functionCode) {
      case "1":
        transaction = "purchase";
      break;
      case "2":
        transaction = "payment";
      break;
      case "0":
        askCardNumber();
        return;
      default:
        chooseTransaction();
        return;
    }
    askAmount();
  });
}

function askAmount() {
  rl.question("Enter amount: ", (amountString) => {
    if (isNaN(amountString)) {
      askAmount();
      return;
    }

    amount = Number(amountString);
    confirmTransaction();
  });
}

function confirmTransaction() {
  rl.question(`You are making a ${transaction} of ${amount} €. Is this correct? ( y / n ) `, (yesOrNo) => {
    switch (yesOrNo) {
      case "y":
        let created = new Date().toISOString();
        db.run(
          "INSERT INTO transactions(type, amount, userId, created) VALUES(?, ?, ?, ?)",
          [transaction, amount, memberId, created], function(err) {
            if (err) {
              console.log(err.message);
              askCardNumber();
              return;
            }

            console.log("Transaction saved successfully!");
            setTimeout(() => {
              askCardNumber();
            }, 2000);
            return;
        });
      break;
      case "n":
        chooseTransaction();
      return;
      default:
        confirmTransaction();
      return;
    }
  });
}

db = new sqlite3.Database("./transactions.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
    return;
  }
  
  askCardNumber();
});