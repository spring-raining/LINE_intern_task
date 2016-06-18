'use strict';

import 'babel-polyfill';
import co from 'co';
import React from 'react';
import ReactDOM from 'react-dom';

class Index extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <h2>Index</h2>
      </div>
    );
  }
}


co(function *() {
  ReactDOM.render(
    <Index />,
    document.getElementById('reactapp')
  );
});
