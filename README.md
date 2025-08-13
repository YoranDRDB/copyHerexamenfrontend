# Examenopdracht Web Services

- Student: Yoran De Rop De Beukelaer
- Studentennummer: 202292109
- E-mailadres: <mailto:yoran.deropdebeukelaer@student.hogent.be>

## Vereisten

Ik verwacht dat volgende software reeds geïnstalleerd is:

- [NodeJS versie 18 of hoger](https://nodejs.org)
- [Yarn versie 1.22 of hoger](https://yarnpkg.com)
- [MySQL Community Server versie 8.x](https://dev.mysql.com/downloads/mysql/)

## Back-end

## Opstarten

> Schrijf hier hoe we de applicatie starten (.env bestanden aanmaken, commando's om uit te voeren...)

-git clone <https://github.com/HOGENT-frontendweb/frontendweb-2425-YoranDRDB.git>
-cd frontendweb-2425-YoranDRDB
-yarn install
-maak een .env bestand in de root van je project en vul aan. voeg ook je geheime credentials in.

```bash
NODE_ENV=production
DATABASE_URL=mysql://<USERNAME>:<PASSWORD>@localhost:3306/<DATABASE_NAME>
```

- Enable Corepack: `corepack enable`
- Install all dependencies: `yarn`
- Make sure a `.env` exists (see above)
- And then it's run: `just yarn start`

## Testen

- Enable Corepack: `corepack enable`
- Install all dependencies: `yarn`
- Make sure `.env.test` exists (see above maar dan in plaats van development testing en gebruik een test database in plaats van de standaard )
- Run the migrations: `yarn migrate:test`
- Run the tests: `yarn test`
  - This will start a new server for each test suite that runs, you won't see any output as logging is redirected to test.log
    -If you wanna see the test coverage run :`yarn test:coverage`
