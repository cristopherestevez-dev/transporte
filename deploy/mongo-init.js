const password = process.env.MONGO_APP_PASSWORD;
if (!password || !/^[a-fA-F0-9]{32,}$/.test(password)) {
  throw new Error("MONGO_APP_PASSWORD debe ser hexadecimal y tener al menos 32 caracteres.");
}

db.getSiblingDB("transporte").createUser({
  user: "transporte_app",
  pwd: password,
  roles: [{ role: "readWrite", db: "transporte" }],
});
