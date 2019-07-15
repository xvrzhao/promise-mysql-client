# Promise MySQL Client

A MySQL protocol client that provides the Promise APIs but allows you to separate `query` operations from the callback of the `connect` operation.

*Supports MySQL server 5.7.5+*

## Install

```
$ npm i promise-mysql-client
```

## Demo
```
const Client = require('promise-mysql-client')

// connect to server in synchronous code
const mysql = new Client('localhost', 3306, 'test', 'root', 'root')

// you can query here that the client has already connected to the server :)
mysql.query("insert into users values (1, 'xavier')").then(res => { ... })

// imitate the http request after 3 seconds
setTimeout(() => {
    mysql.query("select * from users where id = 1")
        .then(user => {
            return mysql.query(`update users set name = 'xvrzhao' where id = ${user.id}`)
        })
        .then(res => {
            if (res.numOfAffectedRows === 1) console.log('updated')
        })
        .catch(err => { ... })
}, 3000)
```

## Query Sequence

```
const sqlStr1 = "sql statement"
const sqlStr2 = "sql statement"
const sqlStr3 = "sql statement"

mysql.query(sqlStr1).then(() => mysql.query(sqlStr2))
mysql.query(sqlStr3)

// query sequence: sqlStr1 -> sqlStr3 -> sqlStr2
```

## Coroutines Style

```
const sqlStr1 = "sql statement"
const sqlStr2 = "sql statement"
const sqlStr3 = "sql statement"

;(async () => {
    await mysql.query(sqlStr1)
    await mysql.query(sqlStr2)
})()

;(async () => {
    await mysql.query(sqlStr3)
})()

// query sequence: sqlStr1 -> sqlStr3 -> sqlStr2
```

## Reconnect after Close

```
mysql.close().then(() => {
    console.log('disconnected')
    mysql.connect() // will connect at process.nextTick 
    return
}).then(() => {
    // promise.then will been executed after process.nextTick
    console.log('connected')
    mysql.query("delete from users where id = 12")
})
```

## APIs

### new Client(`host:string`, `port:number`, `database:string`, `username:string`, `password:string`): Client
Get the client instance and connect to the server.

### Client.prototype.query(`sqlStatement:string`): `Promise<Object>`
Database query operation.

### Client.prototype.close(): `Promise<void>`
Disconnect from the MySQL server.

### Client.prototype.connect(): `void`
Reconnect after disconnection.