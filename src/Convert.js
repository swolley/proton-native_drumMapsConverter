import React, { Component } from 'react';
import { render, Window, App, Dialog, Button, Text, Grid, Picker, Group, Box } from 'proton-native';
import fs from 'fs';
import path from "path";

import DrumMapConverter from './DrumMapConverter';
import { TIMEOUT } from 'dns';
var converter = new DrumMapConverter();

export default class Convert extends Component {

	state = {
		fromIndex: -1,
		toIndex: -1,
		midifilename: '',
		result: '',
		description: [],
		availableMaps: []
	};

	componentWillMount() {
		let mapsPath = path.resolve(__dirname, '../maps');
		this.state.availableMaps = fs.readdirSync(mapsPath).map(file => {
			let mapname = file.replace('.xml', '').replace(/([A-Z]|[0-9])/g, ' $1').trim();
			return { filepath: `${mapsPath}/${file}`, mapname: mapname.charAt(0).toUpperCase() + mapname.slice(1) };
		});
	}

	convert() {
		converter.convertMidi((result, description) => {
			var newDescription = this.state.description;

			result
				? newDescription = newDescription.concat(description)
				: newDescription.push((new Date()).toLocaleTimeString('en-GB') + ': ' + result);

			this.setState(Object.assign(this.state, { result, description: newDescription }));
		});


	}

	save() {
		const filename = Dialog('Save');
		if (filename) {
			let result = converter.saveMidi(filename);
			let newDescription = this.state.description;
			this.state.description.push((new Date()).toLocaleTimeString('en-GB') + ': ' + (result === true ? "File saved" : result));
			this.setState(Object.assign(this.state, { description: newDescription }));
		}
	}

	openMap(direction, index) {
		let currentIndex = direction === "from" ? this.state.fromIndex : this.state.toIndex;
		if (index !== -1 && index !== currentIndex) {
			const filename = this.state.availableMaps[index].filepath;
			if (filename && ["to", "from"].includes(direction)) {
				converter.readMap(filename, direction, (result) => {
					let name = filename.split('/').pop();
					let message = `Loaded "${direction}" map ${name}`;
					if (result !== true) {
						message = result;
					}

					//console.log(Date.now(), currentIndex, index);
					//console.debug(message);
					//let state = this.state;
					//state.description.push((new Date()).toLocaleTimeString('en-GB') + ': ' + message);
					//direction === "from" ? state.fromIndex = index : state.toIndex = index;

					//this.setState(state);
				});
			}
		}
	}

	openMidi() {
		const filename = Dialog('Open');
		if (filename) {
			let name = filename.split('/').pop();
			let message = `Loaded ${name} MIDI file`;
			let result = converter.readMidi(filename);

			if (result !== true) {
				message = result;
			}

			let newDescription = this.state.description;
			newDescription.push((new Date()).toLocaleTimeString('en-GB') + ': ' + message);

			this.setState(Object.assign(this.state, { midi: filename, description: newDescription }));
		}
	}

	render() {
		let serviceItems = this.state.availableMaps.map((s, i) => {
			return <Picker.Item key={i}>{s.mapname}</Picker.Item>
		});

		return (
			<App>
				<Window title="Drum Maps Converter" size={{ w: 100, h: 200 }} menuBar margined>
					<Box stretchy={false}>
						<Group title="FILES" stretchy={false} margined>
							<Grid padded>
								<Text row={0} column={0}>From Map</Text><Picker row={0} column={1} onSelect={(index) => this.openMap("from", index)}>{serviceItems}</Picker>
								<Text row={1} column={0}>To Map</Text><Picker row={1} column={1} onSelect={(index) => this.openMap("to", index)}>{serviceItems}</Picker>
								<Text row={2} column={0}>Midi</Text><Button row={2} column={1} onClick={() => this.openMidi()}>           Choose file ...            </Button>
								<Button row={3} column={1} onClick={() => this.convert()} enabled={converter.canConvert() ? true : false}>   START CONVERTION    </Button>
								<Button row={4} column={1} onClick={() => this.save()} enabled={this.state.result === true ? true : false}>SAVE CONVERTED MIDI</Button>
							</Grid>
						</Group>
						<Group title="OUTPUT" stretchy={false} margined>
							<Text>{this.state.description.join('\n')}</Text>
						</Group>
					</Box>
				</Window>
			</App>
		);
	}
}