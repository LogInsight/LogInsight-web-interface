import React from 'react';
import ReactDOM from 'react-dom';
import { Input } from 'react-bootstrap';
import { substringMatcher } from 'logic/search/UniversalSearch';

require('!script!../../../public/javascripts/jquery-2.1.1.min.js');
require('!script!../../../public/javascripts/typeahead.jquery.min.js');

const TypeAheadInput = React.createClass({
  propTypes: {
    label: React.PropTypes.string.isRequired,
    onKeyPress: React.PropTypes.func,
  },

  componentDidMount() {
    this._updateTypeahead(this.props);
  },
  componentWillReceiveProps(newProps) {
    this._destroyTypeahead();
    this._updateTypeahead(newProps);
  },
  componentWillUnmount() {
    this._destroyTypeahead();
  },

  getValue() {
    return $(this.fieldInput).typeahead('val');
  },
  clear() {
    $(this.fieldInput).typeahead('val', '');
  },
  _destroyTypeahead() {
    $(this.fieldInput).typeahead('destroy');
    $(this.fieldFormGroup).off('typeahead:select typeahead:autocomplete');
  },
  _updateTypeahead(props) {
    this.fieldInput = this.refs.fieldInput.getInputDOMNode();
    this.fieldFormGroup = ReactDOM.findDOMNode(this.refs.fieldInput);

    const $fieldInput = $(this.fieldInput);

    // props.suggestions:
    // [ "some string", "otherstring" ]
    $fieldInput.typeahead({
      hint: true,
      highlight: true,
      minLength: 1,
    },
      {
        name: 'dataset-name',
        displayKey: props.displayKey,
        source: substringMatcher(props.suggestions, props.displayKey, 6),
        templates: {
          suggestion: (value) => `<div><strong>${ props.suggestionText }</strong> ${ value.value }</div>`,
        },
      });

    if (typeof props.onTypeaheadLoaded === 'function') {
      props.onTypeaheadLoaded();
      $fieldInput.typeahead('close');
    }

    $(this.fieldFormGroup).on('typeahead:select typeahead:autocomplete', (event, suggestion) => {
      props.onSuggestionSelected(event, suggestion);
    });
  },
  render() {
    return (<Input type="text" ref="fieldInput"
                   wrapperClassName="typeahead-wrapper"
                   label={this.props.label}
                   onKeyPress={this.props.onKeyPress}/>);
  },
});

export default TypeAheadInput;
