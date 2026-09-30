const bcrypt = require("bcryptjs");
console.log("ADMIN    hash:", bcrypt.hashSync("Admin123!", 10));
console.log("PARTNER  hash:", bcrypt.hashSync("Partner123!", 10));
console.log("TALENT   hash:", bcrypt.hashSync("Talent123!", 10));