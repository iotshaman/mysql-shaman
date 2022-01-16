## MySql Shaman - by IoT Shaman

![npm badge](https://img.shields.io/npm/v/mysql-shaman.svg) ![Build Status](https://travis-ci.org/iotshaman/mysql-shaman.svg?branch=master) [![Coverage Status](https://coveralls.io/repos/github/iotshaman/mysql-shaman/badge.svg?branch=master)](https://coveralls.io/github/iotshaman/mysql-shaman?branch=master)

## Access MySql databases using a simple, familiar ORM syntax.
Let's be honest, the official MySql npm package leaves a lot to be desired. While it is a solid library that works as advertised, it requires users to submit queries in string form, sacrificing discoverability for the sake of simplicity. To compensate for this, many different ORM packages have been developed, with the intent to make MySql database management simpler. Unfortunately, almost all of there ORMS are extremely bulky, and often opinionated, forcing users to decide between writing hard-coded string queries, or using a bulky ORM. 

The purpose of mysql-shaman is to provide a standardized ORM interface on top of the core mysql package, without adding any additional bulkiness. Now, insteading of writing hard-coded string queries, you can write your CRUD operations using javascript expressions. This significantly improves the developer experience, allowing users to leverage IDE technology to anaylze their data-access operations.

Additionally, mysql-shaman includes a CLI that lets developers perform common database management operations, including scaffolding databases, running scripts, and more. 

## Requirements
- Node JS
- MySql server instance

## Installation
To use the mysql-shaman ORM in a Node JS project:
```sh
npm install mysql-shaman --save
```

To use myysql-shaman CLI tool:
```sh
npm install -g mysql-shaman --save
```

## Quick Start
Once you have installed mysql-shaman in your typescript project, the first thing you need to to is define your data models. Each model should represent a table (or view) in the database. Data models can be defined as classes or interfaces, but we reccommend classes, as this will allow future features to leverage metadata reflection. For the purposes of this demonstration, we will use the following model:

```ts
export class User {
  userId?: string;
  email: string;
  firstName: string;
  lastName: string;
}
```

Next, you need to setup a "data context" class; this class will extend mysql-shaman's abstract class 'DatabaseContext'. Below is an example implementation:

```ts
import { User } from './user.ts';

export class SampleDatabaseContext extends DatabaseContext {
  models = { 
    user: new Collection<User>() 
  }  
}
```

**IMPORTANT!!** The name of each collection should be an exact match to a table (or view) in your database (case sensitive). For example, the property 'models.user' in the class "SampleDatabaseContext" implies there is a MySql table named "user".

Finally, you need to create an instance of your database context, then call it's initialization method. The initialization method takes a "PoolConfig" interface parameter (from official mysql package).

```ts
var database = new SampleDatabaseContext();
database.initialize({
  connectionLimit: 10,
  host: "localhost",
  user: "user_name",
  password: "password_goes_here",
  database: "database_name",
  waitForConnections: false
});
```

Now you are ready to go! Here is a sample of some of the operations you can perform; for a full list of operations, see [ORM Reference](#orm-reference) section.

```ts
var database = new SampleDatabaseContext();
database.initialize({
  connectionLimit: 10,
  host: "localhost",
  user: "user_name",
  password: "password_goes_here",
  database: "database_name",
  waitForConnections: false
});

// OUTPUT LIST OF ALL USERS
database.models.user.find().then(console.dir);

// OUTPUT LIST OF USERS WITH LAST NAME OF 'Smith'
database.models.user
  .find({
    conditions: ['lastName = ?'],
    args: ['Smith']
  })
  .then(console.dir);

// FIND SINGLE USER WITH ID OF '1'
database.models.user
  .findOne({
    identity: 'userId',
    args: [1]
  })
  .then(console.dir);

// INSERT NEW USER
let user = new User();
user.email = 'test@test.com';
database.models.user.insertOne(user);

// UPDATE USER
database.models.user
  .findOne({identity: 'email', args: ['test@test.com']})
  .then(user => {
    user.firstName = 'John';
    user.lastName = 'Smith';
    return database.models.user.updateOne(user, {
      identity: 'userId',
      args: [user.userId]
    });
  });

// DELETE USER
database.models.user.deleteOne({
  identity: 'userId',
  args: [1]
});
```

## ORM Reference

### Configuration

The mysql-shaman package uses the "PoolConfig" interface, from the official mysql package, for a database configuration object. Below is a snippet of the PoolConfig interface, truncated to only show the most imporant options. For a full list of options, please visit their [github page](https://github.com/mysqljs/mysql).

```ts
export interface PoolConfig {
  connectionLimit: number;
  host: string;
  user: string;
  password: string;
  database: string;
  waitForConnections: boolean;
}
```

### Database Context

The database context is an abstract class that provides a convenient interface to access data. Below is the specification for the "DataContext" class:

```ts
import { PoolConfig } from 'mysql';
import { Collection } from './collection';
export declare abstract class DatabaseContext {
  abstract models: {
    [name: string]: Collection<any>;
  };
  initialize: (config: PoolConfig) => void;
  protected query: <T>(query: string, args: any) => Promise<T>;
  protected callProcedure: <T>(procedure: string, args: any[]) => Promise<T>;
}
```

* **models** - The "models" abstract property must be implemented by all concrete classes, and contains a key-value pair of model names to "Collections" (see below). The name property must **EXACTLY** match the table name, as defined in your MySql database.
* **initialize** - Takes a configuration object and uses it to initialize the database pool connection manager. 
* **query** - A light wrapper around the core mysql package's "query" method. This allows developers to bypass the ORM, if need be (this is not reccommended in most use-cases).
* **callProcedure** - Allows developers to call stored procedures through the data context. 

### Collection

A collection is a generic class representation of a data model. Think of collections as someting you perform operations on: find, insert, update, delete, etc. Each collection should represent a table (or view) in your database. Below is the specification for the "Collection" class:

```ts
import { PoolConnection } from 'mysql';
import { EntityQuery } from './entity-query';
export declare class Collection<T> {
  initialize: (name: string, connectionFactory: () => Promise<PoolConnection>) => void;
  find: (query?: EntityQuery) => Promise<T[]>;
  findOne: (query: EntityQuery) => Promise<T>;
  insert: (query: EntityQuery) => Promise<void>;
  insertOne: (model: T) => Promise<number>;
  update: (model: T, query: EntityQuery) => Promise<void>;
  updateOne: (model: T, query: EntityQuery) => Promise<void>;
  delete: (query: EntityQuery) => Promise<void>;
  deleteOne: (query: EntityQuery) => Promise<void>;
}
```

#### Entity Queries
Most of the collection methods have an "EntityQuery" object parameter, and each method uses different properties. Below is a list of all properties of the "EntityQuery" interface, but please reference each method's description for implementation specifics.

```ts
export interface EntityQuery {
  identity?: string;
  args?: any[];
  columns?: string[];
  conditions?: string[];
  limit?: number;
}
```

#### initialize
This is used by the "DatabaseContext" abstract class to initialize each collection. You should probably never call this manually, unless you are working with collections outside of a data context (not reccommended).

#### find
Takes an optional "EntityQuery" object and returns an array of objects (T). If no query parameter is provided, it will return a list of all entities. Below is a list of all "EntityQuery" properties that are available (all properties are optional):

```ts
find: (query?: EntityQuery) => Promise<T[]>;
```

* **columns** - List of column names you with to be included in the return objects. Default = "*".
* **conditions** - List of "WHERE" clauses. Please use '?' to represent query parameters, then pass those parameters in the 'args' property; by doing so, mysql will sanitize the inputs, helping prevent SQL injection.
* **args** - List of arguments. Each argument should correspond to a '?' in a condition string.

#### findOne
Takes a required "EntityQuery" object and returns a single object (T); null if no object found.  Below is a list of all "EntityQuery" properties that are available (* indicates a required parameter):

```ts
findOne: (query?: EntityQuery) => Promise<T>;
```

* **identity** (*) - The column name that represents a unique object. This is typically a primary key, but can be something else that is unique. 
* **args** (*) - A value that represents a unique object, and should match a value in the column specified in the "identity" parameter.
* **columns** - List of column names you with to be included in the return objects. Default = "*".

#### insert
Inserts one-to-many new object(s) (T) into a table. Below is a list of all "EntityQuery" properties that are available (* indicates a required parameter):

```ts
insert: (query?: EntityQuery) => Promise<void>;
```

* **args** (*) - List of objects (T) to insert. 
* **identity** - If the table has an identity column which automatically assigns values, specify here and that column / value will not be included in the insert.
* **columns** - List of columns to insert. This should be used in conjunction with "identity" parameter, if there is an identity column that should not be included in insert statement.

#### insertOne
Insert one object (T) into a table. 

```ts
insertOne: (model: T) => Promise<number>;
```

#### update
Takes an object (T) and an "EntityQuery" object and updates the corresponding database values. Below is a list of all "EntityQuery" properties that are available (all properties are required):

```ts
update: (model: T, query: EntityQuery) => Promise<void>;
```

* **columns**: A list of columns to update; only these column values will be updated.
* **conditions** - List of "WHERE" clauses. Please use '?' to represent query parameters, then pass those parameters in the 'args' property; by doing so, mysql will sanitize the inputs, helping prevent SQL injection. 
* **args** - A value that represents a unique object, and should match a value in the column specified in the "identity" parameter.

#### updateOne
Takes an object (T) and an "EntityQuery" object and updates the corresponding database values. Below is a list of all "EntityQuery" properties that are available (all properties are required):

```ts
updateOne: (model: T, query: EntityQuery) => Promise<void>;
```

* **identity** - The column name that represents a unique object. This is typically a primary key, but can be something else that is unique. 
* **args** - A value that represents a unique object, and should match a value in the column specified in the "identity" parameter.

#### delete
Deletes one-to-many object(s) (T) from a database table. Below is a list of all "EntityQuery" properties that are available (all properties are required):

```ts
 delete: (query: EntityQuery) => Promise<void>;
```

* **conditions** - List of "WHERE" clauses. Please use '?' to represent query parameters, then pass those parameters in the 'args' property; by doing so, mysql will sanitize the inputs, helping prevent SQL injection.
* **args** - List of arguments. Each argument should correspond to a '?' in a condition string.

#### deleteOne
Deletes an object (T) from a database table. Below is a list of all "EntityQuery" properties that are available (all properties are required):

```ts
deleteOne: (query: EntityQuery) => Promise<void>;
```

* **identity** - The column name that represents a unique object. This is typically a primary key, but can be something else that is unique. 
* **args** - A value that represents a unique object, and should match a value in the column specified in the "identity" parameter.

#### first
Takes a column name and an optional "EntityQuery" object and returns the first record, sorted by the provided column name. If query parameter are provided, the query will be modified accordingly before finding the first record. Below is a list of all "EntityQuery" properties that are available (all properties are optional):

```ts
first: (columnName: string, query?: EntityQuery) => Promise<T>;
```

* **columns** - List of column names you with to be included in the return objects. Default = "*".
* **conditions** - List of "WHERE" clauses. Please use '?' to represent query parameters, then pass those parameters in the 'args' property; by doing so, mysql will sanitize the inputs, helping prevent SQL injection.
* **args** - List of arguments. Each argument should correspond to a '?' in a condition string.

#### last
Takes a column name and an optional "EntityQuery" object and returns the last record, sorted by the provided column name. If query parameter are provided, the query will be modified accordingly before finding the last record. Below is a list of all "EntityQuery" properties that are available (all properties are optional):

```ts
last: (columnName: string, query?: EntityQuery) => Promise<T>;
```

* **columns** - List of column names you with to be included in the return objects. Default = "*".
* **conditions** - List of "WHERE" clauses. Please use '?' to represent query parameters, then pass those parameters in the 'args' property; by doing so, mysql will sanitize the inputs, helping prevent SQL injection.
* **args** - List of arguments. Each argument should correspond to a '?' in a condition string.

## CLI Reference

The mysql-shaman CLI provides a convenient way to perform common database operations, without having to login to mysql in a terminal, or though Workbench, etc. Store your database scripts in .sql files, configure the mysql-shaman CLI, then start running commands.

The mysql-shaman CLI follows the following format:

```sh
mysql-shaman [command] [...arguments]
```

### Configuration
Before configuring the mysql-shaman CLI, you should already have a project folder with database files, typically with .sql extensions. Inside this project folder, create a file called 'mysql-shaman.json'. This file should follow the below interface specification:

```ts
import { PoolConfig } from 'mysql';
export interface MySqlShamanConfig {
  poolConfig: PoolConfig;
  adminPoolConfig?: PoolConfig;
  cwd?: string;
  scripts?: {
    tables: string[];
    primers?: string[];
    views?: string[];
    procedures?: string[];
  };
}
```

* **poolConfig** (*) - mysql PoolConfig configuration ([see above](#orm-reference)).  
* **adminPoolConfig** - mysql PoolConfig configuration ([see above](#orm-reference)) for the [Build Command](#build-command). This is the same as the *poolConfig* variable, except the user provided should have GRANT permissions.  You should provide a null (or undefined) value for the database property.
* **cwd** - Allows developers to configure the root folder where .sql files are stored. This should be relative to the folder that contains your 'mysql-shaman.json' file.  
* **scripts** - There are currently 4 different types of scripts that mysql-shaman can process: tables, primers, views, and procedures. For each of these, you can specify "glob" patterns to tell mysql-shaman how to find those particular types of files. 

(\*) *indicates a required field*

### Build Command
The build command takes 2 arguments (databaseName and userName) and will perform the following actions:

- Create the database, from the provided database name value.
- Create the user, from the provided user name value.
- Setup permissions for the provided user, on the provided database.
- Output the password of the newly created user

The syntax for the build command is as follows:

```sh
mysql-shaman build [databaseName] [userName] [config path (optional)]
```

*Note: to run this command you need to have a populated "adminPoolConfig" value in your mysql-shaman.json file, and the user credentials provided should have GRANT permissions, and the ability to create databases.*

### Scaffold Command
The scaffold command takes 1 optional argument then runs all the configured scripts (see above). The scripts are run in sequential order, based on the glob patterns provided in your configuration file's "scripts" property. The only required script type is "table", all others are optional. 

```sh
mysql-shaman scaffold [config path (optional)]
```

Since certain types of scripts rely on certain other scripts, the scaffold command will run the 4 script types in this order:

1. tables
2. primers
3. views
4. procedures

If you need the scripts, inside of each category, to run sequentially, specify them explicity in the configuration file, in the order you wish them to run. 

### Run Command
The run command takes 1 required parameter and 1 optional parameter then runs the specified script on the configured database.

```sh
mysql-shaman run [script path] [config path (optional)]
```
