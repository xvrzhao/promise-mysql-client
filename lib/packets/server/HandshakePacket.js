const BufferReader = require('../../buffer/BufferReader')
const capabilityFlags = require('../../constants/capabilityFlags')

/**
 * Protocol::HandshakeV10
 * 
 * handshake v10 require the 3.21.0+ version of mysql server,
 * protocol 41 require the 4.1+ version of mysql server
 */

class HandshakePacket extends BufferReader {
    payloadLength
    sequenceId
    protocolVersion
    serverVersion
    connectionId
    authPluginName
    authPluginData
    capabilityFlags
    characterSet
    statusFlags

    constructor(rawPacket) {
        super(rawPacket)
        this.parsePacket()
    }

    parsePacket() {
        // since mysql 3.21.0 the Protocol::HandshakeV10 is sent,
        // the following code just handle the version of 10
        this.payloadLength = this.nextUint(3)
        this.sequenceId = this.nextUint(1)
        this.protocolVersion = this.nextUint(1)
        this.serverVersion = this.nextNulTerminatedString()
        this.connectionId = this.nextUint(4)

        this.authPluginData = this.nextBufferRef(8)
        this.skip(1)
        this.capabilityFlags = this.nextUint(2)

        if (this.hasMoreData()) {
            this.characterSet = this.nextUint(1)
            this.statusFlags = this.nextUint(2)
            this.capabilityFlags |= this.nextUint(2) << 16

            if ((this.capabilityFlags & capabilityFlags.CLIENT_PROTOCOL_41) == 0) {
                throw new Error('mysql: your mysql server version is too old, to use this library you have to update mysql server to 4.1+')
            }

            let lenOfAuthPluginData
            if (this.capabilityFlags & capabilityFlags.CLIENT_PLUGIN_AUTH) {
                lenOfAuthPluginData = this.nextUint(1)
                this.skip(10)
            } else {
                this.skip(11)
            }

            if (this.capabilityFlags & capabilityFlags.CLIENT_SECURE_CONNECTION) {
                const len = Math.max(13, lenOfAuthPluginData - 8)
                this.authPluginData = Buffer.concat([
                    this.authPluginData,
                    this.nextBufferRef(len).slice(0, len - 1)
                ])
            }

            if (this.capabilityFlags & capabilityFlags.CLIENT_PLUGIN_AUTH) {
                this.authPluginName = this.nextNulTerminatedString()
            }
        }
    }
}

module.exports = HandshakePacket