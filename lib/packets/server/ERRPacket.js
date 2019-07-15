const BufferReader = require('../../buffer/BufferReader')
const { ERR_PACKET } = require('../../constants/serverPacketTypes')

class ERRPacket extends BufferReader {
    serverPacketType = ERR_PACKET

    packetLen
    payloadLen
    sequenceId
    header // always 0xff

    errCode
    sqlStateMarker
    sqlState
    errMsg

    constructor(rawPacket) {
        super(rawPacket)
        this.packetLen = rawPacket.length
        this.parse()
    }

    parse() {
        this.packetLen = this.nextUint(3)
        this.sequenceId = this.nextUint(1)
        this.header = this.nextUint(1)
        this.errCode = this.nextUint(2)
        this.sqlStateMarker = this.nextString(1)
        this.sqlState = this.nextString(5)
        this.errMsg = this.restString()
    }
}

module.exports = ERRPacket