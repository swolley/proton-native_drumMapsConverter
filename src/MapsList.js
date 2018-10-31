import React, { Component } from 'react';
import { render, App, Window, Grid, Text } from 'proton-native';
import fs from 'fs';

export default class MapsList extends Component {

	state = {
		list: []
	};

	render() {
		return (
			<App>
				<Window title="Handles DrumMaps" menuBar={true} margined={true}>
					<Grid padded={true}>
						<Text row={0} column={1}>Ciao</Text>
						<Text row={1} column={1}>Ciao</Text>
						<Text row={2} column={1}>Ciao</Text>
					</Grid>
				</Window>
			</App>
		);
	}
}
