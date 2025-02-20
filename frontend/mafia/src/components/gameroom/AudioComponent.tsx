import React, { Component } from 'react';

export default class AudioComponent extends Component {
  constructor(props) {
    super(props);
    this.audioRef = React.createRef();
  }

  componentDidUpdate(prevProps) {
    if (this.props.streamManager !== prevProps.streamManager && this.audioRef.current) {
      this.props.streamManager.addAudioElement(this.audioRef.current);
    }
  }

  componentDidMount() {
    if (this.props.streamManager && this.audioRef.current) {
      this.props.streamManager.addAudioElement(this.audioRef.current);
    }
  }

  render() {
    return (
      <audio
        autoPlay
        ref={this.audioRef}
      />
    );
  }
}
