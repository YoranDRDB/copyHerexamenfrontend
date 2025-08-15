export default {
  log: { disabled: false },
  cors: {
    origins: ["http://localhost:5173", "http://localhost:3000"], // ["http://localhost:3306"]
    maxAge: 3 * 60 * 60,
  },
  auth: {
    maxDelay: 5000,
    argon: { hashLength: 32, timeCost: 6, memoryCost: 2 ** 17 }, //niet geconfigureerd op voorhand kijken naar nood aan want gebruik mogelijk
    jwt: {
      audience: "taakbeheer.hogent.be",
      issuer: "taakbeheer.hogent.be",
      expirationInterval: 60 * 60, // 1 uur
      // env voor secret
    },
  },
  port: 9000,
};
