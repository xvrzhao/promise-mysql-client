const BufferReader = require('../../buffer/BufferReader')

class ColumnDefinitionPacket extends BufferReader {
    payloadLen
    sequenceId
    catalog
    schema
    table
    tableOrg
    name
    nameOrg
    charset
    columnLen
    columnType
    flags
    decimals

    constructor(rawPacket) {
        super(rawPacket)
        this.parse()
    }

    parse() {
        this.payloadLen = this.nextUint(3)
        this.sequenceId = this.nextUint(1)
        this.catalog = this.nextLenEncStr() // always "def"
        this.schema = this.nextLenEncStr()
        this.table = this.nextLenEncStr()
        this.tableOrg = this.nextLenEncStr()
        this.name = this.nextLenEncStr()
        this.nameOrg = this.nextLenEncStr()
        this.nextLenEncUint() // always 0x0c
        this.charset = this.nextUint(2)
        this.columnLen = this.nextUint(4)
        this.columnType = this.nextUint(1)
        this.flags = this.nextUint(2)
        this.decimals = this.nextUint(1)
        this.skip(2) // filler [0x00, 0x00]
    }

}

module.exports = ColumnDefinitionPacket