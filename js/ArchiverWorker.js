// dispatch incoming messages
this.onmessage = function(evt){
  var sampleRate = evt.data.sampleRate
    , buffers = evt.data.buffers;
  exportBlob(buffers, sampleRate);
};

// interleave left and right buffer data
function interleave(left, right){
  var len = left.length + right.length
    , result = new Float32Array(len)
    , inputIndex = i = 0;
  while ( i < len ){
    result[i++] = left[inputIndex];
    result[i++] = right[inputIndex];
    inputIndex++;
  }
  return result;
}

// convert signed 32-bit floats to signed 16-bit integers
function float32Toint16(view, offset, input){
  var i = 0, len = input.length, sample;
  for ( ; i < len; i++, offset += 2 ){
    sample = input[i] < -1 ? -1 : input[i] > 1 ? 1 : input[i];
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
  }
}

// write a string as an unsigned 8-bit value into
// the supplied DataView at the given offset
function stringToUint8(view, offset, str){
  var i = 0, len = str.length;
  for ( ; i < len; i++)
    view.setUint8(offset + i, str.charCodeAt(i));
}

// export the WAV as a Blob
function exportBlob(buffers, sampleRate){
  var buffer = interleave(buffers[0], buffers[1])
    , dataView = encode(buffer, sampleRate)
    , blob = new Blob([dataView], {type: 'audio/wav'});
  this.postMessage(blob);
}

// set RIFF header and subchunks,
// endode PCM data to WAV
// https://ccrma.stanford.edu/courses/422/projects/WaveFormat/
function encode(samples, sampleRate){
  var arrayBuffer = new ArrayBuffer(44 + samples.length * 2)
    , dataView = new DataView(arrayBuffer)
    , blob;
  // ChunkID (big-endian)
  stringToUint8(dataView, 0, 'RIFF');
  // Chunk Size (little-endian)
  dataView.setUint32(4, 36 + samples.length * 2, true);
  // Format (big-endian)
  stringToUint8(dataView, 8, 'WAVE');
  // Subchunk1 ID (big-endian)
  stringToUint8(dataView, 12, 'fmt ');
  // Subchunk1 Size (little-endian)
  dataView.setUint32(16, 16, true);
  // Audio Format (little-endian)
  dataView.setInt16(20, 1, true);
  // Num Channels (little-endian)
  dataView.setInt16(22, 2, true);
  // Sample Rate (little-endian)
  dataView.setUint32(24, sampleRate, true);
  // Byte Rate (little-endian)
  dataView.setUint32(28, sampleRate * 2 * 16 / 8, true);
  // Block Align (little-endian)
  dataView.setInt16(32, 2 * 32 / 8, true);
  // Bits Per Sample (little-endian)
  dataView.setInt16(34, 16, true);
  // Subchunk2 ID (big-endian)
  stringToUint8(dataView, 36, 'data');
  // Subchunk2 Size (little-endian)
  dataView.setUint32(40, samples.length * 2, true);
  // data (big-endian)
  float32Toint16(dataView, 44, samples);
  return dataView;
}