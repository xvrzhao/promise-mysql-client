const _ClientPacket = require('./_ClientPacket')
const { COM_QUIT } = require('../../constants/commandTypes')

class QuitPacket extends _ClientPacket {
    constructor() {
        super()
        this.buildPacket()
    }

    buildPacket() {
        this.writeUint(COM_QUIT, 1)
    }
}

module.exports = QuitPacket