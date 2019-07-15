const { COM_QUERY } = require('../../constants/commandTypes')
const _ClientPacket = require('./_ClientPacket')

class QueryPacket extends _ClientPacket {
    constructor(queryString) {
        super()
        this.buildPacket(queryString)
    }

    buildPacket(queryString) {
        this.writeUint(COM_QUERY, 1)
        this.writeStringEOF(queryString)
    }
}

module.exports = QueryPacket