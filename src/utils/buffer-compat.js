const buffer = require("node:buffer");

if (typeof buffer.SlowBuffer === "undefined") {
  buffer.SlowBuffer = buffer.Buffer;
}
