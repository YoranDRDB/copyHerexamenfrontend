export default {
  log: {
    level: "silly",
    disabled: false,
  },
  cors: {
    origins: ["http://localhost:3300"],
    maxAge: 3 * 60 * 60,
  },
  auth: {
    maxDelay: 0, // ms (5 seconds)
    argon: {
      hashLength: 16,
      timeCost: 2,
      memoryCost: 2 ** 12,
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
