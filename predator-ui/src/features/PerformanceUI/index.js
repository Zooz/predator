// import React from 'react'
// import { connect } from 'react-redux'
// import Page from '../../components/Page'
// import Panel from 'react-bootstrap/lib/Panel'
// import style from './style.scss'
//
// class PerformanceUI extends React.Component {
//   constructor (props) {
//     super(props);
//
//     this.state = {
//       openSnakeBar: false,
//       open: false
//     };
//   }
//
//     handleRequestClose = () => {
//       this.setState({
//         openSnakeBar: false
//       });
//     };
//     // TODO what is page
//     render () {
//       return (
//         <Page>
//           <div className={style.main}>
//             <Panel className={style.panel} bsStyle='primary'>
//               <Panel.Heading>
//                 <Panel.Title componentClass='h3'>Welcome to Predator</Panel.Title>
//               </Panel.Heading>
//               <Panel.Body>
//                 <div className={style.header}>Landing page content: bla bla</div>
//               </Panel.Body>
//             </Panel>
//           </div>
//         </Page>
//       )
//     }
// }
// // TODO do we need redux here?
// function mapStateToProps (state) {
//   return {
//
//   }
// }
//
// export default connect(mapStateToProps)(PerformanceUI);
