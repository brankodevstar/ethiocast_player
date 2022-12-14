import React, {Component, PropTypes} from 'react';
import {Image} from 'react-native';

export default class ScaledImage extends Component {
    constructor(props) {
        super(props);
        this.state = {source: {uri: this.props.uri}};
    }

    componentDidMount() {
        Image.getSize(this.props.uri, (width, height) => {
            if (this.props.width && !this.props.height) {
                this.setState({
                    width: this.props.width,
                    height: height * (this.props.width / width),
                });
            } else if (!this.props.width && this.props.height) {
                this.setState({
                    width: width * (this.props.height / height),
                    height: this.props.height,
                });
            } else {
                this.setState({width: width, height: height});
            }
        });
    }
    componentWillUnmount() {
        this.setState = (state, callback) => {
            return;
        };
    }
    render() {
        return (
            <Image
                {...this.props}
                source={this.state.source}
                style={[
                    this.props.style,
                    {
                        height: this.state.height,
                        width: this.state.width,
                        borderRadius: 2,
                    },
                ]}
            />
        );
    }
}
