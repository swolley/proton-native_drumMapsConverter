import xml2js from 'xml2js';
import fs from 'fs';
var MidiConvert = require('midiconvert');

var unusedNote = '0';

class DrumMapConverter {
    constructor() {
        this._parser = new xml2js.Parser();
        this._fromMap = { /*name: "", map: []*/ };
        this._toMap = { /*name: "", map: []*/ };
        this._fromMidi = {};
        this._toMidi = {};
    }

    /**
     * checks if either maps and midi have been loaded correctly
     */
    canConvert() { 
        return Object.keys(this._fromMap).length && Object.keys(this._toMap).length && Object.keys(this._fromMidi).length;
    }


    /**
     * get map name
     * @param {string} direction "from" or "to". choose which map
     */
    getMapName(direction) {
        return direction === "from" ? this._fromMap.name : this._toMap.name;
    }

    /**
     * load midi from file and parse it
     * @param   {string}    filename    source midi file path
     */
    readMidi(filename) {
        try {
            let midiBlob = fs.readFileSync(filename, "binary");
            this._fromMidi = MidiConvert.parse(midiBlob);
            return true;
        } catch (e) { 
            return e;
        }
    }

    /**
     * save midi to file
     * @param   {string}    filename    destination midi file path
     */
    saveMidi(filename) {
        try {
            fs.writeFileSync(filename, this._toMidi.encode(), "binary");
            return true;
        } catch (e) { 
            return e;
        }
    }

    /**
     * load xml drum map from file and parse it
     * @param   {string}      filename          xml file path
     * @param   {string}      direction         "from" or "to"
     * @param   {function}    resultCallback    returns back parsedObject
     */
    readMap(filename, direction, resultCallback) {
        try {
            var xmlMap = fs.readFileSync(filename);
            this._parser.parseString(xmlMap, (err, result) => {
                if (err) {
                    throw `Parse error: ${err}`;
                }

                var parsedMidiMap = {
                    name: "",
                    map: []
                };
                parsedMidiMap.name = result.DrumMap.string[0].$.value;

                let filtered = result.DrumMap.list.filter((item) => item.$.name === 'Map');

                if (filtered.length !== 1 || !('item' in filtered[0])) {
                    throw "File doesn't contain a Cubase's Drum Map";
                }

                filtered[0].item.forEach((item) => {
                    var newItem = {
                        name: item.string[0].$.value,
                    };

                    item.int.forEach((note) => {
                        switch (note.$.name) {
                            case 'INote':
                                newItem.note = note.$.value;
                                break;
                            case 'ONote':
                                newItem.gm = ["", "---"].includes(newItem.name) ? unusedNote : note.$.value;
                                break;
                        }
                    });

                    //if direction = FROM array index = drummap note
                    //if direction = TO array index = gm note
                    if (direction === "from") {
                        parsedMidiMap.map[newItem.note] = newItem;
                        this._fromMap = parsedMidiMap;
                    } else {
                        parsedMidiMap.map[newItem.gm] = newItem;
                        this._toMap = parsedMidiMap;
                    }

                    resultCallback(true);
                });
            });
        } catch (e) {
            resultCallback(e);
        }
    }

    /**
     * converts parsed source midi and create new object with only percussion tracks
     * @param   {function}  callback    response via callback
     */
    convertMidi(callback) {
        let results = [];
        try {
            this._results.push("-- Converting MIDI --");
            this._toMidi = MidiConvert.create();
            this._toMidi = Object.assign(this._toMidi, this._fromMidi);
            //extract only percussion tracks
            let drumsTracks = this._toMidi.tracks.filter((track) => {
                return track.isPercussion;
            });

            if (drumsTracks.length === 0) {
                throw "No percussion track found";
            }

            drumsTracks.forEach((track) => {
                let unusedTot = 0;
                track.notes.forEach((note) => {
                    let gmNote = this._fromMap.map[note.midi].gm;
                    //capire con le note vuote ""
                    note.midi = this._toMap.map[gmNote].note;
                    
                    if (gmNote === unusedNote) { 
                        unusedTot ++;
                    }
                });
                results.push(`Track "${track.name}": ${track.notes.length} notes converted` + (unusedTot > 0 ? + `, ${unusedTot} unmapped and set to note ${unusedNote}` : ''));
            });

            results.push("");
            //overwrite tracks inside imported midi
            //exported midi will contain only percussion tracks
            this._toMidi.tracks = drumsTracks;
            //resolve(true);
            callback(true, results);
        } catch (e) {
            callback(false, e);
        }
    }

}

module.exports = DrumMapConverter;