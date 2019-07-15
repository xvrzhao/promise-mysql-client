const BufferWriter = require('../../buffer/BufferWriter')
function handshakeResponsePacketClass() { return require('./HandshakeResponsePacket') }
function queryPacketClass() { return require('./QueryPacket') }
function quitPacketClass() { return require('./QuitPacket') }

/**
 * @abstract
 */
class _ClientPacket extends BufferWriter {
    get writtenBufferWithHeader() {
        let sequenceId
        if (this instanceof handshakeResponsePacketClass())
            sequenceId = 1
        else if (this instanceof queryPacketClass())
            sequenceId = 0
        else if (this instanceof quitPacketClass())
            sequenceId = 0
        else
            throw new Error('The instance must be one of the client packets.')

        const header = Buffer.alloc(4)
        header.writeUIntLE(this.writtenBuffer.length, 0, 3)
        header.writeUInt8(sequenceId, 3)

        return Buffer.concat([header, this.writtenBuffer])
    }

    sendTo(socket) {
        socket.write(this.writtenBufferWithHeader)
    }
}

module.exports = _ClientPacket