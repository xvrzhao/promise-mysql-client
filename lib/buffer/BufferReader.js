class BufferReader {
    /**
     * @property {Buffer}
     */
    _buffer
    _length
    _offset = 0

    constructor(buffer) {
        this._buffer = buffer
        this._length = buffer.length
    }

    nextUint(len) {
        const num = this._buffer.readUIntLE(this._offset, len)
        this._offset += len
        return num
    }

    nextUintNotMove(len) {
        return this._buffer.readUIntLE(this._offset, len)
    }

    nextString(len) {
        const str = this._buffer.toString('utf8', this._offset, this._offset += len)
        return str
    }

    nextNulTerminatedString() {
        const index = this._buffer.indexOf(0x0, this._offset)
        const str = this._buffer.toString('utf8', this._offset, index)
        this._offset = index + 1
        return str
    }

    nextBufferRef(len) {
        return this._buffer.slice(this._offset, this._offset += len)
    }

    nextLenEncUint() {
        const encLen = this.nextBufferRef(1)[0]
        if (encLen < 0xfb) {
            return encLen
        } else if (encLen === 0xfc) {
            return this.nextUint(2)
        } else if (encLen === 0xfd) {
            return this.nextUint(3)
        } else if (encLen === 0xfe) {
            return this.nextUint(8)
        }
    }

    nextLenEncStr() {
        return this.nextString(this.nextLenEncUint())
    }

    skip(len) {
        this.nextBufferRef(len)
    }

    restString() {
        const str = this._buffer.toString('utf8', this._offset)
        this._offset = this._length
        return str
    }

    restBufferRef() {
        const buf = this._buffer.slice(this._offset)
        this._offset = this._length
        return buf
    }

    hasMoreData() {
        return this._offset < this._length
    }

}

module.exports = BufferReader