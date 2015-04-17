'use strict';

var React = require('react');

var Input = require('react-bootstrap').Input;

var DataFilter = React.createClass({
    getInitialState() {
        return {
            data: this.props.data,
            filterKeys: this.props.filterKeys,
            filter: ""
        }
    },
    componentWillReceiveProps(newProps) {
        this.setState({
            data: newProps.data,
            filterKeys: newProps.filterKeys
        });
    },
    onFilterUpdate(event) {
        this.setState({filter: event.target.value}, this.filterData);
    },
    filterData() {
        var filteredData = this.state.data.filter((datum) => {
            return this.state.filterKeys.some((filterKey) => {
                return datum[filterKey].indexOf(this.state.filter) != -1
            });
        });

        this.props.onFilterUpdate(filteredData);
    },
    render() {
        return (
            <form className="form-inline">
                <Input type="text"
                       label={this.props.label}
                       name="filter"
                       value={this.state.filter}
                       onChange={this.onFilterUpdate}/>
            </form>
        );
    }
});

module.exports = DataFilter;