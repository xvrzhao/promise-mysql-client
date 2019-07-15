const BufferReader = require('../../buffer/BufferReader')

class ResultsetRowPacket extends BufferReader {
    packetLen
    payloadLen
    sequenceId
    rowValues = []

    constructor(rawPacket) {
        super(rawPacket)
        this.packetLen = rawPacket.length
        this.parse()
    }

    parse() {
        this.payloadLen = this.nextUint(3)
        this.sequenceId = this.nextUint(1)
        while (this._offset < this.packetLen) {
            const nextByte = this.nextUintNotMove(1)
            if (nextByte === 0xfb) {
                this.rowValues.push(null)
                this._offset++
            } else {
                this.rowValues.push(this.nextLenEncStr())
            }
        }
    }

}

module.exports = ResultsetRowPacket