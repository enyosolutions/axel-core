# ts-express / axel

At Enyosolutions, We are fans of sailsjs as a framework for nodejs projects. However over the years we've come accross some issues were painfull :

- Slow startup time (compared to pure express, even express with similar middlewares)
- No proper support for typescript
- No nested services / Controllers folders


Also since we don't use waterline and websockets it was an unnecessary addition that slows startup time.
Hence we started this project as an attempt to have a startup template for our projects that would support all the important features we like from sails without the rest (that could be made available in the future via a package).

## Features

- [x] Routes binding to controllers via config
- [X] Merged configuration files
- [X] Globally available axel (with controllers loaded inside)
- [X] Globally available and merged configuration object
- [X] Policies for routes (in route definitions and in policies file)
- [X] Middleware auto wiring
- [ ] Websockets as a plugin
- [X] Nested controllers
- [X] ~~Nested services~~ we are not doing that. it's better to import services, to avoid polluting the global namespace.
- [X] Loading models and wiring an entity manager.
- [X] Connecting to the command line in order to sync models
- [X] Generate bare controllers (connected to the crud controller)
- [ ] Generate mongoose controllers ?
- [ ] Move manager.ejs to axel folder, and enable the websocket only if config is enabled
- [ ] rename axel into trex ?

## bugs
- typings are not correctly created after you import sequelize types, we need to delete them.
- Generated references in sequelize definitions can create cyclic dependencies. Delete them and define associations instead.
- Case issues when importing a model from database. We end up with underscore cased field, which is for some people not desirable (eslint/airbnb recommends camelCase)
- Url in schemas should be lower or snake cased



## Quick Start

Get started developing...

```shell
# Install deps
npm install

# Setup environment
cp .env.test .env

# Create the local configuration file
cp api/src/config/local.js.dist api/src/config/local.js

# Connect to db and add token
vim api/src/config/local.js

# Run in development mode
npm run dev

# Run tests
npm run test
```

---

## Install Dependencies

Install all package dependencies (one time operation)

```shell
npm install
```

# Setup environment

Create the `.env` file at the root (example can be found in the `.env.test` file).

Enter the MySQL database config and a token (for JSON Web Token) in `api/src/config/local.js` (`sqldb` section)


# Synchronize

## Run It
#### Run in *development* mode:
Runs the application is development mode. Should not be used in production

```shell
npm run dev
```

or debug it

```shell
npm run dev:debug
```

#### Run in *production* mode:

Starts it in production mode.

```shell
npm run start
```

## Test It

Run the Mocha unit tests

```shell
npm test
```

or debug them

```shell
npm run test:debug
```

## Try It
* Open you're browser to [http://localhost:3000](http://localhost:3000)
* Invoke the `/examples` endpoint
  ```shell
  curl http://localhost:3000/api/v1/examples
  ```


## Debug It

#### Debug the server:

```
npm run dev:debug
```

#### Debug Tests

```
npm run test:debug
```

#### Debug with VSCode

Add these [contents](https://github.com/cdimascio/generator-express-no-stress/blob/next/assets/.vscode/launch.json) to your `.vscode/launch.json` file
