export default {
  log: {
    level: "info",
    disabled: false,
  },
  auth: {
    maxDelay: 10000, // ms (5 seconds)
    argon: {
      hashLength: 32,
      timeCost: 6,
      memoryCost: 2 ** 17,
    },
    jwt: {
      expirationInterval: 60 * 60, // s (1 hour)
      audience: "taakbeheer.hogent.be",
      issuer: "taakbeheer.hogent.be",
    },
  },
  cors: {
    origins: ["http://localhost:3000"],
    maxAge: 3 * 60 * 60,
  },
  port: 9000,
};
