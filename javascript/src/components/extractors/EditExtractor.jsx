import React, {PropTypes} from 'react';
import {Row, Col, Input, Button, FormControls} from 'react-bootstrap';

import ExtractorExampleMessage from './ExtractorExampleMessage';
import EditExtractorConfiguration from './EditExtractorConfiguration';
import EditExtractorConverters from './EditExtractorConverters';
import ExtractorsActions from 'actions/extractors/ExtractorsActions';

import ExtractorUtils from 'util/ExtractorUtils';
import FormUtils from 'util/FormsUtils';

import ToolsStore from 'stores/tools/ToolsStore';

const EditExtractor = React.createClass({
  propTypes: {
    extractor: PropTypes.object,
    inputId: PropTypes.string.isRequired,
    exampleMessage: PropTypes.string,
  },
  getDefaultProps() {
    return {
      exampleMessage: 'This is an example message, please change me!',
    };
  },
  getInitialState() {
    return {
      updatedExtractor: this.props.extractor,
      conditionTestResult: undefined,
    };
  },
  // Ensures the target field only contains alphanumeric characters and underscores
  _onTargetFieldChange(event) {
    const value = event.target.value;
    const newValue = value.replace(/[^\w\d_]/g, '');

    if (value !== newValue) {
      this.refs.targetField.getInputDOMNode().value = newValue;
    }

    this._onFieldChange('target_field')(event);
  },
  _onFieldChange(key) {
    return (event) => {
      const nextState = {};
      const updatedExtractor = this.state.updatedExtractor;
      updatedExtractor[key] = FormUtils.getValueFromInput(event.target);
      nextState.updatedExtractor = updatedExtractor;

      // Reset result of testing condition after a change in the input
      if (key === 'condition_value') {
        nextState.conditionTestResult = undefined;
      }

      this.setState(nextState);
    };
  },
  _onConfigurationChange(key) {
    return (event) => {
      const updatedExtractor = this.state.updatedExtractor;
      updatedExtractor.extractor_config[key] = FormUtils.getValueFromInput(event.target);
      this.setState({updatedExtractor: updatedExtractor});
    };
  },
  _onConverterChange(converterType, newConverter) {
    const updatedExtractor = this.state.updatedExtractor;
    const previousConverter = updatedExtractor.converters.filter(converter => converter.type === converterType)[0];

    if (previousConverter) {
      // Remove converter from the list
      const position = updatedExtractor.converters.indexOf(previousConverter);
      updatedExtractor.converters.splice(position, 1);
    }

    if (newConverter) {
      updatedExtractor.converters.push(newConverter);
    }

    this.setState({updatedExtractor: updatedExtractor});
  },
  _testCondition() {
    const promise = ToolsStore.testRegex(this.state.updatedExtractor.condition_value, this.props.exampleMessage);
    promise.then(result => this.setState({conditionTestResult: result.matched}));
  },
  _getExtractorConditionControls() {
    let conditionInput;

    if (this.state.updatedExtractor.condition_type !== 'none') {
      let conditionInputLabel;
      let conditionInputHelp;

      if (this.state.updatedExtractor.condition_type === 'string') {
        conditionInputLabel = 'Field contains string';
        conditionInputHelp = 'Type a string that the field should contain in order to attempt the extraction.';
      } else {
        conditionInputLabel = 'Field matches regular expression';
        conditionInputHelp = 'Type a regular expression that the field should contain in order to attempt the extraction.';
      }

      let inputStyle;
      if (this.state.conditionTestResult === true) {
        inputStyle = 'success';
        conditionInputHelp = 'Matches! Extractor would run against this example.';
      } else if (this.state.conditionTestResult === false) {
        inputStyle = 'error';
        conditionInputHelp = 'Does not match! Extractor would not run.';
      }

      conditionInput = (
        <div>
          <Input id="condition_value" label={conditionInputLabel}
                 bsStyle={inputStyle}
                 labelClassName="col-md-2"
                 wrapperClassName="col-md-10"
                 help={conditionInputHelp}>
            <Row className="row-sm">
              <Col md={11}>
                <input type="text" id="condition_value" className="form-control"
                       defaultValue={this.state.updatedExtractor.condition_value}
                       onChange={this._onFieldChange('condition_value')} required/>
              </Col>
              <Col md={1} className="text-right">
                <Button bsStyle="info" onClick={this._testCondition}
                        disabled={this.state.updatedExtractor.condition_value === ''}>
                  Try
                </Button>
              </Col>
            </Row>
          </Input>
        </div>
      );
    }

    return conditionInput;
  },
  _updateExtractor(event) {
    event.preventDefault();
    ExtractorsActions.update.triggerPromise(this.props.inputId, this.state.updatedExtractor);
  },
  render() {
    // TODO:
    // - Add converters
    // - Load recent message from input

    const targetFieldHelpMessage = (
      <span>
        Choose a field name to store the extracted value. It can only contain <b>alphanumeric characters and{' '}
        underscores</b>. Example: <em>http_response_code</em>.
      </span>
    );

    return (
      <div>
        <Row className="content extractor-list">
          <Col md={12}>
            <h2>Example message</h2>
            <Row style={{marginTop: 5}}>
              <Col md={12}>
                <ExtractorExampleMessage field={this.state.updatedExtractor.target_field}
                                         example={this.props.exampleMessage}/>
              </Col>
            </Row>
            <h2>Extractor configuration</h2>
            <Row>
              <Col md={8}>
                <form className="extractor-form form-horizontal" method="POST" onSubmit={this._updateExtractor}>
                  <FormControls.Static label="Extractor type"
                                       value={ExtractorUtils.getReadableExtractorTypeName(this.state.updatedExtractor.type)}
                                       labelClassName="col-md-2" wrapperClassName="col-md-10"/>
                  <FormControls.Static label="Source field" value={this.state.updatedExtractor.source_field}
                                       labelClassName="col-md-2" wrapperClassName="col-md-10"/>

                  <EditExtractorConfiguration ref="extractorConfiguration"
                                              extractorType={this.state.updatedExtractor.type}
                                              configuration={this.state.updatedExtractor.extractor_config}
                                              onChange={this._onConfigurationChange}
                                              exampleMessage={this.props.exampleMessage}/>

                  <Input label="Condition" labelClassName="col-md-2" wrapperClassName="col-md-10"
                         help="Extracting only from messages that match a certain condition helps you avoiding wrong or unnecessary extractions and can also save CPU resources.">
                    <div className="radio">
                      <label>
                        <input type="radio" name="condition_type" value="none"
                               onChange={this._onFieldChange('condition_type')}
                               defaultChecked={this.state.updatedExtractor.condition_type === 'none'}/>
                        Always try to extract
                      </label>
                    </div>
                    <div className="radio">
                      <label>
                        <input type="radio" name="condition_type" value="string"
                               onChange={this._onFieldChange('condition_type')}
                               defaultChecked={this.state.updatedExtractor.condition_type === 'string'}/>
                        Only attempt extraction if field contains string
                      </label>
                    </div>
                    <div className="radio">
                      <label>
                        <input type="radio" name="condition_type" value="regex"
                               onChange={this._onFieldChange('condition_type')}
                               defaultChecked={this.state.updatedExtractor.condition_type === 'regex'}/>
                        Only attempt extraction if field matches regular expression
                      </label>
                    </div>
                  </Input>
                  {this._getExtractorConditionControls()}

                  <Input type="text" ref="targetField" id="target_field" label="Store as field"
                         defaultValue={this.state.updatedExtractor.target_field}
                         labelClassName="col-md-2"
                         wrapperClassName="col-md-10"
                         onChange={this._onTargetFieldChange}
                         required
                         help={targetFieldHelpMessage}/>


                  <Input label="Extraction strategy" labelClassName="col-md-2" wrapperClassName="col-md-10"
                         help={<span>Do you want to copy or cut from source? You cannot use the cutting feature on standard fields like <em>message</em> and <em>source</em>.</span>}>
                    <label className="radio-inline">
                      <input type="radio" name="cursor_strategy" value="copy"
                             onChange={this._onFieldChange('cursor_strategy')}
                             defaultChecked={this.state.updatedExtractor.cursor_strategy === 'copy'}/>
                      Copy
                    </label>
                    <label className="radio-inline">
                      <input type="radio" name="cursor_strategy" value="cut"
                             onChange={this._onFieldChange('cursor_strategy')}
                             defaultChecked={this.state.updatedExtractor.cursor_strategy === 'cut'}/>
                      Cut
                    </label>
                  </Input>

                  <Input type="text" id="title" label="Extractor title"
                         defaultValue={this.state.updatedExtractor.title}
                         labelClassName="col-md-2"
                         wrapperClassName="col-md-10"
                         onChange={this._onFieldChange('title')}
                         required
                         help="A descriptive name for this extractor."/>

                  <div style={{marginBottom: 20}}>
                    <EditExtractorConverters extractorType={this.state.updatedExtractor.type}
                                             converters={this.state.updatedExtractor.converters}
                                             onChange={this._onConverterChange}/>
                  </div>

                  <Input wrapperClassName="col-md-offset-2 col-md-10">
                    <Button type="submit" bsStyle="success">Update extractor</Button>
                  </Input>
                </form>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    );
  },
});

export default EditExtractor;