import React, { Component } from 'react';
import './App.css';
import { ContainerGrid } from './components/container-grid/container-grid.component'

class App extends Component {

  constructor() {
    super();
    this.state = {containers: []};
  }

  componentDidMount() {
    fetch("https://codetest.eranga.org/api/containers")
    .then(response => response.json())
    .then(containers => this.setState({containers}));
  }

  render() {
    return (
      <div className="App">
        <ContainerGrid containers={this.state.containers} />
      </div>
    );
    }
}

export default App;
