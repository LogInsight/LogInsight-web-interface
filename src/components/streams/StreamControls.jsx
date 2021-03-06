/* global jsRoutes */

'use strict';

var React = require('react');
var DropdownButton = require('react-bootstrap').DropdownButton;
var MenuItem = require('react-bootstrap').MenuItem;
var StreamForm = require('./StreamForm');
var PermissionsMixin = require('../../util/PermissionsMixin');
import { LinkContainer } from 'react-router-bootstrap';
import Routes from 'routing/Routes';

var StreamControls = React.createClass({
    mixins: [PermissionsMixin],
    getInitialState() {
        return {};
    },
    _onDelete(event) {
        event.preventDefault();
        this.props.onDelete(this.props.stream);
    },
    _onEdit(event) {
        event.preventDefault();
        this.refs.streamForm.open();
    },
    _onClone(event) {
        event.preventDefault();
        this.refs.cloneForm.open();
    },
    _onCloneSubmit(streamId, stream) {
        this.props.onClone(this.props.stream.id, stream);
    },
    _onQuickAdd(event) {
        event.preventDefault();
        this.props.onQuickAdd(this.props.stream.id);
    },
    render() {
        var permissions = this.props.permissions;
        var stream = this.props.stream;

        var menuItems = [];

        if (this.isPermitted(permissions, ['streams:edit:' + stream.id])) {
            menuItems.push(<MenuItem key={"editStreams-" + stream.id} onSelect={this._onEdit}>Edit stream</MenuItem>);
            menuItems.push(<MenuItem key={"quickAddRule-" + stream.id} onSelect={this._onQuickAdd}>Quick add rule</MenuItem>);
        }

        if (this.isPermitted(permissions, ["streams:create", "streams:read:" + stream.id])) {
            menuItems.push(<MenuItem key={"cloneStream-" + stream.id} onSelect={this._onClone}>Clone this stream</MenuItem>);
        }

        if (this.props.user) {
            menuItems.push(<LinkContainer key={'setAsStartpage-' + stream.id} to={Routes.startpage_set('stream', stream.id)}>
              <MenuItem disabled={this.props.user.readonly}>
                Set as startpage
              </MenuItem>
            </LinkContainer>);
        }

        if (this.isPermitted(permissions, ['streams:edit:' + stream.id])) {
            menuItems.push(<MenuItem key={'divider-' + stream.id} divider />);
            menuItems.push(<MenuItem key={'deleteStream-' + stream.id} onSelect={this._onDelete}>Delete this stream</MenuItem>);
        }

        return (
            <span>
                <DropdownButton title='More actions' ref='dropdownButton' pullRight={true} id={`more-actions-dropdown-${stream.id}`}>
                    {menuItems}
                </DropdownButton>
                <StreamForm ref='streamForm' title="Editing Stream" onSubmit={this.props.onUpdate} stream={stream}/>
                <StreamForm ref='cloneForm' title="Cloning Stream" onSubmit={this._onCloneSubmit}/>
            </span>
        );
    }
});

module.exports = StreamControls;
