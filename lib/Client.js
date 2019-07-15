const net = require('net')
const HandshakePacket = require('./packets/server/HandshakePacket')
const HandshakeResponsePacket = require('./packets/client/HandshakeResponsePacket')
const OKPacket = require('./packets/server/OKPacket')
const ERRPacket = require('./packets/server/ERRPacket')
const { COM_QUERY, COM_QUIT } = require('./constants/commandTypes')
const QueryPacket = require('./packets/client/QueryPacket')
const QuitPacket = require('./packets/client/QuitPacket')
const ResultsetPacket = require('./packets/server/ResultsetPacket')
const Util = require('./packets/Util')
const { OK_PACKET, ERR_PACKET, RESULTSET_PACKET } = require('./constants/serverPacketTypes')

class Client {
    host
    port
    database
    username
    password

    socket
    commandQueue = []

    // states
    isConnected = false
    isAuthenticated = false
    isFirstPacket = true
    isSecondPacket = true
    isClosed = false

    // packets
    handshakePacket
    authOKPacket
    authERRPacket

    constructor(host, port, database, username, password) {
        this.host = host
        this.port = port
        this.database = database
        this.username = username
        this.password = password

        this.connect()
    }

    connect() {
        process.nextTick(() => {
            this.socket = net.createConnection(this.port || 3306, this.host)
            this.socket.on('connect', () => this.isConnected = true)
            this.socket.on('data', this.dataListener.bind(this))
            this.socket.on('error', this.errListener.bind(this))
        })
    }

    dataListener(packet) {
        if (this.isFirstPacket) {
            // authenticate
            this.isFirstPacket = false
            const handshakeResponsePacket = new HandshakeResponsePacket(
                this.username,
                this.password,
                this.database,
                this.handshakePacket = new HandshakePacket(packet))
            handshakeResponsePacket.sendTo(this.socket)
        } else {
            const type = Util.getServPacketType(packet)

            // authentication response:
            //  ok packet will be received after successful authentication
            //  otherwise err packet

            if (this.isSecondPacket) {
                this.isSecondPacket = false
                if (type === OK_PACKET) {
                    this.isAuthenticated = true
                    this.authOKPacket = new OKPacket(packet)
                } else if (type === ERR_PACKET) {
                    this.authERRPacket = new ERRPacket(packet)
                    throw Util.genErrorFromERRPacket(this.authERRPacket,
                        'mysql: authentication error: ' + this.authERRPacket.errMsg)
                }
            }

            // command (`query` or `close`) response:
            //  1. err packet
            //  2. ok packet
            //  3. resultset

            execCommand.call(this)
            function execCommand() {
                const com = this.commandQueue[0]
                if (com === undefined) {
                    // process.nextTick will block the event loop
                    setImmediate(execCommand.bind(this))
                } else {
                    if (com.isExecuted) {
                        // resolve old command
                        if (type === OK_PACKET) {
                            const okPacket = new OKPacket(packet)
                            const { numOfAffectedRows, lastInsertId, numOfWarnings, info } = okPacket
                            com.resolve({ numOfAffectedRows, lastInsertId, numOfWarnings, info })
                        } else if (type === ERR_PACKET) {
                            const errPacket = new ERRPacket(packet)
                            const err = Util.genErrorFromERRPacket(errPacket)
                            com.reject(err)
                        } else if (type === RESULTSET_PACKET) {
                            const resultsetPacket = new ResultsetPacket(packet)
                            com.resolve(resultsetPacket.resultset)
                        }
                        this.commandQueue.shift()
                        execCommand.call(this)
                    } else {
                        // execute new command
                        if (com.commandType === COM_QUERY) {
                            const queryPacket = new QueryPacket(com.sqlString)
                            queryPacket.sendTo(this.socket)
                        } else if (com.commandType === COM_QUIT) {
                            const quitPacket = new QuitPacket()
                            quitPacket.sendTo(this.socket)
                            // quit command will not receive the response packet from server
                            // so we resolve the `close promise` immediately
                            this.restoreStates()
                            com.resolve()
                        }
                        com.isExecuted = true
                    }
                }
            }
        }
    }

    // todo
    errListener(err) {
        throw new Error('mysql: connection error')
    }

    restoreStates() {
        this.isConnected = false
        this.isAuthenticated = false
        this.isFirstPacket = true
        this.isSecondPacket = true
        this.isClosed = false
    }

    query(sqlString) {
        return new Promise((resolve, reject) => {
            if (this.isClosed) {
                reject(new Error('mysql: connection has closed.'))
            } else {
                this.commandQueue.push({
                    isExecuted: false,
                    commandType: COM_QUERY,
                    sqlString,
                    resolve,
                    reject
                })
            }
        })
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.isClosed) {
                reject(new Error('mysql: connection has closed.'))
            } else {
                this.isClosed = true
                this.commandQueue.push({
                    isExecuted: false,
                    commandType: COM_QUIT,
                    resolve,
                    reject
                })
            }
        })
    }
}

module.exports = Client