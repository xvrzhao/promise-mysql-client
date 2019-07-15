class BufferWriter {
    _buffer = Buffer.alloc(1000)
    _offset = 0

    writeInt(num, byteLen) {
        this._buffer.writeIntLE(num, this._offset, byteLen)
        this._offset += byteLen
        return this
    }

    writeUint(num, byteLen) {
        this._buffer.writeUIntLE(num, this._offset, byteLen)
        this._offset += byteLen
        return this
    }

    writeNulTerminatedString(str) {
        let len
        this._buffer.write(str, this._offset, len = Buffer.byteLength(str) + 1)
        this._offset += len
        return this
    }

    writeStringEOF(str) {
        this._buffer.write(str, this._offset)
        this._offset += Buffer.byteLength(str)
        return this
    }

    writeBuffer(buf, bufStart, bufEnd) {
        buf.copy(this._buffer, this._offset, bufStart, bufEnd)
        if (bufStart === undefined)
            this._offset += buf.length
        else
            this._offset += bufEnd - bufStart

        return this
    }

    writeNulTerminatedBuffer(buf, bufStart, bufEnd) {
        return this.writeBuffer(buf, bufStart, bufEnd).skip(1)
    }

    skip(len) {
        this._offset += len
        return this
    }

    get writtenBuffer() {
        return this._buffer.slice(0, this._offset)
    }
}

module.exports = BufferWriter