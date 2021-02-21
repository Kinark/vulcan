import React from 'react'
import { Route, Switch } from 'react-router-dom'

import Home from '~/views/Home'
// import Component from '~/views/Component';

const AppRoutes = () => (
   <Switch>
      <Route exact path="/" component={Home} />
      {/* <Route exact path="/component" component={Component} /> */}
   </Switch>
)

export default AppRoutes
