const BufferReader = require('../../buffer/BufferReader')
const ColumnDefinitionPacket = require('./ColumnDefinitionPacket')
const ResultsetRowPacket = require('./ResultsetRowPacket')
const OKPacket = require('./OKPacket')
const ERRPacket = require('./ERRPacket')

class ResultsetPacket extends BufferReader {
    packetLen
    columnCount = 0
    columnDefinitionPackets = []
    resultsetRowPackets = []
    lastPacket
    isOK // bool
    lastOKPacket
    lastERRPacket

    constructor(rawPacket) {
        super(rawPacket)
        this.packetLen = rawPacket.length
        this.unpack()
    }

    get resultset() {
        const colNames = []
        for (const { name } of this.columnDefinitionPackets) {
            colNames.push(name)
        }
        const resultset = []
        for (const { rowValues } of this.resultsetRowPackets) {
            const row = {}
            colNames.forEach((colName, index) => {
                row[colName] = rowValues[index]
            })
            resultset.push(row)
        }
        if (resultset.length > 1)
            return resultset
        else
            return resultset[0]
    }

    unpack() {
        this.parseColCount()
            .parseColDefs()
            .parseRows()
            .parseLastPacket()
    }

    parseColCount() {
        this.skip(4)
        this.columnCount = this.nextLenEncUint()
        return this
    }

    parseColDefs() {
        for (let i = 1; i <= this.columnCount; i++) {
            const payloadLen = this.nextUintNotMove(3)
            const buf = this.nextBufferRef(4 + payloadLen) // 4 is length of payload length + sequece id
            this.columnDefinitionPackets.push(new ColumnDefinitionPacket(buf))
        }
        return this
    }

    parseRows() {
        const payloadLen = this.nextUintNotMove(3)
        const buf = this.nextBufferRef(4 + payloadLen)
        if (this._offset < this.packetLen) {
            // `buf` is a row not a OK/ERR Packet
            this.resultsetRowPackets.push(new ResultsetRowPacket(buf))
            this.parseRows()
            return this
        } else {
            // `buf` is a OK/ERR Packet which ends the resultset 
            this.lastPacket = buf
        }
    }

    parseLastPacket() {
        const header = this.lastPacket[4]
        if (header === 0x00 || header === 0xfe) {
            this.lastOKPacket = new OKPacket(this.lastPacket)
            this.isOK = true
        } else if (header === 0xff) {
            this.lastERRPacket = new ERRPacket(this.lastPacket)
            this.isOK = false
        }
    }
}

module.exports = ResultsetPacket