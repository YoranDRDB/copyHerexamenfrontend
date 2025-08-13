export default {
  log: {
    level: "silly",
    disabled: false,
  },
  cors: {
    origins: ["http://localhost:3306"],
    maxAge: 3 * 60 * 60,
  },
  auth: {
    maxDelay: 5000, // ms (0 seconds)
    argon: {
      hashLength: 32,
      timeCost: 6,
      memoryCost: 2 ** 17,
    },
    jwt: {
      audience: "taakbeheer.hogent.be",
      issuer: "taakbeheer.hogent.be",
      expirationInterval: 60 * 60, // s (1 hour)
      secret: "chocoladeenabricozenzijnnietvandezelfdelandenmaarwelatomen",
    },
  },
  port: 9000,
};
