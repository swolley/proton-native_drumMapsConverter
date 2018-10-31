import React, { Component } from 'react';
import { render, App, Menu } from 'proton-native';

import Convert from './src/Convert';
import MapsList from './src/MapsList';

class Main extends Component {

	state = {
		window: ''
	};

	getWindow() {
		switch (this.state.window) {
			case 'mapsList':
				return <MapsList />;
			case 'convert':
			default:
				return <Convert />;
		}
	}

	switchWindow(newWindow) { 
		this.setState(Object.assign(this.state, { window: newWindow }));
	}

	render() {
		let currentWindow = this.getWindow();

		return (
			<App>
				<Menu label={"Menu"}>
					<Menu.Item onClick={() => this.switchWindow('convert')}>Convert</Menu.Item>
					<Menu.Item onClick={() => this.switchWindow('mapsList')}>Maps</Menu.Item>
					<Menu.Item type={"Separator"}></Menu.Item>
					<Menu.Item type={"Quit"}></Menu.Item>
				</Menu>
				{currentWindow}
			</App>
		);
	}
}

render(<Main />);
