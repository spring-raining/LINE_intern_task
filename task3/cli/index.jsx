'use strict';

import 'babel-polyfill';
import co from 'co';
import React from 'react';
import ReactDOM from 'react-dom';
import fetch from './fetch';

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      errorMessage: null,
      text: '',
      result: null,
      nowAnalyzing: false,
    };
  }

  judge() {
    if (this.state.text.length === 0) {
      return;
    }
    this.setState({
      errorMessage: null,
      result: null,
      nowAnalyzing: true,
    });
    co(function *() {
      try {
        const post = yield fetch('POST', '/api/analyze', {
          screenName: this.state.text,
        });
        this.setState({
          errorMessage: null,
          text: '',
          result: {
            screenName: this.state.text,
            score: +post.score,
          },
        });
      } catch (e) {
        if (e.errorMessage) {
          this.setState({errorMessage: e.errorMessage});
        }
      } finally {
        this.setState({
          nowAnalyzing: false,
        });
      }
    }.bind(this));
  }

  render() {
    const str = (number) => {
      if (number >= 0.5) {
        return number.toFixed(2) * 100 + '% Male!'
      } else {
        return (1 - number).toFixed(2) * 100 + '% Female!'
      }
    };
    const result = this.state.result
      ? `@${this.state.result.screenName} is ${str(this.state.result.score)}`
      : null;

    return (
      <div>
        <h2>Male or Female?</h2>

        <div className="input-form">
          <span>@</span>
          <input type="text" value={this.state.text}
                 autoFocus={true} 
                 onChange={this._onTextChange.bind(this)}
                 />
          <button onClick={this._onSubmit.bind(this)}>Judge</button>
        </div>
        <p className="analyzing-message">{this.state.nowAnalyzing? 'Now analyzing...' : null}</p>
        <p className="error-message">{this.state.errorMessage}</p>
        <div className="result">{result}</div>
        <p>→ <a href="/supervise">Supervise</a></p>
      </div>
    );
  }

  _onTextChange(e) {
    this.setState({
      text: e.target.value,
    });
  }

  _onSubmit() {
    this.judge.bind(this)();
  }
}

co(function *() {
  ReactDOM.render(
    <Index />,
    document.getElementById('reactapp')
  );
});
