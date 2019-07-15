const capabilityFlags = require('../../constants/capabilityFlags')
const charsets = require('../../constants/charsets')
const crypto = require('crypto')
const _ClientPacket = require('./_ClientPacket')

class HandshakeResponsePacket extends _ClientPacket {
    username
    password
    database
    handshakePacket
    capabilityFlags

    constructor(username, password, database, handshakePacket) {
        super()

        this.username = username
        this.password = password
        this.database = database
        this.handshakePacket = handshakePacket

        this.build()
    }

    build() {
        this.buildCapabilityFlags()
            .buildMaxPacketSize()
            .buildCharset()
            .skip(23)
            .buildUsername()
            .buildAuthResponse()
            .buildDatabase()
            .buildAuthPluginName()
    }

    buildCapabilityFlags() {
        this.capabilityFlags =
            capabilityFlags.CLIENT_PROTOCOL_41 |
            capabilityFlags.CLIENT_CONNECT_WITH_DB |
            capabilityFlags.CLIENT_PLUGIN_AUTH

        if (this.handshakePacket.capabilityFlags &
            capabilityFlags.CLIENT_PLUGIN_AUTH_LENENC_CLIENT_DATA) {
            this.capabilityFlags |=
                capabilityFlags.CLIENT_PLUGIN_AUTH_LENENC_CLIENT_DATA
        }

        if (this.handshakePacket.capabilityFlags &
            capabilityFlags.CLIENT_DEPRECATE_EOF) {
            this.capabilityFlags |=
                capabilityFlags.CLIENT_DEPRECATE_EOF
        } else {
            throw new Error('mysql: mysql version is too old ' +
                'because of not supporting CLIENT_DEPRECATE_EOF, ' +
                'to use this library must update to 5.7.5+')
        }

        this.writeInt(this.capabilityFlags, 4)

        return this
    }

    buildMaxPacketSize() {
        this.writeUint(2 ** 24 - 1, 4)
        return this
    }

    buildCharset() {
        this.writeUint(charsets.UTF8MB4_GENERAL_CI, 1)
        return this
    }

    buildUsername() {
        this.writeNulTerminatedString(this.username)
        return this
    }

    buildAuthResponse() {
        const authResponse = this.calculatePassword()

        if (this.capabilityFlags &
            capabilityFlags.CLIENT_PLUGIN_AUTH_LENENC_CLIENT_DATA ||
            this.capabilityFlags &
            capabilityFlags.CLIENT_SECURE_CONNECTION) {
            this.writeUint(20, 1).writeBuffer(authResponse)
        } else {
            this.writeNulTerminatedBuffer(authResponse)
        }
        return this
    }

    buildDatabase() {
        if (this.capabilityFlags &
            capabilityFlags.CLIENT_CONNECT_WITH_DB) {
            this.writeNulTerminatedString(this.database)
        }
        return this
    }

    buildAuthPluginName() {
        if (this.capabilityFlags &
            capabilityFlags.CLIENT_PLUGIN_AUTH) {
            this.writeNulTerminatedString('mysql_native_password')
        }
        return this
    }

    calculatePassword() {
        const left = crypto.createHash('sha1')
            .update(this.password).digest()
        const _right = crypto.createHash('sha1')
            .update(left).digest()
        const right = crypto.createHash('sha1')
            .update(Buffer.concat([this.handshakePacket.authPluginData, _right])).digest()

        // xor
        return left.map((byte, index) => {
            return byte ^ right[index]
        })
    }
}

module.exports = HandshakeResponsePacket