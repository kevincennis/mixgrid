mixgrid
=======

### from the console, try:

create a new track...
`mix.createTrack('handclaps')`
`var handclaps = mix.tracks.findWhere({name: 'handclaps'});`

lay down some nasty claps...
`handclaps.record()`

(no visual indication that you're recording yet...)

when you're done...
`handclaps.recordStop()`

manually set the playback head position (in seconds)...
mix.set('position', 10)
