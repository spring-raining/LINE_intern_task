'use strict';

import 'babel-polyfill';
import co from 'co';
import React from 'react';
import ReactDOM from 'react-dom';
import Mousetrap from 'mousetrap';
import fetch from './fetch';

class Supervise extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      judgingUser: null,
      oEmbedTweetHtml: null,
      maleScore: 0,
      femaleScore: 0,
    };
  }

  componentDidMount(prevProps, prevState) {
    Mousetrap.reset();
    Mousetrap.bind('m', this._onMaleButtonClick.bind(this));
    Mousetrap.bind('f', this._onFemaleButtonClick.bind(this));
    Mousetrap.bind('s', this._onSkipButtonClick.bind(this));
    Mousetrap.bind('enter', this._onSubmitButtonClick.bind(this));

    this.next.bind(this)();
  }

  componentDidUpdate(prevProps, prevState) {
    co(function* () {
      // fetch twitter status card
      if (this.state.judgingUser && this.state.judgingUser !== prevState.judgingUser) {
        if (!this.state.judgingUser.sampleTweetURL) {
          this.next.bind(this)();
        }
        else {
          const get = yield fetch('GET', 'https://publish.twitter.com/oembed', {
            url: this.state.judgingUser.sampleTweetURL,
            'omit_script': true,
          }, true);
          if (get.html) {
            this.setState({
              oEmbedTweetHtml: get.html,
            });
          }
        }
      }

      // run widgets.js
      if (this.state.oEmbedTweetHtml && this.state.oEmbedTweetHtml !== prevState.oEmbedTweetHtml) {
        const wjs = document.getElementById('twitter-wjs');
        if (wjs) {
          wjs.parentNode.removeChild(wjs);
        }

        !function(d, s, id) {
          var js, fjs = d.getElementsByTagName(s)[0],
            t = window.twttr || {};
          if (d.getElementById(id)) return t;
          js = d.createElement(s);
          js.id = id;
          js.src = "https://platform.twitter.com/widgets.js";
          fjs.parentNode.insertBefore(js, fjs);

          t._e = [];
          t.ready = function (f) {
            t._e.push(f);
          };

          return t;
        }(document, "script", "twitter-wjs");
      }
    }.bind(this));
  }

  next() {
    co(function *() {
      this.setState({
        maleScore: 0,
        femaleScore: 0,
      });

      const get = yield fetch('GET', '/api/supervise');
      if (!get.error) {
        this.setState({
          judgingUser: {
            id: get.userId,
            sampleTweetURL: get.sampleTweetURL,
          },
        });
      }
    }.bind(this));
  }

  judge() {
    co(function *() {
      if (this.state.maleScore + this.state.femaleScore >= 1) {
        yield fetch('POST', '/api/supervise', {
          userId: this.state.judgingUser.id,
          score: this.state.maleScore / (this.state.maleScore + this.state.femaleScore),
        });
      }
      this.next.bind(this)();
    }.bind(this));
  }

  render() {
    return (
      <div>
        <h2>Supervise</h2>
        <p><b>Male or Female?</b></p>
        <div className="button-group">
          <button onClick={this._onMaleButtonClick.bind(this)}>Male [M]</button>
          <button onClick={this._onFemaleButtonClick.bind(this)}>Female [F]</button>
          <button onClick={this._onSubmitButtonClick.bind(this)}>Submit [Enter]</button>
          <button onClick={this._onSkipButtonClick.bind(this)}>Skip [S]</button>
        </div>
        <p>Score : {this.state.maleScore / (this.state.maleScore + this.state.femaleScore)}</p>
        <div className="twitter-oembed"
             dangerouslySetInnerHTML={{__html: this.state.oEmbedTweetHtml}}>
        </div>
        <p>→ <a href="/">Top</a></p>
      </div>
    );
  }

  _onMaleButtonClick() {
    this.setState({
      maleScore: this.state.maleScore + 1,
    });
  }

  _onFemaleButtonClick() {
    this.setState({
      femaleScore: this.state.femaleScore + 1,
    });
  }
  
  _onSubmitButtonClick() {
    this.judge.bind(this)();
  }

  _onSkipButtonClick() {
    this.next.bind(this)();
  }
}

co(function *() {
  ReactDOM.render(
    <Supervise />,
    document.getElementById('reactapp')
  );
});
