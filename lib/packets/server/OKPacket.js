const BufferReader = require('../../buffer/BufferReader')
const { OK_PACKET } = require('../../constants/serverPacketTypes')

class OKPacket extends BufferReader {
    serverPacketType = OK_PACKET

    payloadLength
    sequenceId
    header // 0x00 / 0xfe

    numOfAffectedRows
    lastInsertId
    statusFlags
    numOfWarnings
    info

    constructor(rawPacket) {
        super(rawPacket)
        this.parsePacket()
    }

    parsePacket() {
        this.payloadLength = this.nextUint(3)
        this.sequenceId = this.nextUint(1)
        this.header = this.nextBufferRef(1)
        this.numOfAffectedRows = this.nextLenEncUint()
        this.lastInsertId = this.nextLenEncUint()
        this.statusFlags = this.nextUint(2)
        this.numOfWarnings = this.nextUint(2)
        this.info = this.restString()
    }
}

module.exports = OKPacket