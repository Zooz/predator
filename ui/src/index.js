import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import App from './App'
import store from './store/index'
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import './style.scss'
import './globals.css'
import { DragDropContextProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

ReactDOM.render(

  <Provider store={store}>
    <MuiThemeProvider muiTheme={getMuiTheme(lightBaseTheme)}>
      <DragDropContextProvider backend={HTML5Backend}>

        <App />
      </DragDropContextProvider>
    </MuiThemeProvider>
  </Provider>
  , document.getElementById('root'));

if (module.hot) {
  module.hot.accept()
}
