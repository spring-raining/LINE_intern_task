'use strict';

import 'babel-polyfill';
import co from 'co';
import React from 'react';
import ReactDOM from 'react-dom';

class Supervise extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <h2>Supervise</h2>
      </div>
    );
  }
}


co(function *() {
  ReactDOM.render(
    <Supervise />,
    document.getElementById('reactapp')
  );
});
