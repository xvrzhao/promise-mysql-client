const { OK_PACKET, ERR_PACKET, RESULTSET_PACKET } = require('../constants/serverPacketTypes')

class Util {
    static getServPacketType(servPacket) {
        switch (servPacket[4]) {
            case undefined:
                return undefined
                break
            case 0x00:
            case 0xfe:
                return OK_PACKET
                break
            case 0xff:
                return ERR_PACKET
                break
            default:
                return RESULTSET_PACKET
                break
        }
    }

    static genErrorFromERRPacket(errPacket, errMsg) {
        if (errMsg === undefined) errMsg = errPacket.errMsg
        const err = new Error(errPacket.errMsg)
        err.code = errPacket.errCode
        err.sqlState = errPacket.sqlStateMarker + errPacket.sqlState
        return err
    }
}

module.exports = Util