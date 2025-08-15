export default {
  log: {
    level: "silly",
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
      audience: "taakbeheer.hogent.be",
      issuer: "taakbeheer.hogent.be",
      expirationInterval: 60 * 60, // s (1 hour)
      secret: "chocoladeenabricozenzijnnietvandezelfdelandenmaarwelatomen", //moet nog aangepast worden
    },
  },
  port: 9000,
};
