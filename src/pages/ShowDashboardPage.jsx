import React from 'react';
import Reflux from 'reflux';
import { Row, Col, Button, Alert } from 'react-bootstrap';

import CurrentUserStore from 'stores/users/CurrentUserStore';
import DashboardsStore from 'stores/dashboards/DashboardsStore';
import FocusStore from 'stores/tools/FocusStore';
import WidgetsStore from 'stores/widgets/WidgetsStore';

import DocsHelper from 'util/DocsHelper';
import UserNotification from 'util/UserNotification';

import { GridsterContainer, GridsterWidget, PageHeader, Spinner } from 'components/common';
import PermissionsMixin from 'util/PermissionsMixin';
import DocumentationLink from 'components/support/DocumentationLink';
import EditDashboardModalTrigger from 'components/dashboard/EditDashboardModalTrigger';
import Widget from 'components/widgets/Widget';

const ShowDashboardPage = React.createClass({
  mixins: [Reflux.connect(CurrentUserStore), Reflux.connect(FocusStore), PermissionsMixin],

  getInitialState() {
    return {
      locked: true,
      forceUpdateInBackground: false,
    };
  },
  componentDidMount() {
    this.loadData();
    this.listenTo(WidgetsStore, this.removeWidget);
    this.loadInterval = setInterval(this.loadData, 2000);
  },
  componentWillUnmount() {
    if (this.loadInterval) {
      clearInterval(this.loadInterval);
    }
  },
  loadData() {
    DashboardsStore.get(this.props.params.dashboardId)
      .then((dashboard) => {
        if (this.isMounted()) {
          this.setState({dashboard: dashboard});
        }
      });
  },
  DASHBOARDS_EDIT: 'dashboards:edit',
  updateUnFocussed() {
    return this.state.currentUser.preferences.updateUnfocussed;
  },
  shouldUpdate() {
    return this.updateUnFocussed() || this.state.forceUpdateInBackground || this.state.focus;
  },
  removeWidget(props) {
    if (props.delete) {
      this.loadData();
    }
  },
  emptyDashboard() {
    return (
      <Row className="content">
        <Col md={12}>
          <Alert className="no-widgets">
            This dashboard has no widgets yet. Learn how to add widgets in the <DocumentationLink page={DocsHelper.PAGES.DASHBOARDS} text="documentation"/>.
          </Alert>
        </Col>
      </Row>
    );
  },
  formatDashboard(dashboard) {
    if (dashboard.widgets.length === 0) {
      return this.emptyDashboard();
    }

    const widgets = this.state.dashboard.widgets.sort((d1, d2) => {
      if (d1.col === d2.col) {
        return d1.row < d2.row;
      }

      return d1.col < d2.col;
    }).map((widget) => {
      return (
        <Widget id={widget.id} key={'widget-' + widget.id} widget={widget} dashboardId={dashboard.id}
                locked={this.state.locked} shouldUpdate={this.shouldUpdate()}/>
      );
    });
    return (
      <Row>
        <div className="dashboard">
          <GridsterContainer ref="gridsterContainer" positions={this.state.dashboard.positions}>
            {widgets}
          </GridsterContainer>
        </div>
      </Row>
    );
  },
  _onUnlock() {
    const locked = !this.state.locked;
    this.setState({locked: locked});

    if (locked) {
      this.refs.gridsterContainer.lockGrid();
    } else {
      this.refs.gridsterContainer.unlockGrid();
    }
  },
  _onPositionsChanged() {
    const positions = this.state.dashboardGrid.serialize().map((position) => {
      return {id: position.id, col: position.col, row: position.row, width: position.size_x, height: position.size_y};
    });
    const dashboard = this.state.dashboard;

    DashboardsStore.updatePositions(dashboard, positions);
  },
  _toggleFullscreen() {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  },
  _toggleUpdateInBackground() {
    const forceUpdate = this.state.forceUpdateInBackground;
    this.setState({forceUpdateInBackground: !forceUpdate});
    UserNotification.success('Graphs will be updated ' + (forceUpdate ? 'even' : 'only')
      + ' when the browser is in the ' + (forceUpdate ? 'background' : 'foreground'), '');
  },
  render() {
    if (!this.state.dashboard) {
      return <Spinner />;
    }

    const dashboard = this.state.dashboard;
    const currentUser = this.state.currentUser;

    const actions = dashboard.widgets.length > 0 ? (
      <span className="pull-right">
        <Button id="update-unfocussed" bsStyle="info" onClick={this._toggleUpdateInBackground}>
          Update in {this.state.forceUpdateInBackground ? 'foreground' : 'background'}
        </Button>
        {' '}
        <Button className="toggle-fullscreen" bsStyle="info" onClick={this._toggleFullscreen}>Fullscreen</Button>
        {this.isPermitted(currentUser.permissions, this.DASHBOARDS_EDIT + ':' + dashboard.id) &&
        <span>
            {' '}
          <Button bsStyle="success" onClick={this._onUnlock}>{this.state.locked ? <span>Unlock / Edit</span> : <span>Lock</span>}</Button>
          &nbsp;
          </span>}
      </span>) : null;

    const supportText = this.isPermitted(currentUser.permissions, this.DASHBOARDS_EDIT + ':' + dashboard.id)
      && dashboard.widgets.length > 0 ?
      (<div id="drag-widgets-description">
          Drag widgets to any position you like in <a role="button" onClick={() => this.setState({locked: false})}>
          unlock / edit</a>{' '}
          mode.
      </div>) : null;

    const dashboardTitle = (
      <span>
        <span data-dashboard-id={dashboard.id} className="dashboard-title">{dashboard.title}</span>
        {!this.state.locked &&
        <EditDashboardModalTrigger id={dashboard.id} action="edit" title={dashboard.title}
                                   description={dashboard.description} buttonClass="btn-info btn-xs">
          <i className="fa fa-pencil"/>
        </EditDashboardModalTrigger>}
      </span>
    );
    return (
      <span>
        <PageHeader title={dashboardTitle} titleSize={8} buttonSize={4} buttonStyle={{textAlign: 'center'}}>
          <span data-dashboard-id={dashboard.id} className="dashboard-description">{dashboard.description}</span>
          {supportText}
          {actions}
        </PageHeader>

        {this.formatDashboard(dashboard)}
      </span>
    );
  },
});

export default ShowDashboardPage;
