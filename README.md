# Axel framework
Axel (like Axel Foley or a fusion word between Accelerate and express) is a framework based on express. image

## History
This repository started with the team at [Enyosolutions](https://www.enyosolutions.com) building backoffices that were quite similar.
I realised that we were spending too much time to implement features that should have been easy and repetitive (think display a list of data from the api in a table, and interact with it).

We found a few awesome libraries that were great a doing their part, but not necessarly at working together.
Also each needed a lot of configuration (parameters) for each page.

Hence we decided to improve our workflow with various ready to use components.

## features

- Build a back office in a single day.
- Connect to an existing REST api and start working.
- Import and export data to Excel easily.
- Display table and edit their contents easily.
- Link objects with their foreign counterpart easily (foreign key support, nested tab support).


https://enyosolutions-team.github.io/axel-documentation/

https://enyosolutions-team.github.io/axel-documentation/guide/axel-framework/


## getting started

```
## Install the cli tooling
-  npm install -g axel-cli

## Create a new project
- `axel new my-project-name`

## Open the project
- `cd my-project-name`

# Install deps
npm install

# Setup environment (if present)
cp .env.dist .env

# Create the local configuration file
cp api/src/config/local.js.dist api/src/config/local.js

# Edit config to add bd credentials in the sql db section
nano api/src/config/local.js

# Run in development mode
npm run dev

# Run tests
npm run test
```
